const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Дешёвая текстовая модель: подбор идёт по готовому короткому списку. */
const PICK_MODEL = "claude-haiku-4-5";

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

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not configured");

    if (!properties?.length) {
      return new Response(
        JSON.stringify({ picks: [], reason: "Нет объектов для выбора" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Trim to keep prompt small
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
