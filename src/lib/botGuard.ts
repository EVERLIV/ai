/** Яндекс SmartCaptcha — публичный client key (VITE_) */
export const SMARTCAPTCHA_SITE_KEY =
  import.meta.env.VITE_SMARTCAPTCHA_SITE_KEY?.trim() ||
  // временный алиас на старое имя, пока не пересоберёте .env
  import.meta.env.VITE_RECAPTCHA_SITE_KEY?.trim() ||
  "";

export const isCaptchaEnabled = () => Boolean(SMARTCAPTCHA_SITE_KEY);

/** @deprecated use isCaptchaEnabled */
export const isRecaptchaEnabled = isCaptchaEnabled;
/** @deprecated use isCaptchaEnabled */
export const isTurnstileEnabled = isCaptchaEnabled;

export type BotGuardPayload = {
  website: string;
  captchaToken: string | null;
};
