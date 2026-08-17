#!/usr/bin/env bash
#
# Автономный деплой ai-property-pick на self-hosted Supabase.
# Репозиторий на сервере не нужен — код функции вшит в этот файл.
#
# На VPS, из любой папки (в том числе /opt/supabase):
#   bash /tmp/deploy-ai-property-pick.sh
#
# С локальной машины:
#   scp scripts/deploy-ai-property-pick.sh root@СЕРВЕР:/tmp/
#   ssh root@СЕРВЕР 'bash /tmp/deploy-ai-property-pick.sh'

set -euo pipefail

SUPABASE_DIR="${SUPABASE_DIR:-/opt/supabase}"
ENV_FILE="${SUPABASE_ENV_FILE:-$SUPABASE_DIR/.env}"
API_URL="${API_URL:-https://api.arendacity.com}"
FN_NAME="ai-property-pick"

echo "==> Деплой $FN_NAME на self-hosted Supabase"
echo

# --- Каталог функций ---

TARGET_DIR="${SUPABASE_FUNCTIONS_DIR:-}"
if [ -z "$TARGET_DIR" ]; then
  TARGET_DIR="$(docker inspect supabase-edge-functions \
    --format '{{range .Mounts}}{{if eq .Destination "/home/deno/functions"}}{{.Source}}{{end}}{{end}}' \
    2>/dev/null || true)"
fi
if [ -z "$TARGET_DIR" ] || [ ! -d "$TARGET_DIR" ]; then
  for candidate in \
    "$SUPABASE_DIR/volumes/functions" \
    "$SUPABASE_DIR/functions" \
    /var/lib/supabase/functions; do
    if [ -d "$candidate" ]; then
      TARGET_DIR="$candidate"
      break
    fi
  done
fi
if [ -z "$TARGET_DIR" ] || [ ! -d "$TARGET_DIR" ]; then
  echo "Ошибка: не найден каталог edge-функций." >&2
  echo "Посмотрите монтирования:" >&2
  echo "  docker inspect supabase-edge-functions --format '{{range .Mounts}}{{.Source}} -> {{.Destination}}{{println}}{{end}}'" >&2
  echo "Затем: SUPABASE_FUNCTIONS_DIR=<путь> bash $0" >&2
  exit 1
fi

echo "    Каталог функций: $TARGET_DIR"
echo "    Было:"
ls -1 "$TARGET_DIR" 2>/dev/null | sed 's/^/      /' || true
echo

# --- ANTHROPIC_API_KEY ---

if [ -f "$ENV_FILE" ] && grep -q "^ANTHROPIC_API_KEY=.\+" "$ENV_FILE" 2>/dev/null; then
  echo "    ✓ ANTHROPIC_API_KEY есть в $ENV_FILE"
else
  echo "    ⚠ ANTHROPIC_API_KEY не найден в $ENV_FILE" >&2
  echo "      Функция развернётся, но ИИ не ответит, пока не добавите ключ:" >&2
  echo "        nano $ENV_FILE" >&2
  echo "        # строка: ANTHROPIC_API_KEY=sk-ant-..." >&2
  echo "        cd $SUPABASE_DIR && docker compose up -d functions" >&2
fi
echo

# --- Запись функции ---

mkdir -p "$TARGET_DIR/$FN_NAME"
cat > "$TARGET_DIR/$FN_NAME/index.ts" <<'EOF_FN'
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Дешёвая текстовая модель: подбор идёт по готовому короткому списку. */
const PICK_MODEL = "claude-haiku-4-5";

