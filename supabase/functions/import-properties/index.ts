// One-time importer: TRUNCATE properties + bulk insert from request body
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(url, key);

    const body = await req.json();
    const rows = body?.rows;
    if (!Array.isArray(rows) || rows.length === 0) {
      return new Response(JSON.stringify({ error: "rows[] required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Delete all existing properties (CASCADE removes ad_placements via FK)
    const { error: delErr } = await supabase
      .from("properties")
      .delete()
      .not("id", "is", null);
    if (delErr) throw delErr;

    // Strip empty/null id so DB default (gen_random_uuid) applies
    const cleaned = rows.map((r: any) => {
      const { id, ...rest } = r;
      return id ? { id, ...rest } : rest;
    });

    // Bulk insert in chunks
    const chunkSize = 50;
    let inserted = 0;
    for (let i = 0; i < cleaned.length; i += chunkSize) {
      const chunk = cleaned.slice(i, i + chunkSize);
      const { error } = await supabase.from("properties").insert(chunk);
      if (error) throw error;
      inserted += chunk.length;
    }

    return new Response(JSON.stringify({ ok: true, inserted }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("import-properties error:", e);
    return new Response(JSON.stringify({ error: e?.message ?? String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
