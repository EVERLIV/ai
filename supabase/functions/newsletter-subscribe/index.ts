/**
 * Подписка на рассылку (double opt-in): POST { email, fullName?, source? }
 * Публичный endpoint. Активным подписчик становится только после перехода
 * по ссылке из письма — до этого marketing_opt_in остаётся false.
 *
 * Ответ намеренно одинаков для нового, повторного и уже подтверждённого
 * адреса, чтобы endpoint нельзя было использовать для перебора базы.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  emailButton,
  emailFromDefaults,
  emailLayout,
  emailSiteUrl,
  emailSmtpDomain,
  escapeHtml,
} from "../_shared/emailTheme.ts";
import { sendSmtp } from "../_shared/smtpSend.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = (await req.json().catch(() => ({}))) as {
      email?: string;
      fullName?: string;
      source?: string;
      mode?: string;
      token?: string;
    };

    const url0 = Deno.env.get("SUPABASE_URL") || "";
    const key0 = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    // Переход по ссылке из письма
    if (body.mode === "confirm") {
      const token = (body.token || "").trim();
      if (!token) return json({ error: "token required" }, 400);
      if (!url0 || !key0) throw new Error("SUPABASE env missing");
      const db0 = createClient(url0, key0, { auth: { persistSession: false } });
      const { data, error } = await db0.rpc("confirm_newsletter_subscription", {
        p_token: token,
      });
      if (error) throw new Error(error.message);
      return json({ ok: true, confirmed: Boolean(data) });
    }

    const email = (body.email || "").trim().toLowerCase();
    if (!email || !EMAIL_RE.test(email) || email.length > 254) {
      return json({ error: "Укажите корректный email" }, 400);
    }

    const url = Deno.env.get("SUPABASE_URL") || "";
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (!url || !key) throw new Error("SUPABASE env missing");

    const db = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await db.rpc("request_newsletter_subscription", {
      p_email: email,
      p_full_name: (body.fullName || "").trim().slice(0, 120),
      p_source: (body.source || "site").slice(0, 40),
    });
    if (error) throw new Error(error.message);

    const row = Array.isArray(data) ? data[0] : data;
    const token = row?.confirm_token as string | undefined;
    const alreadyConfirmed = Boolean(row?.already_confirmed);

    // Подтверждённым повторное письмо не шлём — но ответ не отличается.
    if (alreadyConfirmed || !token) {
      return json({ ok: true, pending: true });
    }

    const site = emailSiteUrl();
    const confirmUrl = `${site}/newsletter/confirm?token=${encodeURIComponent(token)}`;

    const host = Deno.env.get("SMTP_HOST") || "";
    const password = Deno.env.get("SMTP_PASS") || "";
    const username = Deno.env.get("SMTP_USER") || "";
    if (!host || !password || !username) {
      // Заявка сохранена; без SMTP письмо просто не уходит.
      console.error("newsletter-subscribe: SMTP env missing");
      return json({ ok: true, pending: true, mailed: false });
    }

    const { from, fromName } = emailFromDefaults();
    const html = emailLayout(
      "Подтвердите подписку",
      `
        <h1 style="margin:0 0 12px;font-size:22px;">Подтвердите подписку</h1>
        <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">
          Вы запросили подписку на новые предложения недвижимости.
          Нажмите кнопку, чтобы подтвердить адрес ${escapeHtml(email)}.
        </p>
        ${emailButton(confirmUrl, "Подтвердить подписку")}
        <p style="margin:16px 0 0;font-size:13px;line-height:1.6;color:#676E79;">
          Если вы не оформляли подписку — просто проигнорируйте это письмо,
          рассылка не начнётся.
        </p>
      `,
    );

    await sendSmtp({
      hostname: host,
      port: Number(Deno.env.get("SMTP_PORT") || 587),
      username,
      password,
      from,
      fromName,
      to: email,
      subject: "Подтвердите подписку — ДАДАТУТ",
      html,
      text: `Подтвердите подписку на рассылку: ${confirmUrl}`,
      ehloDomain: emailSmtpDomain(),
    });

    return json({ ok: true, pending: true, mailed: true });
  } catch (e) {
    console.error("newsletter-subscribe:", e);
    return json({ error: e instanceof Error ? e.message : "Ошибка" }, 500);
  }
});
