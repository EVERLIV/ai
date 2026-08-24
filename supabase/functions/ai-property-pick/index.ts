const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const PICK_MODEL = "claude-haiku-4-5";
const ANTHROPIC_TIMEOUT_MS = 25_000;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json; charset=utf-8",
    },
  });
}

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
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const { criteria, properties } = (await req.json()) as {
      criteria: Criteria;
      properties: PropertyLite[];
    };

    const ANTHROPIC_API_KEY = readAnthropicKey();
    if (!ANTHROPIC_API_KEY)
      return json({ error: "ANTHROPIC_API_KEY is not configured" }, 500);
    if (!ANTHROPIC_API_KEY.startsWith("sk-ant-")) {
      return json({ error: "ANTHROPIC_API_KEY имеет неверный формат" }, 500);
    }

    if (!properties?.length)
      return json({ picks: [], summary: "Нет объектов для выбора" });

    const shortlist = properties.slice(0, 40);

    const systemPrompt = `Ты — эксперт по коммерческой недвижимости в Иркутске.
Выбери до 3 объектов, которые лучше всего подходят под запрос.
Ответь ТОЛЬКО JSON без markdown:
{"summary":"2 предложения на русском","picks":[{"id":"...","fit_score":0,"reason":"1-2 предложения","highlights":["плюс","плюс"]}]}
id бери только из списка. fit_score — число 0-100.`;

    const userPrompt = `КРИТЕРИИ:
${JSON.stringify(criteria)}

ОБЪЕКТЫ:
${shortlist
  .map(
    (p) =>
      `${p.id} | ${p.type} | ${p.deal_type} | ${p.district} | ${p.address} | ${p.price} | ${p.area}м² | ${p.class} | ${p.condition ?? "-"} | ${(p.features ?? []).slice(0, 6).join(",") || "-"}`,
  )
  .join("\n")}`;

    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort("timeout"), ANTHROPIC_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        signal: ac.signal,
        body: JSON.stringify({
          model: PICK_MODEL,
          max_tokens: 1024,
          system: systemPrompt,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      const detail = await response.text();
      console.error("Anthropic error:", response.status, detail.slice(0, 400));
      if (response.status === 429)
        return json(
          { error: "Слишком много запросов к ИИ. Попробуйте через минуту." },
          429,
        );
      return json({ error: "Ошибка ИИ-сервиса" }, 502);
    }

    const data = await response.json();
    const text =
      (data?.content ?? []).find((b: { type: string }) => b.type === "text")
        ?.text ?? "";
    const parsed = parseJsonObject(text);
    if (!parsed || !Array.isArray(parsed.picks)) {
      console.error(
        "Anthropic: нет JSON",
        data?.stop_reason,
        String(text).slice(0, 200),
      );
      return json({
        summary: "ИИ не вернул структурированный ответ.",
        picks: [],
      });
    }

    return json(parsed);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Неизвестная ошибка";
    console.error("ai-property-pick error:", e);
    if (
      message.includes("abort") ||
      message.includes("Timeout") ||
      message.includes("timed out")
    ) {
      return json(
        {
          error:
            "ИИ не ответил вовремя. Проверьте исходящий доступ к api.anthropic.com",
        },
        504,
      );
    }
    return json({ error: message }, 500);
  }
});
