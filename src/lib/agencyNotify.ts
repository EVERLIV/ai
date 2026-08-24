export const TRACK_VIEW_URL =
  import.meta.env.VITE_TRACK_PROPERTY_VIEW_URL ||
  import.meta.env.VITE_NOTIFY_LEAD_URL?.replace(
    "/notify-lead",
    "/track-property-view",
  ) ||
  "https://xbdwapunrlnxcuxjhaca.supabase.co/functions/v1/track-property-view";

export async function trackPropertyView(propertyId: string): Promise<void> {
  try {
    await fetch(TRACK_VIEW_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ property_id: propertyId }),
    });
  } catch (e) {
    console.warn("track-property-view:", e);
  }
}
