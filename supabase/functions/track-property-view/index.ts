/**
 * Трекинг просмотра карточки объекта + уведомление агентству.
 * POST { property_id: string }
 */

import {
  fetchPropertyAgencyId,
  internalSecret,
  sendAgencyNotification,
  siteUrl,
  supabaseUrl,
  serviceRoleKey,
  escapeHtml,
} from "../_shared/agencyTelegram.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function incrementView(propertyId: string): Promise<number | null> {
  const base = supabaseUrl();
  const key = serviceRoleKey();
  if (!base || !key) return null;

  const getRes = await fetch(
    `${base}/rest/v1/properties?id=eq.${propertyId}&select=views_count`,
    { headers: { apikey: key, Authorization: `Bearer ${key}` } },
  );
  const rows = await getRes.json().catch(() => []);
  const current = Array.isArray(rows) && rows[0] ? Number(rows[0].views_count) || 0 : 0;
  const next = current + 1;

  await fetch(`${base}/rest/v1/properties?id=eq.${propertyId}`, {
    method: "PATCH",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ views_count: next }),
  });

  await fetch(`${base}/rest/v1/crm_events`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      object_id: propertyId,
      event_type: "view",
      source_page: "property_detail",
      payload: {},
    }),
  }).catch(() => {});

  return next;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const { property_id: propertyId } = await req.json().catch(() => ({})) as { property_id?: string };
    if (!propertyId) return json({ error: "property_id required" }, 400);

    const prop = await fetchPropertyAgencyId(propertyId);
    if (!prop) return json({ error: "Property not found" }, 404);

    const viewsCount = await incrementView(propertyId);

    let notified = false;
    if (prop.agency_id) {
      const text = `<b>👁 Просмотр объекта</b>\n${escapeHtml(prop.address)}${
        viewsCount != null ? `\nВсего просмотров: ${viewsCount}` : ""
      }\n<a href="${siteUrl()}/property/${propertyId}">Открыть</a>`;
      const result = await sendAgencyNotification(prop.agency_id, "view", text);
      notified = result.sent;
    }

    return json({ ok: true, views_count: viewsCount, notified });
  } catch (e) {
    console.error("track-property-view:", e);
    return json({ error: e instanceof Error ? e.message : "Error" }, 500);
  }
});
