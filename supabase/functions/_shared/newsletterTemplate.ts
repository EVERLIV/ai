/**
 * HTML/text билдер рассылки по макету Figma 2A «Шаблон письма» (node 92:2).
 * Table + inline CSS. Ассеты: /email/newsletter/* на dadatut.ru
 */
import { EMAIL_BRAND, emailSiteUrl, escapeHtml } from "./emailTheme.ts";

/** Палитра макета Figma (не путать с transactional emailTheme). */
const C = {
  page: "#e7f4f5",
  card: "#ffffff",
  red: "#9c0008",
  text: "#2a2a2a",
  muted: "#666666",
  cta: "#a2c8cd",
  ctaDark: "#7db4bc",
} as const;

export type NewsletterContent = {
  subject: string;
  /** Первая строка заголовка (красная), по умолчанию «Ваши объекты —» */
  headlineRed?: string;
  /** Остаток заголовка */
  headline: string;
  /** Подзаголовок под H1 */
  intro?: string;
  /** «Добрый» / остаток приветствия */
  greetingRed?: string;
  greetingRest?: string;
  /** HTML-безопасный текст; переносы \\n → <br> */
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  /** Переопределить mockup телефона; иначе /email/newsletter/phone-mockup.png */
  heroImageUrl?: string | null;
  unsubscribeUrl: string;
};

function asset(site: string, name: string) {
  return `${site}/email/newsletter/${name}`;
}

function paragraphsHtml(body: string): string {
  const parts = body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return "";
  return parts
    .map(
      (p) =>
        `<p style="margin:0 0 12px;font-size:14px;line-height:20px;letter-spacing:0.14px;color:${C.muted};">${escapeHtml(p).replace(/\n/g, "<br />")}</p>`,
    )
    .join("");
}

function featureCell(icon: string, text: string): string {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td style="padding:0 0 10px;">
          <img src="${escapeHtml(icon)}" width="50" height="50" alt="" style="display:block;border:0;width:50px;height:50px;" />
        </td>
      </tr>
      <tr>
        <td style="padding:0;font-size:12px;line-height:16px;color:${C.muted};">
          ${text}
        </td>
      </tr>
    </table>`;
}

function featureCellZero(icon: string, text: string): string {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
      <tr>
        <td style="padding:0 0 10px;height:50px;vertical-align:middle;">
          <img src="${escapeHtml(icon)}" width="58" height="39" alt="" style="display:block;border:0;width:58px;height:39px;" />
        </td>
      </tr>
      <tr>
        <td style="padding:0;font-size:12px;line-height:16px;color:${C.muted};">
          ${text}
        </td>
      </tr>
    </table>`;
}

export function buildNewsletterHtml(content: NewsletterContent): string {
  const site = emailSiteUrl();
  const headlineRed = (content.headlineRed || "Ваши объекты —").trim();
  const headline = (content.headline || "на новом агрегаторе недвижимости").trim();
  const intro = (
    content.intro ||
    "Портал аренды и недвижимости в Иркутске и области — чтобы жители региона находили объекты бесплатно, без переплат на агрегаторах и без лишних комиссий."
  ).trim();
  const greetingRed = (content.greetingRed || "Добрый").trim();
  const greetingRest = (content.greetingRest || " день!").trim();
  const ctaLabel = (content.ctaLabel || "Скачать презентацию").trim();
  const ctaUrl = (content.ctaUrl || `${site}/`).trim();
  const phoneImg = (content.heroImageUrl || "").trim() ||
    asset(site, "phone-mockup.png");

  const logo = asset(site, "logo.svg");
  const iconMail = asset(site, "icon-mail.svg");
  const iconApp = asset(site, "icon-app.svg");
  const iconUsers = asset(site, "icon-users.svg");
  const iconZero = asset(site, "icon-zero.svg");
  const iconDl = asset(site, "icon-download.svg");

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(content.subject)}</title>
  <!--[if mso]><style>body,table,td{font-family:Arial,Helvetica,sans-serif!important;}</style><![endif]-->
