/** Google reCAPTCHA v3 — публичный site key (в .env с префиксом VITE_) */
export const RECAPTCHA_SITE_KEY =
  import.meta.env.VITE_RECAPTCHA_SITE_KEY?.trim() || "";

export const isRecaptchaEnabled = () => Boolean(RECAPTCHA_SITE_KEY);

/** @deprecated use isRecaptchaEnabled */
export const isTurnstileEnabled = isRecaptchaEnabled;

export type BotGuardPayload = {
  website: string;
  captchaToken: string | null;
};

export const RECAPTCHA_SCRIPT_ID = "google-recaptcha-v3-script";
export const RECAPTCHA_ACTION = "submit_lead";

export function recaptchaScriptSrc(siteKey: string): string {
  return `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
}
