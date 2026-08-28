import {
  fetchPropertyAgencyId,
  internalSecret,
  supabaseUrl,
} from "./agencyTelegram.ts";

export type LeadPayload = {
  id?: string | null;
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  message?: string | null;
  source?: string | null;
  business_category?: string | null;
  object_id?: string | null;
  status?: string | null;
};

const SOURCE_LABELS: Record<string, string> = {
  contacts_page: "Контакты",
  price_offer: "Предложение цены",
  owner_message: "Вопрос по объекту",
  property_contact: "Форма на объекте",
  property_inquiry: "Заявка по объекту",
  consultation_widget: "Виджет консультации",
  homepage_owner: "Главная — сдать объект",
  vacancies_page: "Отклик на вакансию",
  category_contact: "Заявка по категории",
  management_request: "Передача в управление",
  docs_bug_report: "Баг на сайте",
  specialist_quiz: "Квиз специалистов",
  realtor_contact: "Риелтор",
  agency_contact: "Агентство",
  developer_contact: "Застройщик",
  catalog_sidebar: "Подбор из каталога",
  catalog_search_alert: "Подписка на поиск",
  ai_chat: "ИИ-чат",
  specialist_contact: "Специалист",
  specialist_quiz: "Квиз специалистов",
  docs_handbook: "Справочник",
  website: "Сайт",
};

export function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export function formatLeadTelegram(lead: LeadPayload) {
  const source = SOURCE_LABELS[lead.source || ""] || lead.source || "Заявка";
  const lines = [
    `<b>Новая заявка — ${escapeHtml(source)}</b>`,
    lead.name ? `👤 <b>Имя:</b> ${escapeHtml(lead.name)}` : "",
    lead.phone ? `📞 <b>Телефон:</b> ${escapeHtml(lead.phone)}` : "",
    lead.email ? `✉️ <b>Email:</b> ${escapeHtml(lead.email)}` : "",
    lead.business_category
      ? `📍 <b>Объект/тема:</b> ${escapeHtml(lead.business_category)}`
      : "",
    lead.object_id
      ? `🆔 <b>ID объекта:</b> <code>${escapeHtml(lead.object_id)}</code>`
      : "",
    lead.message ? `\n💬 ${escapeHtml(lead.message)}` : "",
    lead.id ? `\n<code>${escapeHtml(lead.id)}</code>` : "",
  ];
  return lines.filter(Boolean).join("\n");
}

export async function sendOpsTelegram(text: string) {
  const token = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const chatId = Deno.env.get("TELEGRAM_CHAT_ID");
  if (!token || !chatId) {
    throw new Error("TELEGRAM_BOT_TOKEN или TELEGRAM_CHAT_ID не заданы");
  }

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

export async function insertCrmLead(row: Record<string, unknown>) {
  const base = supabaseUrl();
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!base || !key) {
    throw new Error("SUPABASE_URL или SUPABASE_SERVICE_ROLE_KEY не заданы");
  }

  const resp = await fetch(`${base.replace(/\/$/, "")}/rest/v1/crm_leads`, {
    method: "POST",
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(row),
    signal: AbortSignal.timeout(8_000),
  });

  const data = await resp.json().catch(() => null);
  if (!resp.ok) {
    const msg =
      data && typeof data === "object" && "message" in data
        ? String((data as { message: string }).message)
        : `HTTP ${resp.status}`;
    throw new Error(msg);
  }

  const inserted = Array.isArray(data) ? data[0] : data;
  return inserted as { id?: string } | null;
}

export async function notifyAgencyForLead(body: LeadPayload) {
  if (!body.object_id) return;
  const prop = await fetchPropertyAgencyId(body.object_id);
  if (!prop?.agency_id) return;

  const base = supabaseUrl();
  const secret = internalSecret();
  if (!base) return;

  await fetch(`${base.replace(/\/$/, "")}/functions/v1/agency-notify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(secret ? { "X-Agency-Notify-Secret": secret } : {}),
    },
    body: JSON.stringify({
      type: "lead",
      agency_id: prop.agency_id,
      payload: body,
    }),
    signal: AbortSignal.timeout(5_000),
  }).catch((e) => console.warn("agency-notify:", e));
}
