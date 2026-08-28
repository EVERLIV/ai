/** Cloudflare Turnstile — публичный site key (в .env с префиксом VITE_) */
export const TURNSTILE_SITE_KEY =
  import.meta.env.VITE_TURNSTILE_SITE_KEY?.trim() || "";

export const isTurnstileEnabled = () => Boolean(TURNSTILE_SITE_KEY);

export type BotGuardPayload = {
  website: string;
  captchaToken: string | null;
};

export const TURNSTILE_SCRIPT_ID = "cf-turnstile-script";
export const TURNSTILE_SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js";
