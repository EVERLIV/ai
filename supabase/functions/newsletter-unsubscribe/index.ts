/**
 * One-click отписка от рассылки: POST { token: UUID }
 * Публичный endpoint (без x-notify-secret).
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const body = (await req.json().catch(() => ({}))) as { token?: string };
    const token = (body.token || "").trim();
    if (!token) return json({ error: "token required" }, 400);

    const url = Deno.env.get("SUPABASE_URL") || "";
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (!url || !key) throw new Error("SUPABASE env missing");

    const db = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await db.rpc("unsubscribe_newsletter", {
      p_token: token,
    });
    if (error) throw new Error(error.message);

    return json({ ok: true, unsubscribed: Boolean(data) });
  } catch (e) {
    console.error("newsletter-unsubscribe:", e);
    return json({ error: e instanceof Error ? e.message : "Ошибка" }, 500);
  }
});
