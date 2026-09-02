/**
 * Бренд и палитра писем (синхрон с supabase/functions/_shared/emailTheme.ts).
 */
export const EMAIL_BRAND = {
  name: "ДАДАТУТ",
  tagline: "Аренда и продажа недвижимости",
  siteUrl: "https://dadatut.ru",
  supportEmail: "support@dadatut.ru",
  noreplyEmail: "noreply@dadatut.ru",
} as const;

export const EMAIL_COLORS = {
  bgPage: "#FBFAF7",
  primary: "#8B0015",
  gold: "#D4A84B",
  textMuted: "#676E79",
} as const;
