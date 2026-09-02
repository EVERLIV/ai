/**
 * Общий бренд и палитра писем (edge functions + HTML-шаблоны).
 * Цвета совпадают с src/index.css: primary #8B0015, gold акценты.
 */

export const EMAIL_BRAND = {
  name: "ДАДАТУТ",
  tagline: "У вас вся недвижимость региона? Дада, тут!",
  intro:
    "Подбор и размещение офисов, складов, жилой и коммерческой недвижимости в Ангарске и Иркутской области.",
  supportEmail: "support@dadatut.ru",
  noreplyEmail: "noreply@dadatut.ru",
  officeAddress: "Ангарск, 17 микрорайон, 4а",
  hours: "Пн–Пт 9:00–19:00, Сб 10:00–15:00",
  requisites:
    "ИП Кореневский А. О. · ИНН 380121133702 · ОГРНИП 304380112000142<br />665830, Иркутская область, г. Ангарск, 17 микрорайон, 4а",
} as const;

export const EMAIL_COLORS = {
  bgPage: "#FBFAF7",
  bgCard: "#ffffff",
  bgMuted: "#F5EDD8",
  border: "#F0EDE8",
  primary: "#8B0015",
  primaryFg: "#ffffff",
  gold: "#D4A84B",
  text: "#131720",
  textBody: "#2A3140",
  textMuted: "#676E79",
  link: "#8B0015",
} as const;

export function emailSiteUrl(): string {
  return (Deno.env.get("SITE_URL") || "https://dadatut.ru").replace(/\/$/, "");
}

export function emailSmtpDomain(): string {
  const from = Deno.env.get("SMTP_FROM") || Deno.env.get("SMTP_USER") || "";
  const domain = from.includes("@") ? from.split("@")[1] : "";
  return domain || "dadatut.ru";
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function emailButton(href: string, label: string): string {
  const { primary, primaryFg } = EMAIL_COLORS;
  return `<table role="presentation" cellspacing="0" cellpadding="0">
    <tr>
      <td style="background:${primary};border-radius:4px;">
        <a href="${escapeHtml(href)}"
          style="display:inline-block;padding:13px 22px;color:${primaryFg};text-decoration:none;font-size:14px;font-weight:700;">
          ${escapeHtml(label)}
        </a>
      </td>
    </tr>
  </table>`;
}

export function emailLayout(title: string, inner: string): string {
  const site = emailSiteUrl();
  const c = EMAIL_COLORS;
  const b = EMAIL_BRAND;

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:${c.bgPage};font-family:Arial,Helvetica,sans-serif;color:${c.text};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${c.bgPage};padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;width:100%;background:${c.bgCard};border:1px solid ${c.border};">
          <tr>
            <td style="padding:24px 32px 16px;border-bottom:3px solid ${c.primary};">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:12px;">
                    <img src="${site}/favicon.png" width="36" height="36" alt="${escapeHtml(b.name)}" style="display:block;border:0;" />
                  </td>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;font-size:18px;font-weight:700;letter-spacing:0.06em;color:${c.primary};">
                      ${escapeHtml(b.name)}
                    </p>
                    <p style="margin:4px 0 0;font-size:12px;color:${c.textMuted};">${escapeHtml(b.tagline)}</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 0;font-size:13px;line-height:1.55;color:${c.textMuted};">
              ${escapeHtml(b.intro)}
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 8px;">
              ${inner}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 12px;border-top:1px solid ${c.border};font-size:13px;line-height:1.7;color:${c.textMuted};">
              <strong style="color:${c.text};">Поддержка</strong><br />
              Почта: <a href="mailto:${b.supportEmail}" style="color:${c.link};text-decoration:none;">${b.supportEmail}</a><br />
              Офис: ${escapeHtml(b.officeAddress)}<br />
              Часы работы: ${escapeHtml(b.hours)}
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 20px;">
              <a href="${site}" style="color:${c.link};font-size:14px;font-weight:700;text-decoration:underline;">Перейти на сайт ${escapeHtml(b.name)}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;font-size:11px;color:${c.textMuted};line-height:1.5;">
              ${b.requisites}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function emailFromDefaults(): { from: string; fromName: string } {
  const username = Deno.env.get("SMTP_USER") || "";
  const from = Deno.env.get("SMTP_FROM") || username || EMAIL_BRAND.noreplyEmail;
  const fromName = Deno.env.get("SMTP_FROM_NAME") || EMAIL_BRAND.name;
  return { from, fromName };
}
