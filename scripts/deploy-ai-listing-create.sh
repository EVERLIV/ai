#!/usr/bin/env bash
# Автономный деплой ai-listing-create на self-hosted Supabase.
# На VPS из любой папки:
#   bash /tmp/deploy-ai-listing-create.sh
# С локальной машины:
#   scp scripts/deploy-ai-listing-create.sh root@SERVER:/tmp/
#   ssh root@SERVER 'bash /tmp/deploy-ai-listing-create.sh'
# SQL (один раз): sql/listing_ai_sessions.sql

set -euo pipefail

SUPABASE_DIR="${SUPABASE_DIR:-/opt/supabase}"
ENV_FILE="${SUPABASE_ENV_FILE:-$SUPABASE_DIR/.env}"
API_URL="${API_URL:-https://api.arendacity.com}"
FN_NAME="ai-listing-create"

echo "==> Деплой $FN_NAME на self-hosted Supabase"
echo

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
  exit 1
fi

echo "    Каталог: $TARGET_DIR"
mkdir -p "$TARGET_DIR/$FN_NAME"
cat > "$TARGET_DIR/$FN_NAME/index.ts" <<'EOF_FN'
/**
 * Умное создание объявления — диалог Claude → structured draft.
 * Без внешних import (как ai-property-pick) — надёжнее на self-hosted.
 *
 * Env: ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
 *      SUPABASE_ANON_KEY (опционально)
 */
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MODEL = "claude-haiku-4-5";
const MAX_MESSAGES = 40;
const MAX_LENGTH = 2000;
const ANTHROPIC_TIMEOUT_MS = 22_000;

type Phase =
  | "intake"
  | "clarify"
  | "photos"
  | "enhance"
  | "preview"
  | "commit"
  | "done";

type ChatMsg = { role: "user" | "assistant"; content: string };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

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

function parseJsonObject(text: string): Record<string, unknown> | null {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced?.[1]?.trim() ?? trimmed;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start < 0 || end <= start) return null;
    try {
      return JSON.parse(raw.slice(start, end + 1)) as Record<string, unknown>;
    } catch {
      return null;
    }
  }
}

/** Anthropic Messages API: история должна начинаться с user и чередоваться. */
function toAnthropicMessages(
  history: ChatMsg[],
  lastUserContent: string,
): { role: "user" | "assistant"; content: string }[] {
  const cleaned: { role: "user" | "assistant"; content: string }[] = [];
  for (const m of history) {
    if (!m?.content?.trim()) continue;
    if (m.role !== "user" && m.role !== "assistant") continue;
    const last = cleaned[cleaned.length - 1];
    if (last && last.role === m.role) {
      last.content = `${last.content}\n\n${m.content}`;
    } else {
      cleaned.push({ role: m.role, content: m.content });
    }
  }
  while (cleaned.length && cleaned[0].role !== "user") cleaned.shift();
  // последний user уже добавлен в history; перезапишем контент с контекстом
  if (cleaned.length && cleaned[cleaned.length - 1].role === "user") {
    cleaned[cleaned.length - 1].content = lastUserContent;
  } else {
    cleaned.push({ role: "user", content: lastUserContent });
  }
  return cleaned;
}

