import {
  SERVICE_ROLE_KEY,
  SUPABASE_URL,
} from "@/integrations/supabase/adminClient";

function getTrackViewUrl(): string {
  const explicit = import.meta.env.VITE_TRACK_PROPERTY_VIEW_URL?.trim();
  if (explicit) return explicit;
  const base = import.meta.env.VITE_SUPABASE_URL?.trim().replace(/\/$/, "");
  if (base) return `${base}/functions/v1/track-property-view`;
  return "https://xbdwapunrlnxcuxjhaca.supabase.co/functions/v1/track-property-view";
}

export const TRACK_VIEW_URL = getTrackViewUrl();

/** Инкремент views_count на self-hosted, если cloud edge недоступен / CORS. */
async function incrementViewsLocal(propertyId: string): Promise<void> {
  const getRes = await fetch(
    `${SUPABASE_URL}/rest/v1/properties?id=eq.${encodeURIComponent(propertyId)}&select=views_count`,
    {
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      },
    },
  );
  const rows = await getRes.json().catch(() => []);
  const current =
    Array.isArray(rows) && rows[0] ? Number(rows[0].views_count) || 0 : 0;

  await fetch(
    `${SUPABASE_URL}/rest/v1/properties?id=eq.${encodeURIComponent(propertyId)}`,
    {
      method: "PATCH",
      headers: {
        apikey: SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ views_count: current + 1 }),
    },
  );

  await fetch(`${SUPABASE_URL}/rest/v1/crm_events`, {
    method: "POST",
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      object_id: propertyId,
      event_type: "view",
      source_page: "property_detail",
      payload: {},
    }),
  }).catch(() => {});
}

export async function trackPropertyView(propertyId: string): Promise<void> {
  try {
    const res = await fetch(TRACK_VIEW_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ property_id: propertyId }),
    });
    if (res.ok) return;
  } catch {
    // CORS / сеть — fallback ниже
  }

  try {
    await incrementViewsLocal(propertyId);
  } catch (e) {
    console.warn("track-property-view fallback:", e);
  }
}
