import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type Msg = { role: "user" | "assistant" | "system"; content: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, propertyId } = (await req.json()) as {
      messages: Msg[];
      propertyId?: string;
    };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

    // Build context: load top properties and (optional) current property
    const { data: props } = await supabase
      .from("properties")
      .select("id,type,deal_type,district,address,price,price_per_m2,area,class,condition,features,floor,total_floors,ceiling_height")
      .limit(80);

    let currentProperty: any = null;
    if (propertyId) {
      const { data } = await supabase
        .from("properties")
        .select("*")
        .eq("id", propertyId)
        .maybeSingle();
      currentProperty = data;
    }

    const fmtPrice = (p: any) =>
      Number(p.price) > 0 ? `${Number(p.price).toLocaleString("ru-RU")} ₽${p.deal_type === "Аренда" ? "/мес" : ""}` : "по запросу";

    const propertiesList =
      (props ?? [])
        .map(
          (p: any) =>
            `• [${p.type} · ${p.deal_type}] ${p.address} (${p.district}), ${p.area} м², класс ${p.class}, ${fmtPrice(p)}`,
        )
        .join("\n") || "—";

    const currentBlock = currentProperty
      ? `\n\nТекущий объект, который смотрит пользователь:\n` +
        `• ${currentProperty.type} · ${currentProperty.deal_type}\n` +
        `• Адрес: ${currentProperty.address}, ${currentProperty.district}\n` +
        `• Площадь: ${currentProperty.area} м², этаж ${currentProperty.floor ?? "—"}/${currentProperty.total_floors ?? "—"}\n` +
        `• Класс: ${currentProperty.class}, состояние: ${currentProperty.condition ?? "—"}\n` +
        `• Цена: ${fmtPrice(currentProperty)}\n` +
        `• Удобства: ${(currentProperty.features ?? []).join(", ") || "—"}\n` +
        `• Описание: ${currentProperty.description ?? "—"}`
      : "";

    const systemPrompt = `Ты — ИИ-консультант агентства АРЕНДА СИТИ (Иркутск, Ангарск, Шелехов).
Помогаешь подобрать коммерческую недвижимость: офисы, торговые помещения, склады, производство, землю.

Правила:
- Только коммерческая недвижимость (не жилая).
- Работаем по Иркутску и области (Ангарск, Шелехов).
- Сделки: Аренда и Продажа.
- Если клиент готов оставить заявку — попроси имя и телефон, скажи что менеджер перезвонит в течение 15 минут.
- Если цена объекта "по запросу" — предложи оставить заявку на уточнение цены.
- Отвечай кратко, по-деловому, дружелюбно. Используй markdown (списки, **жирный**) для читаемости.
- Если вопрос вне темы — мягко возвращай к теме недвижимости.
- Контакты офиса: +7 (3952) 00-00-00, info@arendacity.ru.

Доступные объекты в базе (кратко):
${propertiesList}${currentBlock}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Слишком много запросов. Попробуйте через минуту." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Закончились кредиты Lovable AI." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