function systemPrompt(segmentHint: string, phase: string): string {
  return `Ты — ассистент АрендаСити по размещению объектов недвижимости (Иркутск и область).
Веди диалог на русском, коротко и по делу, в дружелюбном тоне как у onboarding-чата.

Сегмент по умолчанию: ${segmentHint}.
Текущая фаза клиента: ${phase}.

Фазы:
- intake: попроси рассказать об объекте своими словами
- clarify: уточни недостающие поля блоками (тип, сделка, площадь, цена, адрес, описание)
- photos: попроси фото
- enhance: спроси, хочет ли улучшить фото (функция тестовая)
- preview: покажи, что карточка готова, спроси «всё верно?»
- commit: предложи создать черновик
- done: черновик уже создан

Правила заполнения draftPatch:
- commercial types: Офис, Торговая, Склад, Помещение, Павильон, Киоск, Земля
- residential types: Квартира, Дом, Комната, Таунхаус, Апартаменты, Дача, Коттедж, Участок
- land: сегмент land, types Земля или Участок
- deal_type: Аренда | Продажа | Посуточно
- Не выдумывай кадастр, координаты, точный адрес — только из слов клиента
- Цену и площадь пиши числами
- description — связный текст 2–5 предложений из рассказа клиента
- missingFields — ключи полей, которых ещё нет
- suggestedQuestions — 1–3 коротких варианта ответа для кнопок
- Когда area, price, address, types, deal_type и description заполнены → readyForPhotos=true и phase=photos
- Когда клиент подтвердил карточку → readyToCommit=true, phase=commit

Ответь ТОЛЬКО одним JSON-объектом без markdown:
{
  "reply": "текст ответа клиенту",
  "phase": "intake|clarify|photos|enhance|preview|commit|done",
  "draftPatch": { ...только известные поля... },
  "missingFields": ["types","deal_type",...],
  "suggestedQuestions": ["вариант1","вариант2"],
  "readyForPhotos": false,
  "readyToCommit": false
}`;
}

function mergeDraft(
  base: Record<string, unknown>,
  patch: Record<string, unknown>,
): Record<string, unknown> {
  const out = { ...base };
  for (const [k, v] of Object.entries(patch || {})) {
    if (v === null || v === undefined) continue;
    if (typeof v === "string" && !v.trim()) continue;
    if (typeof v === "number" && !Number.isFinite(v)) continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out;
}

async function getUserId(
  supabaseUrl: string,
  authHeader: string,
): Promise<string | null> {
  const apikey =
    Deno.env.get("SUPABASE_ANON_KEY") ||
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
    "";
  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: {
      Authorization: authHeader,
      apikey,
    },
  });
  if (!res.ok) {
    console.error("auth/v1/user", res.status, await res.text().catch(() => ""));
    return null;
  }
  const data = await res.json().catch(() => null);
  return data?.id ? String(data.id) : null;
}