</head>
<body style="margin:0;padding:0;background:${C.page};font-family:Arial,Helvetica,sans-serif;color:${C.text};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${C.page};">
    <tr>
      <td align="center" style="padding:40px 12px 48px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;">
          <tr>
            <td align="center" style="padding:0 0 28px;">
              <img src="${logo}" width="220" height="35" alt="ДАДАТУТ.РУ — недвижимость" style="display:block;border:0;max-width:220px;height:auto;" />
            </td>
          </tr>
        </table>

        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;background:${C.card};border-radius:20px;">
          <tr>
            <td style="padding:44px 50px 0;">
              <h1 style="margin:0 0 16px;font-size:32px;line-height:38px;letter-spacing:0.72px;font-weight:700;">
                <span style="color:${C.red};">${escapeHtml(headlineRed)}</span><br />
                <span style="color:${C.text};">${escapeHtml(headline)}</span>
              </h1>
              <p style="margin:0 0 28px;font-size:14px;line-height:20px;letter-spacing:0.14px;color:${C.muted};">
                ${escapeHtml(intro)}
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 50px 0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td width="250" valign="top" style="width:250px;padding:0 0 22px;">
                    ${featureCell(iconMail, "Заявки приходят напрямую<br />в личный кабинет")}
                  </td>
                  <td width="50" style="width:50px;">&nbsp;</td>
                  <td width="250" valign="top" style="width:250px;padding:0 0 22px;">
                    ${featureCell(iconUsers, "Есть кабинеты для агентства,<br />риелтора и застройщика")}
                  </td>
                </tr>
                <tr>
                  <td width="250" valign="top" style="width:250px;padding:0;">
                    ${featureCell(iconApp, "Сайт и мобильное приложение —<br />с одинаковым функционалом")}
                  </td>
                  <td width="50" style="width:50px;">&nbsp;</td>
                  <td width="250" valign="top" style="width:250px;padding:0;">
                    ${featureCellZero(iconZero, "Базовое размещение<br />для партнёров")}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:24px 0 0;">
              <img src="${escapeHtml(phoneImg)}" width="600" height="525" alt="Сайт и приложение ДАДАТУТ" style="display:block;width:100%;max-width:600px;height:auto;border:0;" />
            </td>
          </tr>

          <tr>
            <td style="padding:28px 50px 0;">
              <h2 style="margin:0 0 12px;font-size:32px;line-height:38px;letter-spacing:0.72px;font-weight:700;">
                <span style="color:${C.red};">${escapeHtml(greetingRed)}</span><span style="color:${C.text};">${escapeHtml(greetingRest)}</span>
              </h2>
              ${paragraphsHtml(content.body)}
            </td>
          </tr>

          <tr>
            <td style="padding:24px 50px 36px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-radius:20px;overflow:hidden;">
                <tr>
                  <td style="background:${C.cta};border-radius:20px 0 0 20px;">
                    <a href="${escapeHtml(ctaUrl)}" style="display:block;padding:34px 24px;font-size:18px;line-height:22px;letter-spacing:0.8px;font-weight:600;color:#ffffff;text-decoration:none;text-align:center;text-transform:uppercase;">
                      ${escapeHtml(ctaLabel)}
                    </a>
                  </td>
                  <td width="100" style="width:100px;background:${C.ctaDark};border-radius:0 20px 20px 0;text-align:center;vertical-align:middle;">
                    <a href="${escapeHtml(ctaUrl)}" style="display:block;padding:24px 0;">
                      <img src="${iconDl}" width="32" height="40" alt="" style="display:inline-block;border:0;" />
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>

        <!-- footer outside card -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;width:100%;">
          <tr>
            <td width="50%" valign="top" style="padding:28px 12px 0 50px;font-size:14px;line-height:20px;letter-spacing:0.28px;color:${C.text};">
              <span style="color:${C.muted};">Телефоны:</span><br />
              8 (964) 277-77-52<br />
              8 (914) 944-68-00
            </td>
            <td width="50%" valign="top" style="padding:28px 50px 0 12px;font-size:14px;line-height:20px;letter-spacing:0.28px;color:${C.text};">
              <span style="color:${C.muted};">Адрес офиса:</span><br />
              г. Ангарск, 17 микрорайон, 4а<br />
              <a href="${site}" style="color:${C.red};text-decoration:none;">www.dadatut.ru</a>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding:20px 50px 0;font-size:11px;line-height:1.5;color:${C.muted};">
              Вы получили это письмо, потому что согласились на информационные и рекламные рассылки ${escapeHtml(EMAIL_BRAND.name)}.
              <a href="${escapeHtml(content.unsubscribeUrl)}" style="color:${C.red};">Отписаться</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildNewsletterText(content: NewsletterContent): string {
  const site = emailSiteUrl();
  const headlineRed = (content.headlineRed || "Ваши объекты —").trim();
  const headline = (content.headline || "на новом агрегаторе недвижимости").trim();
  const intro = (
    content.intro ||
    "Портал аренды и недвижимости в Иркутске и области — чтобы жители региона находили объекты бесплатно, без переплат на агрегаторах и без лишних комиссий."
  ).trim();
  const greetingRed = (content.greetingRed || "Добрый").trim();
  const greetingRest = (content.greetingRest || " день!").trim();
  const ctaLabel = (content.ctaLabel || "Скачать презентацию").trim();
  const ctaUrl = (content.ctaUrl || `${site}/`).trim();

  return [
    "ДАДАТУТ.РУ — недвижимость",
    "",
    `${headlineRed} ${headline}`,
    intro,
    "",
    "• Заявки приходят напрямую в личный кабинет",
    "• Кабинеты для агентства, риелтора и застройщика",
    "• Сайт и мобильное приложение с одинаковым функционалом",
    "• Базовое размещение для партнёров",
    "",
    `${greetingRed}${greetingRest}`,
    content.body,
    "",
    `${ctaLabel}: ${ctaUrl}`,
    "",
    "Телефоны: 8 (964) 277-77-52, 8 (914) 944-68-00",
    "Адрес: г. Ангарск, 17 микрорайон, 4а",
    site,
    "",
    `Отписаться: ${content.unsubscribeUrl}`,
  ].join("\n");
}
