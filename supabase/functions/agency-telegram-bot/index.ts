/**
 * Webhook бота агентств (опционально): /status, /help
 * Привязка чата — в кабинете агентства (ID группы), без /connect.
 *
 * Уведомления отправляются напрямую через Bot API (agency-notify),
 * webhook нужен только для команд в группе.
 */

import {
  escapeHtml,
  fetchAgencyByChatId,
  tgSend,
} from "../_shared/agencyTelegram.ts";

type TgChat = { id: number; type: string; title?: string };
type TgMessage = { message_id: number; chat: TgChat; text?: string };
type TgUpdate = { update_id: number; message?: TgMessage };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function parseCommand(text: string): { cmd: string; args: string } {
  const t = text.trim();
  if (!t.startsWith("/")) return { cmd: "", args: "" };
  const space = t.indexOf(" ");
  const raw = space === -1 ? t.slice(1) : t.slice(1, space);
  const cmd = raw.split("@")[0].toLowerCase();
  const args = space === -1 ? "" : t.slice(space + 1).trim();
  return { cmd, args };
}

async function handleStatus(chatId: number) {
  const agency = await fetchAgencyByChatId(chatId);
  if (!agency) {
    await tgSend(
      chatId,
      "Этот чат не указан в кабинете агентства. Добавьте ID группы в личном кабинете → Telegram.",
    );
    return;
  }

  const flags = [
    agency.telegram_notify_leads ? "✓ Заявки" : "✗ Заявки",
    agency.telegram_notify_views ? "✓ Просмотры" : "✗ Просмотры",
  ].join("\n");

  await tgSend(
    chatId,
    `<b>${escapeHtml(agency.name)}</b>\nСтатус: ${agency.telegram_enabled ? "включено" : "выключено"}\n\n${flags}`,
  );
}

async function handleHelp(chatId: number) {
  await tgSend(
    chatId,
    `<b>АрендаСити — бот для агентств</b>\n\nID этой группы укажите в личном кабинете → Telegram.\n/status — статус уведомлений\n/help — эта справка`,
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  const secret = Deno.env.get("AGENCY_TELEGRAM_WEBHOOK_SECRET") || "";
  const url = new URL(req.url);
  if (secret && url.searchParams.get("secret") !== secret) {
    return json({ error: "Forbidden" }, 403);
  }

  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const update = (await req.json()) as TgUpdate;
    const msg = update.message;
    if (!msg?.text) return json({ ok: true, skipped: "no_text" });

    const chatId = msg.chat.id;
    const { cmd } = parseCommand(msg.text);

    if (cmd === "status") {
      await handleStatus(chatId);
      return json({ ok: true });
    }

    if (cmd === "help" || cmd === "start") {
      await handleHelp(chatId);
      return json({ ok: true });
    }

    return json({ ok: true, skipped: "ignored" });
  } catch (e) {
    console.error("agency-telegram-bot:", e);
    return json({ error: e instanceof Error ? e.message : "Error" }, 500);
  }
});