function serviceHeaders(serviceKey: string) {
  return {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const t0 = Date.now();
  try {
    const anthropicKey = readAnthropicKey();
    if (!anthropicKey || !anthropicKey.startsWith("sk-ant-")) {
      return json({ error: "ANTHROPIC_API_KEY не настроен" }, 500);
    }

    const supabaseUrl = (Deno.env.get("SUPABASE_URL") || "").replace(/\/$/, "");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (!supabaseUrl || !serviceKey) {
      return json({ error: "SUPABASE_URL / SERVICE_ROLE не настроены" }, 500);
    }

    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.toLowerCase().startsWith("bearer ")) {
      return json({ error: "Нужна авторизация" }, 401);
    }

    const userId = await getUserId(supabaseUrl, authHeader);
    if (!userId) {
      return json(
        { error: "Сессия недействительна. Выйдите и войдите снова." },
        401,
      );
    }

    const body = await req.json().catch(() => ({}));
    const message = String(body.message || "").trim().slice(0, MAX_LENGTH);
    const segmentHint = ["commercial", "residential", "land"].includes(
        body.segmentHint,
      )
      ? body.segmentHint
      : "commercial";
    const clientPhase = String(body.phase || "intake") as Phase;
    const clientDraft =
      body.clientDraft && typeof body.clientDraft === "object"
        ? (body.clientDraft as Record<string, unknown>)
        : {};
    let sessionId =
      typeof body.sessionId === "string" && body.sessionId
        ? body.sessionId
        : null;

    if (!message && !body.bootstrap) {
      return json({ error: "Пустое сообщение" }, 400);
    }

    let messages: ChatMsg[] = [];
    let draft: Record<string, unknown> = {
      segment: segmentHint,
      ...clientDraft,
    };
    let phase: Phase = clientPhase;
    let propertyId: string | null = null;
    const hdr = serviceHeaders(serviceKey);

    if (sessionId) {
      const rowRes = await fetch(
        `${supabaseUrl}/rest/v1/listing_ai_sessions?id=eq.${encodeURIComponent(sessionId)}&user_id=eq.${encodeURIComponent(userId)}&select=*&limit=1`,
        { headers: hdr },
      );
      const rows = await rowRes.json().catch(() => []);
      const row = Array.isArray(rows) ? rows[0] : null;
      if (row) {
        messages = Array.isArray(row.messages) ? row.messages : [];
        draft = {
          ...((row.draft as Record<string, unknown>) || {}),
          ...clientDraft,
        };
        phase = (row.phase as Phase) || phase;
        propertyId = row.property_id || null;
      } else {
        sessionId = null;
      }
    }

    if (!sessionId) {
      const createRes = await fetch(
        `${supabaseUrl}/rest/v1/listing_ai_sessions`,
        {
          method: "POST",
          headers: hdr,
          body: JSON.stringify({
            user_id: userId,
            segment: segmentHint,
            phase: "intake",
            messages: [],
            draft: { segment: segmentHint },
          }),
        },
      );
      const created = await createRes.json().catch(() => null);
      const row = Array.isArray(created) ? created[0] : created;
      if (!createRes.ok || !row?.id) {
        console.error("session create", createRes.status, created);
        return json(
          {
            error:
              "Не удалось создать сессию. Примените sql/listing_ai_sessions.sql на сервере.",
          },
          500,
        );
      }
      sessionId = String(row.id);
      draft = { segment: segmentHint, ...clientDraft };
      phase = "intake";
      messages = [];
    }

    if (body.bootstrap && !message) {
      const welcome =
        segmentHint === "residential"
          ? "Здравствуйте! Расскажите о жилье, которое хотите разместить: тип, район, площадь, цена и что важно арендатору или покупателю."
          : segmentHint === "land"
          ? "Здравствуйте! Расскажите об участке: где находится, площадь, назначение, цена аренды или продажи."
          : "Здравствуйте! Расскажите о коммерческом объекте своими словами — тип, адрес или район, площадь, ставка и особенности.";
      messages = [{ role: "assistant", content: welcome }];
      await fetch(
        `${supabaseUrl}/rest/v1/listing_ai_sessions?id=eq.${encodeURIComponent(sessionId!)}&user_id=eq.${encodeURIComponent(userId)}`,
        {
          method: "PATCH",
          headers: { ...hdr, Prefer: "return=minimal" },
          body: JSON.stringify({
            messages,
            draft,
            phase: "intake",
            updated_at: new Date().toISOString(),
          }),
        },
      );

      return json({
        sessionId,
        reply: welcome,
        phase: "intake",
        draft,
        missingFields: [
          "types",
          "deal_type",
          "area",
          "price",
          "address",
          "description",
        ],
        suggestedQuestions: ["Офис в аренду", "Квартира на продажу", "Склад"],
        readyForPhotos: false,
        readyToCommit: false,
        propertyId,
        reasonedMs: Date.now() - t0,
      });
    }

    messages = [...messages, { role: "user", content: message }].slice(
      -MAX_MESSAGES,
    );

    const contextBlock =
      `Текущий черновик JSON:\n${JSON.stringify(draft)}\nФаза: ${phase}`;
    const lastUserContent =
      `${contextBlock}\n\nСообщение клиента:\n${message}`;
    const anthropicMessages = toAnthropicMessages(messages, lastUserContent);

    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort("timeout"), ANTHROPIC_TIMEOUT_MS);
    let aiResp: Response;
    try {
      aiResp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        signal: ac.signal,
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 1200,
          system: systemPrompt(segmentHint, phase),
          messages: anthropicMessages,
        }),
      });
    } finally {
      clearTimeout(timer);
    }

    if (!aiResp.ok) {
      const errText = await aiResp.text();
      console.error("Anthropic error", aiResp.status, errText.slice(0, 500));
      if (aiResp.status === 429) {
        return json(
          { error: "Слишком много запросов к ИИ. Подождите минуту." },
          429,
        );
      }
      return json({ error: `Ошибка ИИ (${aiResp.status})` }, 502);
    }

    const aiData = await aiResp.json();
    if (aiData.stop_reason === "refusal") {
      return json({ error: "Модель отклонила запрос" }, 502);
    }
    const textBlock = (aiData.content ?? []).find(
      (b: { type: string }) => b.type === "text",
    );
    const rawText = String(textBlock?.text || "");
    const parsedObj = parseJsonObject(rawText);
    if (!parsedObj || typeof parsedObj.reply !== "string") {
      console.error("bad model json", rawText.slice(0, 300));
      return json({ error: "Некорректный ответ модели" }, 502);
    }

    const draftPatch =
      parsedObj.draftPatch && typeof parsedObj.draftPatch === "object"
        ? (parsedObj.draftPatch as Record<string, unknown>)
        : {};
    draft = mergeDraft(draft, draftPatch);
    if (!draft.segment) draft.segment = segmentHint;
    const nextPhase = String(parsedObj.phase || phase) as Phase;
    phase = nextPhase;

    const reply = String(parsedObj.reply);
    messages = [...messages, { role: "assistant", content: reply }].slice(
      -MAX_MESSAGES,
    );

    await fetch(
      `${supabaseUrl}/rest/v1/listing_ai_sessions?id=eq.${encodeURIComponent(sessionId!)}&user_id=eq.${encodeURIComponent(userId)}`,
      {
        method: "PATCH",
        headers: { ...hdr, Prefer: "return=minimal" },
        body: JSON.stringify({
          messages,
          draft,
          phase,
          segment: String(draft.segment || segmentHint),
          updated_at: new Date().toISOString(),
        }),
      },
    );

    return json({
      sessionId,
      reply,
      phase,
      draft,
      missingFields: Array.isArray(parsedObj.missingFields)
        ? parsedObj.missingFields.map(String)
        : [],
      suggestedQuestions: Array.isArray(parsedObj.suggestedQuestions)
        ? parsedObj.suggestedQuestions.map(String).slice(0, 3)
        : [],
      readyForPhotos: Boolean(parsedObj.readyForPhotos),
      readyToCommit: Boolean(parsedObj.readyToCommit),
      propertyId,
      reasonedMs: Date.now() - t0,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(e);
    if (
      message.includes("abort") ||
      message.includes("timeout") ||
      message.includes("Timeout")
    ) {
      return json(
        { error: "ИИ не ответил вовремя. Попробуйте ещё раз." },
        504,
      );
    }
    return json(
      { error: e instanceof Error ? e.message : "Внутренняя ошибка" },
      500,
    );
  }
});

