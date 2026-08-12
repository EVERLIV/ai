import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

/**
 * Стартовый пакет для голосового агента ElevenLabs:
 *  - conversation token (WebRTC)
 *  - актуальный каталог объектов (чтобы агент «знал всё»)
 *
 * Secrets: ELEVENLABS_API_KEY, CATALOG_URL, CATALOG_ANON_KEY
 * Optional body: { agent_id, property_id?, include_catalog?: true }
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CATALOG_URL = Deno.env.get("CATALOG_URL") || "https://api.arendacity.com";
const CATALOG_ANON_KEY = Deno.env.get("CATALOG_ANON_KEY") || "";
const SITE_URL = (Deno.env.get("SITE_URL") || "https://arendacity.com").replace(/\/$/, "");
const DEFAULT_AGENT = Deno.env.get("ELEVENLABS_AGENT_ID") || "";

const num = (v: unknown) => Number(v) || 0;
const fmt = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

let catalogCache: { summary: string; text: string; at: number } = { summary: "", text: "", at: 0 };

async function loadCatalog(propertyId?: string) {
  if (catalogCache.text && Date.now() - catalogCache.at < 5 * 60_000 && !propertyId) {
    return catalogCache;
  }

  const params = new URLSearchParams({
    is_active: "eq.true",
    select:
      "id,public_id,type,district,address,price,price_per_m2,area,class,condition,features,floor,total_floors,deposit,deal_type",
    order: "price.asc.nullslast",
    limit: "300",
  });

  const resp = await fetch(`${CATALOG_URL}/rest/v1/properties?${params}`, {
    headers: {
      apikey: CATALOG_ANON_KEY,
      Authorization: `Bearer ${CATALOG_ANON_KEY}`,
    },
  });
  if (!resp.ok) throw new Error(`catalog ${resp.status}`);

  const rows = (await resp.json()) as Record<string, unknown>[];
  const text = rows
    .map((p) => {
      const link = `${SITE_URL}/property/${p.id}`;
      const parts = [
        `${p.deal_type || "Аренда"} · ${p.type || "—"} · ${p.address}${p.district ? ` (${p.district})` : ""}`,
        `${num(p.area)} м²`,
        num(p.price) > 0
          ? `${fmt(num(p.price))} ₽${String(p.deal_type || "").includes("Продаж") ? "" : "/мес"}`
          : "по запросу",
      ];
      if (num(p.price_per_m2) > 0) parts.push(`${fmt(num(p.price_per_m2))} ₽/м²`);
      if (p.class) parts.push(`класс ${p.class}`);
      return `• [${p.public_id || String(p.id).slice(0, 8)}] ${parts.join(" · ")} | ${link}`;
    })
    .join("\n") || "Сейчас опубликованных объектов нет.";

  const prices = rows.map((p) => num(p.price)).filter((v) => v > 0);
  const byType: Record<string, number> = {};
  for (const p of rows) byType[String(p.type ?? "—")] = (byType[String(p.type ?? "—")] ?? 0) + 1;

  let focus = "";
  if (propertyId) {
    const hit = rows.find((p) => String(p.id) === propertyId);
    if (hit) {
      focus =
        `Клиент открыл карточку объекта: [${hit.public_id || hit.id}] ${hit.address}` +
        `${hit.district ? ` (${hit.district})` : ""}, ${num(hit.area)} м², ` +
        `${num(hit.price) > 0 ? fmt(num(hit.price)) + " ₽" : "цена по запросу"}. ` +
        `Ссылка: ${SITE_URL}/property/${hit.id}`;
    }
  }

  const summary = [
    focus,
    `Всего активных объектов: ${rows.length}.`,
    `По типам: ${Object.entries(byType).map(([t, n]) => `${t} — ${n}`).join(", ") || "—"}.`,
    prices.length ? `Цены: от ${fmt(Math.min(...prices))} до ${fmt(Math.max(...prices))} ₽.` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const packed = { summary, text, at: Date.now() };
  if (!propertyId) catalogCache = packed;
  return packed;
}

/** Поиск по каталогу для client tool агента */
async function searchCatalog(body: {
  query?: string;
  type?: string;
  district?: string;
  max_price?: number;
  min_area?: number;
  max_area?: number;
  limit?: number;
}) {
  const cat = await loadCatalog();
  const q = (body.query || "").toLowerCase().trim();
  const type = (body.type || "").toLowerCase().trim();
  const district = (body.district || "").toLowerCase().trim();
  const maxPrice = Number(body.max_price) || 0;
  const minArea = Number(body.min_area) || 0;
  const maxArea = Number(body.max_area) || 0;
  const limit = Math.min(Math.max(Number(body.limit) || 8, 1), 20);

  // Перечитываем сырые строки — проще фильтровать заново
  const params = new URLSearchParams({
    is_active: "eq.true",
    select: "id,public_id,type,district,address,price,area,deal_type",
    order: "price.asc.nullslast",
    limit: "300",
  });
  const resp = await fetch(`${CATALOG_URL}/rest/v1/properties?${params}`, {
    headers: {
      apikey: CATALOG_ANON_KEY,
      Authorization: `Bearer ${CATALOG_ANON_KEY}`,
    },
  });
  if (!resp.ok) throw new Error(`catalog search ${resp.status}`);
  let rows = (await resp.json()) as Record<string, unknown>[];

  rows = rows.filter((p) => {
    if (type && !String(p.type || "").toLowerCase().includes(type)) return false;
    if (district) {
      const hay = `${p.district || ""} ${p.address || ""}`.toLowerCase();
      if (!hay.includes(district)) return false;
    }
    if (maxPrice > 0 && num(p.price) > 0 && num(p.price) > maxPrice) return false;
    if (minArea > 0 && num(p.area) > 0 && num(p.area) < minArea) return false;
    if (maxArea > 0 && num(p.area) > 0 && num(p.area) > maxArea) return false;
    if (q) {
      const hay = `${p.type || ""} ${p.district || ""} ${p.address || ""} ${p.deal_type || ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const slice = rows.slice(0, limit);
  if (!slice.length) {
    return { count: 0, result: "Подходящих объектов не найдено.", summary: cat.summary };
  }

  const result = slice
    .map((p) => {
      const price = num(p.price) > 0 ? `${fmt(num(p.price))} ₽` : "по запросу";
      return `• ${p.type || "—"} · ${p.address}${p.district ? ` (${p.district})` : ""} · ${num(p.area)} м² · ${price} · ${SITE_URL}/property/${p.id}`;
    })
    .join("\n");

  return { count: rows.length, shown: slice.length, result, summary: cat.summary };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({})) as Record<string, unknown>;

    // Режим поиска для client tool (без токена)
    if (body.action === "search") {
      const data = await searchCatalog({
        query: String(body.query || ""),
        type: String(body.type || ""),
        district: String(body.district || ""),
        max_price: Number(body.max_price) || undefined,
        min_area: Number(body.min_area) || undefined,
        max_area: Number(body.max_area) || undefined,
        limit: Number(body.limit) || undefined,
      });
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" },
      });
    }

    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    if (!ELEVENLABS_API_KEY) {
      return new Response(JSON.stringify({ error: "ELEVENLABS_API_KEY is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const agent_id = String(body.agent_id || DEFAULT_AGENT || "");
    if (!agent_id) {
      return new Response(JSON.stringify({ error: "agent_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const includeCatalog = body.include_catalog !== false;
    const propertyId = body.property_id ? String(body.property_id) : undefined;

    const tokenResp = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${encodeURIComponent(agent_id)}`,
      { headers: { "xi-api-key": ELEVENLABS_API_KEY } },
    );

    if (!tokenResp.ok) {
      const errorText = await tokenResp.text();
      console.error("ElevenLabs token error:", tokenResp.status, errorText);
      return new Response(
        JSON.stringify({ error: `ElevenLabs API error [${tokenResp.status}]` }),
        { status: tokenResp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const tokenData = await tokenResp.json();
    let catalog: { summary: string; text: string } | null = null;
    if (includeCatalog && CATALOG_ANON_KEY) {
      try {
        const c = await loadCatalog(propertyId);
        // Лимит контекста: summary всегда, полный список обрезаем
        const maxChars = 14000;
        catalog = {
          summary: c.summary,
          text: c.text.length > maxChars ? c.text.slice(0, maxChars) + "\n… (каталог обрезан, используй search_properties)" : c.text,
        };
      } catch (e) {
        console.error("catalog for voice:", e);
      }
    }

    return new Response(
      JSON.stringify({
        ...tokenData,
        agent_id,
        site_url: SITE_URL,
        catalog,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8" } },
    );
  } catch (e) {
    console.error("Token generation error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
