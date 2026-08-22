/** Shared helpers for agency Telegram bot + notifications */

export type AgencyTelegramRow = {
  id: string;
  name: string;
  telegram_enabled: boolean;
  telegram_chat_id: number | null;
  telegram_chat_title: string | null;
  telegram_notify_leads: boolean;
  telegram_notify_views: boolean;
  telegram_notify_moderation: boolean;
};

export type NotifyType = "lead" | "view";

export function botToken() {
  return Deno.env.get("AGENCY_TELEGRAM_BOT_TOKEN") || "";
}

export function siteUrl() {
  return (Deno.env.get("SITE_URL") || "https://arendacity.com").replace(/\/$/, "");
}

export function supabaseUrl() {
  return Deno.env.get("SUPABASE_URL") || Deno.env.get("CATALOG_URL") || "";
}

export function serviceRoleKey() {
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
}

export function internalSecret() {
  return Deno.env.get("AGENCY_NOTIFY_INTERNAL_SECRET") || "";
}

export function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export async function tgSend(chatId: number, text: string) {
  const token = botToken();
  if (!token) throw new Error("AGENCY_TELEGRAM_BOT_TOKEN не задан");

  const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.ok) {
    throw new Error(data.description || `Telegram HTTP ${resp.status}`);
  }
  return data;
}

export async function fetchAgencyById(agencyId: string): Promise<AgencyTelegramRow | null> {
  const base = supabaseUrl();
  const key = serviceRoleKey();
  if (!base || !key) return null;

  const qs = new URLSearchParams({
    id: `eq.${agencyId}`,
    select: "id,name,telegram_enabled,telegram_chat_id,telegram_chat_title,telegram_notify_leads,telegram_notify_views,telegram_notify_moderation",
  });
  const res = await fetch(`${base}/rest/v1/agencies?${qs}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  const rows = await res.json().catch(() => []);
  if (!res.ok || !Array.isArray(rows) || !rows[0]) return null;
  return rows[0] as AgencyTelegramRow;
}

export async function fetchAgencyByChatId(chatId: number) {
  const base = supabaseUrl();
  const key = serviceRoleKey();
  if (!base || !key) return null;

  const qs = new URLSearchParams({
    telegram_chat_id: `eq.${chatId}`,
    select: "id,name,telegram_enabled,telegram_chat_id,telegram_chat_title,telegram_notify_leads,telegram_notify_views,telegram_notify_moderation,telegram_connected_at",
  });
  const res = await fetch(`${base}/rest/v1/agencies?${qs}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  const rows = await res.json().catch(() => []);
  if (!res.ok || !Array.isArray(rows) || !rows[0]) return null;
  return rows[0] as AgencyTelegramRow & { telegram_connected_at: string | null };
}

export async function patchAgency(agencyId: string, body: Record<string, unknown>) {
  const base = supabaseUrl();
  const key = serviceRoleKey();
  if (!base || !key) throw new Error("Supabase service role не настроен");

  const res = await fetch(`${base}/rest/v1/agencies?id=eq.${agencyId}`, {
    method: "PATCH",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = typeof data === "object" && data && "message" in data
      ? String((data as { message: string }).message)
      : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return Array.isArray(data) ? data[0] : data;
}

export async function fetchPropertyAgencyId(propertyId: string): Promise<{
  agency_id: string | null;
  address: string;
  public_id: string | null;
} | null> {
  const base = supabaseUrl();
  const key = serviceRoleKey();
  if (!base || !key) return null;

  const qs = new URLSearchParams({
    id: `eq.${propertyId}`,
    select: "agency_id,address,public_id",
  });
  const res = await fetch(`${base}/rest/v1/properties?${qs}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  const rows = await res.json().catch(() => []);
  if (!res.ok || !Array.isArray(rows) || !rows[0]) return null;
  return rows[0] as { agency_id: string | null; address: string; public_id: string | null };
}

export function notifyFlagForType(agency: AgencyTelegramRow, type: NotifyType): boolean {
  if (type === "lead") return agency.telegram_notify_leads;
  return agency.telegram_notify_views;
}

export async function sendAgencyNotification(
  agencyId: string,
  type: NotifyType,
  text: string,
): Promise<{ sent: boolean; reason?: string }> {
  const agency = await fetchAgencyById(agencyId);
  if (!agency) return { sent: false, reason: "agency_not_found" };
  if (!agency.telegram_enabled || !agency.telegram_chat_id) {
    return { sent: false, reason: "telegram_not_connected" };
  }
  if (!notifyFlagForType(agency, type)) {
    return { sent: false, reason: "notify_disabled" };
  }
  await tgSend(agency.telegram_chat_id, text);
  return { sent: true };
}