/** Deno fetch запрещает CR/LF и не-ASCII в заголовках (ByteString). */
function readAnthropicKey(): string {
  return (Deno.env.get("ANTHROPIC_API_KEY") ?? "")
    .replace(/^\uFEFF/, "")
    .replace(/[\r\n\t]/g, "")
    .trim()
    .replace(/^["']+|["']+$/g, "")
    .split("#")[0]
    .trim()
    .replace(/[^\x20-\x7E]/g, "");
}

interface Criteria {
  deal?: string;
  type?: string;
  activity?: string;
  district?: string;
  budget_min?: number | null;
  budget_max?: number | null;
  area_min?: number | null;
  area_max?: number | null;
  property_class?: string;
  condition?: string;
  features?: string[];
  parking?: boolean;
  notes?: string;
}

interface PropertyLite {
  id: string;
  type: string;
  deal_type: string;
  district: string;
  address: string;
  price: number;
  price_per_m2: number;
  area: number;
  class: string;
  condition: string | null;
  features: string[] | null;
  floor: string | null;
  total_floors: string | null;
  ceiling_height: number | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { criteria, properties } = (await req.json()) as {
      criteria: Criteria;
      properties: PropertyLite[];
    };

    const ANTHROPIC_API_KEY = readAnthropicKey();
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");
    if (!ANTHROPIC_API_KEY.startsWith("sk-ant-")) {
      throw new Error("ANTHROPIC_API_KEY имеет неверный формат");
    }

    if (!properties?.length) {
      return new Response(
        JSON.stringify({ picks: [], reason: "Нет объектов для выбора" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const shortlist = properties.slice(0, 60);

    const systemPrompt = `Ты — эксперт по коммерческой недвижимости в Иркутске.
Тебе дают критерии клиента и список объектов из CRM.
Выбери до 3 объектов, которые ЛУЧШЕ всего подходят под запрос (учитывая вид деятельности, бюджет, площадь, район, класс, состояние, удобства).
Для каждого выбранного объекта объясни КОРОТКО (1-2 предложения) почему он подходит — на русском, по-деловому, без воды.
Если ничего идеально не подходит — выбери близкие варианты и честно скажи, в чём компромисс.`;

    const userPrompt = `КРИТЕРИИ КЛИЕНТА:
${JSON.stringify(criteria, null, 2)}

ОБЪЕКТЫ (id | тип | сделка | район | адрес | цена ₽ | ₽/м² | площадь м² | класс | состояние | удобства):
${shortlist
  .map(
    (p) =>
      `${p.id} | ${p.type} | ${p.deal_type} | ${p.district} | ${p.address} | ${p.price} | ${p.price_per_m2} | ${p.area} | ${p.class} | ${p.condition ?? "-"} | ${(p.features ?? []).join(", ") || "-"}`,
  )
  .join("\n")}

Выбери лучшие варианты и обоснуй каждый.`;

    const PICK_SCHEMA = {
      type: "object",
      properties: {
        summary: {
          type: "string",
          description: "Короткое резюме (2-3 предложения) — что подобрано и почему.",
        },
        picks: {
          type: "array",
          items: {
            type: "object",
            properties: {
              id: { type: "string", description: "id объекта из переданного списка" },
              fit_score: { type: "number", description: "Соответствие 0-100" },
              reason: { type: "string", description: "1-2 предложения почему объект подходит" },
              highlights: {
                type: "array",
                items: { type: "string" },
                description: "2-4 ключевых плюса (короткие фразы)",
              },
            },
            required: ["id", "fit_score", "reason", "highlights"],
            additionalProperties: false,
          },
        },
      },
      required: ["summary", "picks"],
      additionalProperties: false,
    };

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: PICK_MODEL,
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
        output_config: { format: { type: "json_schema", schema: PICK_SCHEMA } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Слишком много запросов к ИИ. Попробуйте через минуту." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await response.text();
      console.error("Anthropic error:", response.status, t);
      return new Response(JSON.stringify({ error: "Ошибка ИИ-сервиса" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const textBlock = (data?.content ?? []).find(
      (b: { type: string }) => b.type === "text",
    ) as { text?: string } | undefined;

    if (data?.stop_reason === "refusal" || !textBlock?.text) {
      console.error("Anthropic: нет структурированного ответа", data?.stop_reason);
      return new Response(
        JSON.stringify({ summary: "ИИ не вернул структурированный ответ.", picks: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let args: unknown;
    try {
      args = JSON.parse(textBlock.text);
    } catch {
      console.error("Anthropic: ответ не JSON");
      return new Response(
        JSON.stringify({ summary: "ИИ не вернул структурированный ответ.", picks: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify(args), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-property-pick error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Неизвестная ошибка",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
EOF_FN

echo "    ✓ Записан $TARGET_DIR/$FN_NAME/index.ts"
echo
echo "    Стало:"
ls -1 "$TARGET_DIR" | sed 's/^/      /'
echo

# --- Перезапуск ---

echo "==> Перезапуск supabase-edge-functions..."
if [ -f "$SUPABASE_DIR/docker-compose.yml" ] || [ -f "$SUPABASE_DIR/compose.yaml" ]; then
  (cd "$SUPABASE_DIR" && docker compose up -d functions --force-recreate)
else
  docker restart supabase-edge-functions
fi
echo "    ✓ Контейнер перезапущен"
sleep 4

# --- Проверка ---

echo
echo "==> Проверка $API_URL/functions/v1/$FN_NAME"

ANON_KEY=""
if [ -f "$ENV_FILE" ]; then
  ANON_KEY="$(grep -E '^(ANON_KEY|SUPABASE_ANON_KEY)=' "$ENV_FILE" | head -1 | cut -d= -f2- | tr -d "\"'" || true)"
fi

PAYLOAD='{"criteria":{"deal":"Аренда","type":"Офис","district":"Любой"},"properties":[{"id":"test-1","type":"Офис","deal_type":"Аренда","district":"Центр","address":"ул. Тестовая, 1","price":50000,"price_per_m2":1000,"area":50,"class":"B","condition":"Хорошее","features":["парковка"],"floor":"3","total_floors":"10","ceiling_height":3}]}'

CURL_ARGS=(-sS --max-time 60 -X POST "$API_URL/functions/v1/$FN_NAME" -H "Content-Type: application/json" -d "$PAYLOAD" -w "\nHTTP:%{http_code}")
if [ -n "$ANON_KEY" ]; then
  CURL_ARGS+=(-H "Authorization: Bearer $ANON_KEY" -H "apikey: $ANON_KEY")
fi

RESP="$(curl "${CURL_ARGS[@]}" 2>&1 || true)"
HTTP="$(echo "$RESP" | grep -o 'HTTP:[0-9]*' | tail -1 | cut -d: -f2)"
BODY="$(echo "$RESP" | sed '/^HTTP:/d' | head -c 500)"

echo "    HTTP: ${HTTP:-?}"
echo "    Ответ: $BODY"
echo

case "${HTTP:-}" in
  200)
    if echo "$BODY" | grep -q '"picks"'; then
      echo "✅ ai-property-pick работает на self-hosted."
    elif echo "$BODY" | grep -q 'ANTHROPIC_API_KEY'; then
      echo "⚠ Функция на месте, но нет ANTHROPIC_API_KEY." >&2
      echo "  Добавьте в $ENV_FILE строку ANTHROPIC_API_KEY=sk-ant-..." >&2
      echo "  Затем: cd $SUPABASE_DIR && docker compose up -d functions" >&2
      exit 1
    else
      echo "⚠ HTTP 200, но странный ответ. Логи:" >&2
      echo "  cd $SUPABASE_DIR && docker compose logs --tail=40 functions" >&2
      exit 1
    fi
    ;;
  401|403)
    echo "⚠ Авторизация ($HTTP). Проверьте ANON_KEY в $ENV_FILE." >&2
    exit 1
    ;;
  *)
    echo "❌ Проверка не прошла (HTTP ${HTTP:-нет ответа})." >&2
    echo "   Логи: cd $SUPABASE_DIR && docker compose logs --tail=40 functions" >&2
    echo "   Файл: ls -la $TARGET_DIR/$FN_NAME/" >&2
    exit 1
    ;;
esac
