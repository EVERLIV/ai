/**
 * Отправка уведомлений агентству в Telegram-группу.
 * Вызывается только server-side (notify-lead, track-property-view).
 *
 * POST { type, agency_id, text }  OR  { type, agency_id, payload }
 * Header: X-Agency-Notify-Secret
 */

import {
  escapeHtml,
  fetchPropertyAgencyId,
  internalSecret,
  sendAgencyNotification,
  siteUrl,
} from "../_shared/agencyTelegram.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-agency-notify-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type NotifyType = "lead" | "view";

type LeadPayload = {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  message?: string | null;
  source?: string | null;
  business_category?: string | null;
  object_id?: string | null;
};

const SOURCE_LABELS: Record<string, string> = {
  property_contact: "Форма на объекте",
  property_inquiry: "Вопрос по объекту",
  price_offer: "Предложение цены",
  owner_message: "Сообщение",
  consultation_widget: "Консультация",
  realtor_contact: "Риелтор",
  agency_contact: "Агентство",
  developer_contact: "Застройщик",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function formatLeadMessage(
  lead: LeadPayload,
  property?: { address: string; public_id: string | null; id?: string },
) {
  const source = SOURCE_LABELS[lead.source || ""] || lead.source || "Заявка";
  const lines = [
    `<b>📩 Новая заявка — ${escapeHtml(source)}</b>`,
    lead.name ? `👤 ${escapeHtml(lead.name)}` : "",
    lead.phone ? `📞 <code>${escapeHtml(lead.phone)}</code>` : "",
    lead.email ? `✉️ ${escapeHtml(lead.email)}` : "",
    property?.address
      ? `📍 ${escapeHtml(property.address)}`
      : lead.business_category
        ? `📍 ${escapeHtml(lead.business_category)}`
        : "",
  ];
  if (lead.message) lines.push(`\n💬 ${escapeHtml(lead.message)}`);
  if (property?.id) {
    lines.push(
      `\n<a href="${siteUrl()}/property/${property.id}">Открыть объект</a>`,
    );
  }
  return lines.filter(Boolean).join("\n");
}

function formatViewMessage(property: {
  address: string;
  public_id: string | null;
  id: string;
  views_count?: number;
}) {
  const views =
    property.views_count != null
      ? `\nВсего просмотров: ${property.views_count}`
      : "";
  return `<b>👁 Просмотр объекта</b>\n${escapeHtml(property.address)}${views}\n<a href="${siteUrl()}/property/${property.id}">Открыть</a>`;
}

function checkSecret(req: Request): boolean {
  const expected = internalSecret();
  if (!expected) return true;
  return req.headers.get("X-Agency-Notify-Secret") === expected;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  if (!checkSecret(req)) return json({ error: "Forbidden" }, 403);

  try {
    const body = (await req.json().catch(() => ({}))) as {
      type?: NotifyType;
      agency_id?: string;
      text?: string;
      payload?: LeadPayload | Record<string, unknown>;
    };

    const type = body.type;
    let agencyId = body.agency_id;

    if (!type || !["lead", "view"].includes(type)) {
      return json({ error: "Invalid type" }, 400);
    }

    let text = body.text || "";

    if (type === "lead" && !text) {
      const lead = (body.payload || {}) as LeadPayload;
      let property:
        | { address: string; public_id: string | null; id?: string }
        | undefined;
      if (lead.object_id) {
        const prop = await fetchPropertyAgencyId(lead.object_id);
        if (prop) {
          property = { ...prop, id: lead.object_id };
          if (!agencyId && prop.agency_id) agencyId = prop.agency_id;
        }
      }
      text = formatLeadMessage(lead, property);
    }

    if (type === "view" && !text) {
      const p = body.payload as {
        property_id?: string;
        address?: string;
        views_count?: number;
      };
      if (p?.property_id) {
        text = formatViewMessage({
          id: p.property_id,
          address: p.address || "Объект",
          public_id: null,
          views_count: p.views_count,
        });
      }
    }

    if (!agencyId)
      return json({ ok: true, sent: false, reason: "no_agency_id" });
    if (!text) return json({ error: "Empty message" }, 400);

    const result = await sendAgencyNotification(agencyId, type, text);
    return json({ ok: true, ...result });
  } catch (e) {
    console.error("agency-notify:", e);
    return json({ error: e instanceof Error ? e.message : "Error" }, 500);
  }
});

/** Helper for other edge functions */
export async function notifyAgencyLead(lead: LeadPayload) {
  if (!lead.object_id) return;
  const prop = await fetchPropertyAgencyId(lead.object_id);
  if (!prop?.agency_id) return;

  const secret = internalSecret();
  const base = Deno.env.get("SUPABASE_URL") || "";
  if (!base) return;

  await fetch(`${base}/functions/v1/agency-notify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(secret ? { "X-Agency-Notify-Secret": secret } : {}),
    },
    body: JSON.stringify({
      type: "lead",
      agency_id: prop.agency_id,
      payload: lead,
    }),
  }).catch((e) => console.warn("agency-notify lead:", e));
}
