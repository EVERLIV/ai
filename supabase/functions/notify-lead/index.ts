/**
 * Уведомление о заявке с сайта → Telegram-группа.
 *
 * Секреты (Supabase → Edge Functions → Secrets):
 *   TELEGRAM_BOT_TOKEN  — токен бота
 *   TELEGRAM_CHAT_ID    — id приватной группы (например -100…)
 *
 * Как узнать chat id группы:
 *   1) Добавьте бота в группу и сделайте администратором
 *   2) Напишите любое сообщение в группу
 *   3) Откройте: https://api.telegram.org/bot<TOKEN>/getUpdates
 *   4) Возьмите result[].message.chat.id
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type LeadPayload = {
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
  consultation_widget: "Виджет консультации",
  homepage_owner: "Главная — сдать объект",
  category_contact: "Заявка по категории",
  management_request: "Передача в управление",
  website: "Сайт",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatLead(lead: LeadPayload) {
  const source = SOURCE_LABELS[lead.source || ""] || lead.source || "Заявка";
  const lines = [
    `<b>Новая заявка — ${escapeHtml(source)}</b>`,
    lead.name ? `👤 <b>Имя:</b> ${escapeHtml(lead.name)}` : "",
    lead.phone ? `📞 <b>Телефон:</b> ${escapeHtml(lead.phone)}` : "",
    lead.email ? `✉️ <b>Email:</b> ${escapeHtml(lead.email)}` : "",
    lead.business_category
      ? `📍 <b>Объект/тема:</b> ${escapeHtml(lead.business_category)}`
      : "",
    lead.object_id ? `🆔 <b>ID объекта:</b> <code>${escapeHtml(lead.object_id)}</code>` : "",
    lead.message ? `\n💬 ${escapeHtml(lead.message)}` : "",
    lead.id ? `\n<code>${escapeHtml(lead.id)}</code>` : "",
  ];
  return lines.filter(Boolean).join("\n");
}

async function sendTelegram(text: string) {
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = (await req.json().catch(() => ({}))) as LeadPayload & { website?: string };
    // Honeypot from forms
    if (body.website) return json({ ok: true, skipped: "bot" });

    if (!body.phone && !body.name && !body.message) {
      return json({ error: "Пустая заявка" }, 400);
    }

    const text = formatLead(body);
    await sendTelegram(text);

    return json({ ok: true });
  } catch (e) {
    console.error("notify-lead:", e);
    return json({ error: e instanceof Error ? e.message : "Ошибка" }, 500);
  }
});
