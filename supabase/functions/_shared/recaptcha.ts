/**
 * Яндекс SmartCaptcha — server-side validate.
 * Docs: https://yandex.cloud/docs/smartcaptcha/concepts/validation
 *
 * Secrets: SMARTCAPTCHA_SERVER_KEY (или устаревший RECAPTCHA_SECRET_KEY)
 */

export async function verifySmartCaptchaToken(
  token: string | null | undefined,
  remoteIp?: string | null,
): Promise<{ ok: boolean; error?: string }> {
  const secret =
    Deno.env.get("SMARTCAPTCHA_SERVER_KEY")?.trim() ||
    Deno.env.get("RECAPTCHA_SECRET_KEY")?.trim() ||
    "";
  if (!secret) {
    return { ok: true };
  }

  if (!token?.trim()) {
    return { ok: false, error: "Не пройдена проверка captcha" };
  }

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("token", token.trim());
  if (remoteIp?.trim()) body.set("ip", remoteIp.trim());

  try {
    const resp = await fetch("https://smartcaptcha.yandexcloud.net/validate", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: AbortSignal.timeout(5_000),
    });

    // При сбое сервиса Яндекс рекомендует не блокировать пользователя
    if (resp.status !== 200) {
      console.warn("smartcaptcha HTTP", resp.status);
      return { ok: true };
    }

    const data = (await resp.json().catch(() => ({}))) as {
      status?: string;
      message?: string;
      host?: string;
    };

    if (data.status === "ok") {
      return { ok: true };
    }

    console.warn("smartcaptcha failed:", data.message || data.status);
    return { ok: false, error: "Проверка captcha не пройдена" };
  } catch (e) {
    console.warn(
      "smartcaptcha verify skipped (network):",
      e instanceof Error ? e.message : e,
    );
    return { ok: true };
  }
}

/** @deprecated use verifySmartCaptchaToken */
export const verifyRecaptchaToken = verifySmartCaptchaToken;
