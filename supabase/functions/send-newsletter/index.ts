/**
 * Маркетинговые рассылки ДАДАТУТ через Timeweb SMTP.
 *
 * Secrets: SMTP_*, NOTIFY_EMAIL_SECRET, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SITE_URL
 *
 * POST body modes:
 *   preview | test | enqueue | process_queue | campaign
 *   campaign — legacy sync send (small lists)
 *   enqueue — put opt-in subscribers into pending queue
 *   process_queue — cron worker: drain pending if sending_enabled
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
  type NewsletterContent,
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
const MAX_CAMPAIGN = 2000;

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
  templateKey?: string | null;
  testTo?: string | null;
  createdBy?: string | null;
  limit?: number | null;
};

type CampaignPayload = {
  subject: string;
  headline: string;
  headlineRed?: string;
  intro?: string;
  greetingRed?: string;
  greetingRest?: string;
  body: string;
  ctaLabel: string;
  ctaUrl: string;
  heroImageUrl?: string | null;
  templateKey: string;
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

function contentFromBody(body: Body, unsubscribeUrl: string): NewsletterContent & { templateKey: string } {
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
    templateKey: (body.templateKey || "partner_kp").trim() || "partner_kp",
  };
}

function payloadFromContent(
  c: ReturnType<typeof contentFromBody>,
): CampaignPayload {
  return {
    subject: c.subject,
    headline: c.headline,
    headlineRed: c.headlineRed,
    intro: c.intro,
    greetingRed: c.greetingRed,
    greetingRest: c.greetingRest,
    body: c.body,
    ctaLabel: c.ctaLabel || "Скачать презентацию",
    ctaUrl: c.ctaUrl || `${emailSiteUrl()}/`,
    heroImageUrl: c.heroImageUrl || null,
    templateKey: c.templateKey,
  };
}

function contentFromPayload(
  payload: CampaignPayload,
  unsubscribeUrl: string,
): NewsletterContent {
  return {
    subject: payload.subject,
    headline: payload.headline,
    headlineRed: payload.headlineRed,
    intro: payload.intro,
    greetingRed: payload.greetingRed,
    greetingRest: payload.greetingRest,
    body: payload.body,
    ctaLabel: payload.ctaLabel,
    ctaUrl: payload.ctaUrl,
    heroImageUrl: payload.heroImageUrl,
    unsubscribeUrl,
  };
}

async function finalizeCampaign(
  db: ReturnType<typeof serviceClient>,
  campaignId: string,
) {
  const { count: pending } = await db
    .from("newsletter_sends")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId)
    .in("status", ["pending", "processing"]);

  if ((pending ?? 0) > 0) return;

  const { count: sent } = await db
    .from("newsletter_sends")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId)
    .eq("status", "sent");

  const { count: failed } = await db
    .from("newsletter_sends")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId)
    .eq("status", "failed");

  const s = sent ?? 0;
  const f = failed ?? 0;
  const status = f === 0 ? "sent" : s === 0 ? "failed" : "partial";
  await db
    .from("newsletter_campaigns")
    .update({
      status,
      sent_count: s,
      fail_count: f,
      finished_at: new Date().toISOString(),
    })
    .eq("id", campaignId)
    .in("status", ["queued", "sending"]);
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

    if (mode === "settings_get") {
      const db = serviceClient();
      const { data, error } = await db
        .from("newsletter_settings")
        .select("sending_enabled, batch_size, updated_at")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return json({
        ok: true,
        sendingEnabled: data?.sending_enabled ?? false,
        batchSize: data?.batch_size ?? 25,
        updatedAt: data?.updated_at ?? null,
      });
    }

    if (mode === "settings_set") {
      const db = serviceClient();
      const enabled = Boolean(
        (body as { sendingEnabled?: boolean }).sendingEnabled ??
          (body as { sending_enabled?: boolean }).sending_enabled,
      );
      const batchRaw = Number(
        (body as { batchSize?: number }).batchSize ??
          (body as { batch_size?: number }).batch_size ??
          25,
      );
      const batchSize = Math.min(100, Math.max(1, Number.isFinite(batchRaw) ? batchRaw : 25));
      const { data, error } = await db
        .from("newsletter_settings")
        .upsert({
          id: 1,
          sending_enabled: enabled,
          batch_size: batchSize,
          updated_at: new Date().toISOString(),
        })
        .select("sending_enabled, batch_size, updated_at")
        .single();
      if (error) throw new Error(error.message);
      return json({
        ok: true,
        sendingEnabled: data.sending_enabled,
        batchSize: data.batch_size,
        updatedAt: data.updated_at,
      });
    }

    if (mode === "queue_status") {
      const db = serviceClient();
      const { count: pending } = await db
        .from("newsletter_sends")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      const { count: processing } = await db
        .from("newsletter_sends")
        .select("id", { count: "exact", head: true })
        .eq("status", "processing");
      const { data: settings } = await db
        .from("newsletter_settings")
        .select("sending_enabled, batch_size")
        .eq("id", 1)
        .maybeSingle();
      return json({
        ok: true,
        pending: pending ?? 0,
        processing: processing ?? 0,
        sendingEnabled: settings?.sending_enabled ?? false,
        batchSize: settings?.batch_size ?? 25,
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

    /** Put campaign into pending queue — cron drains it when enabled */
    if (mode === "enqueue") {
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
        return json({ ok: true, skipped: "no_subscribers", queued: 0 });
      }

      const draft = contentFromBody(body, placeholderUnsub);
      const payload = payloadFromContent(draft);

      const { data: campaign, error: campErr } = await db
        .from("newsletter_campaigns")
        .insert({
          subject: draft.subject,
          headline: draft.headline,
          body: draft.body,
          cta_label: draft.ctaLabel,
          cta_url: draft.ctaUrl,
          hero_image_url: draft.heroImageUrl || "",
          template_key: draft.templateKey,
          payload,
          status: "queued",
          created_by: body.createdBy || null,
          recipient_count: list.length,
        })
        .select("id")
        .single();

      if (campErr || !campaign) {
        throw new Error(campErr?.message || "campaign insert");
      }

      const rows = list.map((sub) => ({
        campaign_id: campaign.id,
        subscriber_id: sub.id,
        email: sub.email,
        status: "pending",
      }));

      // insert in chunks of 200
      for (let i = 0; i < rows.length; i += 200) {
        const chunk = rows.slice(i, i + 200);
        const { error: insErr } = await db.from("newsletter_sends").insert(chunk);
        if (insErr) throw new Error(insErr.message);
      }

      return json({
        ok: true,
        campaignId: campaign.id,
        queued: list.length,
        status: "queued",
        hint: "Включите автоотправку — cron каждые 5 мин разгребёт очередь",
      });
    }

    /** Cron worker */
    if (mode === "process_queue") {
      const db = serviceClient();
      await db.rpc("reset_stale_newsletter_processing", { p_minutes: 15 });

      const { data: settings, error: setErr } = await db
        .from("newsletter_settings")
        .select("sending_enabled, batch_size")
        .eq("id", 1)
        .maybeSingle();
      if (setErr) throw new Error(setErr.message);

      if (!settings?.sending_enabled) {
        return json({
          ok: true,
          skipped: "disabled",
          sent: 0,
          failed: 0,
          message: "Автоотправка выключена",
        });
      }

      const limit = Math.min(
        100,
        Math.max(
          1,
          Number(body.limit) || settings.batch_size || BATCH_SIZE,
        ),
      );

      const { data: claimed, error: claimErr } = await db.rpc(
        "claim_newsletter_queue",
        { p_limit: limit },
      );
      if (claimErr) throw new Error(claimErr.message);

      const jobs = (claimed || []) as Array<{
        id: string;
        campaign_id: string;
        subscriber_id: string | null;
        email: string;
      }>;

      if (jobs.length === 0) {
        return json({ ok: true, sent: 0, failed: 0, claimed: 0 });
      }

      const campaignIds = [...new Set(jobs.map((j) => j.campaign_id))];
      const { data: campaigns, error: cErr } = await db
        .from("newsletter_campaigns")
        .select("id, payload, subject, headline, body, cta_label, cta_url, hero_image_url, template_key")
        .in("id", campaignIds);
      if (cErr) throw new Error(cErr.message);

      const campMap = new Map(
        (campaigns || []).map((c) => [c.id as string, c]),
      );

      // mark campaigns sending
      await db
        .from("newsletter_campaigns")
        .update({ status: "sending" })
        .in("id", campaignIds)
        .eq("status", "queued");

      const subIds = jobs
        .map((j) => j.subscriber_id)
        .filter((id): id is string => Boolean(id));
      const { data: subs } = subIds.length
        ? await db
            .from("newsletter_subscribers")
            .select("id, unsubscribe_token")
            .in("id", subIds)
        : { data: [] as Array<{ id: string; unsubscribe_token: string }> };
      const subMap = new Map(
        (subs || []).map((s) => [s.id, s.unsubscribe_token as string]),
      );

      let sent = 0;
      let failed = 0;

      for (let i = 0; i < jobs.length; i++) {
        const job = jobs[i];
        const camp = campMap.get(job.campaign_id);
        if (!camp) {
          failed += 1;
          await db
            .from("newsletter_sends")
            .update({
              status: "failed",
              error: "campaign missing",
            })
            .eq("id", job.id);
          continue;
        }

        const rawPayload = (camp.payload || {}) as Partial<CampaignPayload>;
        const payload: CampaignPayload = {
          subject: rawPayload.subject || camp.subject,
          headline: rawPayload.headline || camp.headline,
          headlineRed: rawPayload.headlineRed,
          intro: rawPayload.intro,
          greetingRed: rawPayload.greetingRed,
          greetingRest: rawPayload.greetingRest,
          body: rawPayload.body || camp.body,
          ctaLabel: rawPayload.ctaLabel || camp.cta_label || "Скачать презентацию",
          ctaUrl: rawPayload.ctaUrl || camp.cta_url || `${site}/`,
          heroImageUrl: rawPayload.heroImageUrl ?? camp.hero_image_url ?? null,
          templateKey: rawPayload.templateKey || camp.template_key || "partner_kp",
        };

        const token = job.subscriber_id
          ? subMap.get(job.subscriber_id)
          : undefined;
        const unsubUrl = token
          ? `${site}/unsubscribe?token=${token}`
          : `${site}/unsubscribe`;

        const content = contentFromPayload(payload, unsubUrl);
        const html = buildNewsletterHtml(content);
        const text = buildNewsletterText(content);

        try {
          await sendSmtp({
            ...smtp,
            to: job.email,
            subject: content.subject,
            html,
            text,
            extraHeaders: [
              `List-Unsubscribe: <${unsubUrl}>`,
              "List-Unsubscribe-Post: List-Unsubscribe=One-Click",
            ],
          });
          sent += 1;
          await db
            .from("newsletter_sends")
            .update({
              status: "sent",
              sent_at: new Date().toISOString(),
              error: null,
            })
            .eq("id", job.id);
        } catch (e) {
          failed += 1;
          await db
            .from("newsletter_sends")
            .update({
              status: "failed",
              error: e instanceof Error ? e.message : String(e),
            })
            .eq("id", job.id);
        }

        if ((i + 1) % BATCH_SIZE === 0 && i + 1 < jobs.length) {
          await sleep(BATCH_PAUSE_MS);
        }
      }

      for (const cid of campaignIds) {
        // bump counters
        const { count: sentC } = await db
          .from("newsletter_sends")
          .select("id", { count: "exact", head: true })
          .eq("campaign_id", cid)
          .eq("status", "sent");
        const { count: failC } = await db
          .from("newsletter_sends")
          .select("id", { count: "exact", head: true })
          .eq("campaign_id", cid)
          .eq("status", "failed");
        await db
          .from("newsletter_campaigns")
          .update({
            sent_count: sentC ?? 0,
            fail_count: failC ?? 0,
          })
          .eq("id", cid);
        await finalizeCampaign(db, cid);
      }

      return json({
        ok: true,
        claimed: jobs.length,
        sent,
        failed,
      });
    }

    /** Legacy sync campaign (small lists) */
    if (mode !== "campaign") {
      return json({
        error:
          "mode: preview | test | enqueue | process_queue | queue_status | settings_get | settings_set | campaign",
      }, 400);
    }

    const db = serviceClient();
    const { data: subs, error: subErr } = await db
      .from("newsletter_subscribers")
      .select("id, email, unsubscribe_token, full_name")
      .eq("marketing_opt_in", true)
      .is("unsubscribed_at", null)
      .order("created_at", { ascending: true })
      .limit(Math.min(MAX_CAMPAIGN, 500));

    if (subErr) throw new Error(subErr.message);
    const list = subs || [];
    if (list.length === 0) {
      return json({ ok: true, skipped: "no_subscribers", sent: 0 });
    }

    const draftContent = contentFromBody(body, placeholderUnsub);
    const payload = payloadFromContent(draftContent);
    const { data: campaign, error: campErr } = await db
      .from("newsletter_campaigns")
      .insert({
        subject: draftContent.subject,
        headline: draftContent.headline,
        body: draftContent.body,
        cta_label: draftContent.ctaLabel,
        cta_url: draftContent.ctaUrl,
        hero_image_url: draftContent.heroImageUrl || "",
        template_key: draftContent.templateKey,
        payload,
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
