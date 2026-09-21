/**
 * Маркетинговые рассылки ДАДАТУТ через Timeweb SMTP.
 *
 * Secrets: SMTP_*, NOTIFY_EMAIL_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SITE_URL
 *
 * POST body:
 *   mode: "preview" | "test" | "campaign"
 *   subject, headline, body, ctaLabel?, ctaUrl?, heroImageUrl?
 *   testTo? (для test)
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  emailFromDefaults,
  emailSiteUrl,
  emailSmtpDomain,
} from "../_shared/emailTheme.ts";
import {
  buildNewsletterHtml,
  buildNewsletterText,
} from "../_shared/newsletterTemplate.ts";
import { sendSmtp } from "../_shared/smtpSend.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info, x-notify-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BATCH_SIZE = 25;
const BATCH_PAUSE_MS = 800;
const MAX_CAMPAIGN = 500;

type Body = {
  mode?: string;
  subject?: string;
  headline?: string;
  headlineRed?: string;
  intro?: string;
  greetingRed?: string;
  greetingRest?: string;
  body?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  heroImageUrl?: string | null;
  testTo?: string | null;
  createdBy?: string | null;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function requireSecret(req: Request): Response | null {
  const secret = Deno.env.get("NOTIFY_EMAIL_SECRET");
  if (!secret) return null;
  const given = req.headers.get("x-notify-secret") || "";
  if (given !== secret) return json({ error: "Forbidden" }, 403);
  return null;
}

function serviceClient() {
  const url = Deno.env.get("SUPABASE_URL") || "";
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!url || !key) throw new Error("SUPABASE_URL / SERVICE_ROLE_KEY не заданы");
  return createClient(url, key, { auth: { persistSession: false } });
}

async function smtpConfig() {
  const host = Deno.env.get("SMTP_HOST") || "smtp.timeweb.ru";
  const port = Number(Deno.env.get("SMTP_PORT") || "587");
  const username = Deno.env.get("SMTP_USER") || "";
  const password = Deno.env.get("SMTP_PASS") || "";
  const { from, fromName } = emailFromDefaults();
  if (!username || !password) throw new Error("SMTP_USER или SMTP_PASS не заданы");
  return {
    hostname: host,
    port: Number.isFinite(port) ? port : 587,
    username,
    password,
    from,
    fromName,
    ehloDomain: emailSmtpDomain(),
  };
}

function contentFromBody(body: Body, unsubscribeUrl: string) {
  const subject = (body.subject || "").trim();
  const headline = (body.headline || "").trim();
  const text = (body.body || "").trim();
  if (!subject || !headline || !text) {
    throw new Error("Нужны subject, headline и body");
  }
  return {
    subject,
    headlineRed: (body.headlineRed || "").trim() || undefined,
    headline,
    intro: (body.intro || "").trim() || undefined,
    greetingRed: (body.greetingRed || "").trim() || undefined,
    greetingRest: (body.greetingRest || "").trim() || undefined,
    body: text,
    ctaLabel: (body.ctaLabel || "Скачать презентацию").trim(),
    ctaUrl: (body.ctaUrl || `${emailSiteUrl()}/`).trim(),
    heroImageUrl: (body.heroImageUrl || "").trim() || null,
    unsubscribeUrl,
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  const denied = requireSecret(req);
  if (denied) return denied;

  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    const mode = (body.mode || "").trim();
    const site = emailSiteUrl();
    const placeholderUnsub = `${site}/unsubscribe?token=preview`;

    if (mode === "preview") {
      const content = contentFromBody(body, placeholderUnsub);
      return json({
        ok: true,
        html: buildNewsletterHtml(content),
        text: buildNewsletterText(content),
      });
    }

    const smtp = await smtpConfig();

    if (mode === "test") {
      const to = (body.testTo || "").trim().toLowerCase();
      if (!to) return json({ error: "Укажите testTo" }, 400);
      const content = contentFromBody(
        body,
        `${site}/unsubscribe?token=test`,
      );
      const html = buildNewsletterHtml(content);
      const text = buildNewsletterText(content);
      await sendSmtp({
        ...smtp,
        to,
        subject: `[тест] ${content.subject}`,
        html,
        text,
        extraHeaders: [
          `List-Unsubscribe: <${content.unsubscribeUrl}>`,
          "List-Unsubscribe-Post: List-Unsubscribe=One-Click",
        ],
      });
      return json({ ok: true, sent: 1, to });
    }

    if (mode !== "campaign") {
      return json({ error: "mode: preview | test | campaign" }, 400);
    }

    const db = serviceClient();
    const { data: subs, error: subErr } = await db
      .from("newsletter_subscribers")
      .select("id, email, unsubscribe_token, full_name")
      .eq("marketing_opt_in", true)
      .is("unsubscribed_at", null)
      .order("created_at", { ascending: true })
      .limit(MAX_CAMPAIGN);

    if (subErr) throw new Error(subErr.message);
    const list = subs || [];
    if (list.length === 0) {
      return json({ ok: true, skipped: "no_subscribers", sent: 0 });
    }

    const draftContent = contentFromBody(body, placeholderUnsub);
    const { data: campaign, error: campErr } = await db
      .from("newsletter_campaigns")
      .insert({
        subject: draftContent.subject,
        headline: draftContent.headline,
        body: draftContent.body,
        cta_label: draftContent.ctaLabel,
        cta_url: draftContent.ctaUrl,
        hero_image_url: draftContent.heroImageUrl || "",
        status: "sending",
        created_by: body.createdBy || null,
        recipient_count: list.length,
      })
      .select("id")
      .single();

    if (campErr || !campaign) throw new Error(campErr?.message || "campaign insert");

    let sent = 0;
    let failed = 0;

    for (let i = 0; i < list.length; i++) {
      const sub = list[i];
      const unsubUrl = `${site}/unsubscribe?token=${sub.unsubscribe_token}`;
      const content = {
        ...draftContent,
        unsubscribeUrl: unsubUrl,
      };
      const html = buildNewsletterHtml(content);
      const text = buildNewsletterText(content);

      try {
        await sendSmtp({
          ...smtp,
          to: sub.email,
          subject: content.subject,
          html,
          text,
          extraHeaders: [
            `List-Unsubscribe: <${unsubUrl}>`,
            "List-Unsubscribe-Post: List-Unsubscribe=One-Click",
          ],
        });
        sent += 1;
        await db.from("newsletter_sends").insert({
          campaign_id: campaign.id,
          subscriber_id: sub.id,
          email: sub.email,
          status: "sent",
          sent_at: new Date().toISOString(),
        });
      } catch (e) {
        failed += 1;
        await db.from("newsletter_sends").insert({
          campaign_id: campaign.id,
          subscriber_id: sub.id,
          email: sub.email,
          status: "failed",
          error: e instanceof Error ? e.message : String(e),
        });
      }

      if ((i + 1) % BATCH_SIZE === 0 && i + 1 < list.length) {
        await sleep(BATCH_PAUSE_MS);
      }
    }

    const status =
      failed === 0 ? "sent" : sent === 0 ? "failed" : "partial";
    await db
      .from("newsletter_campaigns")
      .update({
        status,
        sent_count: sent,
        fail_count: failed,
        finished_at: new Date().toISOString(),
      })
      .eq("id", campaign.id);

    return json({
      ok: true,
      campaignId: campaign.id,
      recipientCount: list.length,
      sent,
      failed,
      status,
    });
  } catch (e) {
    console.error("send-newsletter:", e);
    return json({ error: e instanceof Error ? e.message : "Ошибка" }, 500);
  }
});
