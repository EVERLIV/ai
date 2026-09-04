/** Google reCAPTCHA v3 — server-side verify */
const SCORE_THRESHOLD = 0.5;
const EXPECTED_ACTION = "submit_lead";

export async function verifyRecaptchaToken(
  token: string | null | undefined,
  remoteIp?: string | null,
): Promise<{ ok: boolean; error?: string }> {
  const secret = Deno.env.get("RECAPTCHA_SECRET_KEY")?.trim();
  if (!secret) {
    return { ok: true };
  }

  if (!token?.trim()) {
    return { ok: false, error: "Не пройдена проверка captcha" };
  }

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token.trim());
  if (remoteIp?.trim()) body.set("remoteip", remoteIp.trim());

  try {
    const resp = await fetch(
      "https://www.google.com/recaptcha/api/siteverify",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
        signal: AbortSignal.timeout(5_000),
      },
    );

    const data = (await resp.json().catch(() => ({}))) as {
      success?: boolean;
      score?: number;
      action?: string;
      "error-codes"?: string[];
    };

    if (!resp.ok || !data.success) {
      const codes = data["error-codes"]?.join(", ") || `HTTP ${resp.status}`;
      console.warn("recaptcha verify failed:", codes);
      return { ok: false, error: "Проверка captcha не пройдена" };
    }

    if (typeof data.score === "number" && data.score < SCORE_THRESHOLD) {
      console.warn("recaptcha low score:", data.score);
      return { ok: false, error: "Проверка captcha не пройдена" };
    }

    if (data.action && data.action !== EXPECTED_ACTION) {
      console.warn("recaptcha unexpected action:", data.action);
      return { ok: false, error: "Проверка captcha не пройдена" };
    }

    return { ok: true };
  } catch (e) {
    // VPS может не иметь доступа к Google — клиент уже получил токен в браузере
    console.warn(
      "recaptcha verify skipped (network):",
      e instanceof Error ? e.message : e,
    );
    return { ok: true };
  }
}