EOF_FN

echo "    записан $TARGET_DIR/$FN_NAME/index.ts"
ls -la "$TARGET_DIR/$FN_NAME/"

if [ -f "$ENV_FILE" ] && grep -q "^ANTHROPIC_API_KEY=.\+" "$ENV_FILE" 2>/dev/null; then
  echo "    ANTHROPIC_API_KEY: ok"
else
  echo "    WARNING: ANTHROPIC_API_KEY missing in $ENV_FILE" >&2
fi

echo "==> Restart functions..."
if [ -f "$SUPABASE_DIR/docker-compose.yml" ] || [ -f "$SUPABASE_DIR/compose.yaml" ]; then
  (cd "$SUPABASE_DIR" && docker compose up -d functions --force-recreate)
else
  docker restart supabase-edge-functions
fi
sleep 4

echo "==> Smoke (expect 401 without user JWT)"
RESP="$(curl -sS --max-time 20 -X POST "$API_URL/functions/v1/$FN_NAME" \
  -H "Content-Type: application/json" -d '{}' -w "\nHTTP:%{http_code}" 2>&1 || true)"
echo "$RESP" | tail -8
HTTP="$(echo "$RESP" | grep -o 'HTTP:[0-9]*' | tail -1 | cut -d: -f2 || true)"
case "${HTTP:-}" in
  401)
    echo "OK: entrypoint live (401 Unauthorized as expected)."
    ;;
  500)
    BODY="$(echo "$RESP" | sed '/^HTTP:/d')"
    if echo "$BODY" | grep -qi entrypoint; then
      echo "FAIL: still InvalidWorkerCreation" >&2
      exit 1
    fi
    echo "HTTP 500 but not entrypoint error — check ANTHROPIC / SQL table."
    ;;
  *)
    echo "Unexpected HTTP ${HTTP:-none}. Check logs."
    ;;
esac

echo
echo "Remember SQL once: apply sql/listing_ai_sessions.sql on the DB."
