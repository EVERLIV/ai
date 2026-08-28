cd /opt/supabase
cat > volumes/functions/_shared/turnstile.ts << 'ENDFILE'
/** Cloudflare Turnstile — server-side verify */
export async function verifyTurnstileToken(
  token: string | null | undefined,
  remoteIp?: string | null,
): Promise<{ ok: boolean; error?: string }> {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY")?.trim();
  if (!secret) {
    return { ok: true };
  }

  if (!token?.trim()) {
    return { ok: false, error: "Не пройдена проверка captcha" };
  }

  const body: Record<string, string> = {
    secret,
    response: token.trim(),
  };
  if (remoteIp?.trim()) body.remoteip = remoteIp.trim();

  const resp = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  const data = (await resp.json().catch(() => ({}))) as {
    success?: boolean;
    "error-codes"?: string[];
  };

  if (!resp.ok || !data.success) {
    const codes = data["error-codes"]?.join(", ") || `HTTP ${resp.status}`;
    console.warn("turnstile verify failed:", codes);
    return { ok: false, error: "Проверка captcha не пройдена" };
  }

  return { ok: true };
}
ENDFILE
echo "БЛОК 2 OK"
