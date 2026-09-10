/**
 * Проверка Яндекс SmartCaptcha для Auth (вход / регистрация / сброс пароля).
 * Secrets: SMARTCAPTCHA_SERVER_KEY (или RECAPTCHA_SECRET_KEY)
 */

import { verifySmartCaptchaToken } from "../_shared/recaptcha.ts";

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
    const body = (await req.json().catch(() => ({}))) as {
      captcha_token?: string | null;
      website?: string;
    };

    if (body.website?.trim()) {
      return json({ ok: true, skipped: "bot" });
    }

    const captcha = await verifySmartCaptchaToken(
      body.captcha_token,
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim(),
    );
    if (!captcha.ok) {
      return json({ error: captcha.error || "Captcha failed" }, 400);
    }

    return json({ ok: true });
  } catch (e) {
    console.error("verify-captcha:", e);
    return json({ error: "Internal error" }, 500);
  }
});
