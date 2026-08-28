cd /opt/supabase
cat > volumes/functions/submit-lead/index.ts << 'ENDFILE'
import {
  formatLeadTelegram,
  insertCrmLead,
  notifyAgencyForLead,
  sendOpsTelegram,
  type LeadPayload,
} from "../_shared/leadOps.ts";
import { verifyTurnstileToken } from "../_shared/turnstile.ts";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const body = (await req.json().catch(() => ({}))) as LeadPayload & {
      website?: string;
      captcha_token?: string | null;
    };

    if (body.website?.trim()) {
      return json({ ok: true, skipped: "bot" });
    }

    const captcha = await verifyTurnstileToken(
      body.captcha_token,
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        req.headers.get("cf-connecting-ip"),
    );
    if (!captcha.ok) {
      return json({ error: captcha.error || "Captcha failed" }, 400);
    }

    const name = body.name?.trim() || "";
    const phone = body.phone?.trim() || "";
    const email = body.email?.trim() || null;
    const message = body.message?.trim() || null;

    if (name.length < 2) {
      return json({ error: "Укажите имя" }, 400);
    }

    const phoneOptional =
      body.source === "ai-chat" || body.source === "catalog_search_alert";
    if (!phoneOptional && phone.length < 6) {
      return json({ error: "Укажите имя и телефон" }, 400);
    }
    if (phoneOptional && phone.length < 6 && !email?.includes("@")) {
      return json({ error: "Укажите телефон или email" }, 400);
    }

    if (!phone && !name && !message) {
      return json({ error: "Пустая заявка" }, 400);
    }

    const row = {
      name,
      phone: phone || "",
      email,
      message,
      source: body.source?.trim() || "website",
      business_category: body.business_category?.trim() || null,
      object_id: body.object_id || null,
      status: "new",
    };

    const inserted = await insertCrmLead(row);
    const leadPayload: LeadPayload = {
      ...row,
      id: inserted?.id || null,
    };

    try {
      await sendOpsTelegram(formatLeadTelegram(leadPayload));
    } catch (e) {
      console.warn("submit-lead ops telegram:", e);
    }

    await notifyAgencyForLead(leadPayload);

    return json({ ok: true, id: inserted?.id || null });
  } catch (e) {
    console.error("submit-lead:", e);
    return json(
      { error: e instanceof Error ? e.message : "Ошибка" },
      500,
    );
  }
});
ENDFILE
docker compose up -d functions --force-recreate
sleep 4
curl -s -X POST "https://api.arendacity.com/functions/v1/submit-lead" -H "Content-Type: application/json" -d '{"name":"T","phone":"+7900","source":"website"}'
echo
echo "БЛОК 4 OK — если видите error Укажите имя, всё работает"
