import { isCaptchaEnabled } from "@/lib/botGuard";
import { getEdgeFunctionUrl } from "@/lib/edgeFunctions";

function getVerifyCaptchaUrl(): string {
  return getEdgeFunctionUrl("verify-captcha", "VITE_VERIFY_CAPTCHA_URL");
}

/**
 * Серверная проверка токена SmartCaptcha.
 * Если client key не задан — no-op (локальная разработка).
 */
export async function assertCaptchaOk(
  captchaToken: string | null | undefined,
  website?: string,
): Promise<void> {
  if (website?.trim()) {
    throw new Error("bot");
  }
  if (!isCaptchaEnabled()) return;

  if (!captchaToken?.trim()) {
    throw new Error("Подтвердите, что вы не робот");
  }

  const anon = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() || "";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (anon) {
    headers.apikey = anon;
    headers.Authorization = `Bearer ${anon}`;
  }

  const resp = await fetch(getVerifyCaptchaUrl(), {
    method: "POST",
    headers,
    body: JSON.stringify({ captcha_token: captchaToken.trim() }),
    signal: AbortSignal.timeout(10_000),
  });

  const data = (await resp.json().catch(() => ({}))) as {
    ok?: boolean;
    error?: string;
    skipped?: string;
  };

  if (data.skipped === "bot") {
    throw new Error("bot");
  }

  if (!resp.ok || data.ok === false) {
    throw new Error(data.error || "Проверка captcha не пройдена");
  }
}
