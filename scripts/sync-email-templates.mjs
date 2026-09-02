#!/usr/bin/env node
/**
 * Синхронизация HTML-шаблонов писем: бренд ДАДАТУТ + палитра проекта.
 * Запуск: node scripts/sync-email-templates.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const SITE = "https://dadatut.ru";
const BRAND = "ДАДАТУТ";
const SUPPORT = "support@dadatut.ru";

const C = {
  bgPage: "#FBFAF7",
  bgCard: "#ffffff",
  bgMuted: "#F5EDD8",
  border: "#F0EDE8",
  primary: "#8B0015",
  primaryFg: "#ffffff",
  text: "#131720",
  textBody: "#2A3140",
  textMuted: "#676E79",
  link: "#8B0015",
};

const HEADER = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>__TITLE__</title>
</head>
<body style="margin:0;padding:0;background:${C.bgPage};font-family:Arial,Helvetica,sans-serif;color:${C.text};">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${C.bgPage};padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;width:100%;background:${C.bgCard};border:1px solid ${C.border};">
          <tr>
            <td style="padding:24px 32px 16px;border-bottom:3px solid ${C.primary};">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:12px;">
                    <img src="${SITE}/favicon.png" width="36" height="36" alt="${BRAND}" style="display:block;border:0;" />
                  </td>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;font-size:18px;font-weight:700;letter-spacing:0.06em;color:${C.primary};">${BRAND}</p>
                    <p style="margin:4px 0 0;font-size:12px;color:${C.textMuted};">Аренда и продажа недвижимости</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 0;font-size:13px;line-height:1.55;color:${C.textMuted};">
              Подбор и размещение офисов, складов, жилой и коммерческой недвижимости в Ангарске и Иркутской области.
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 8px;">`;

const FOOTER = `            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 12px;border-top:1px solid ${C.border};font-size:13px;line-height:1.7;color:${C.textMuted};">
              <strong style="color:${C.text};">Поддержка</strong><br />
              Почта: <a href="mailto:${SUPPORT}" style="color:${C.link};text-decoration:none;">${SUPPORT}</a><br />
              Офис: Ангарск, 17 микрорайон, 4а<br />
              Часы работы: Пн–Пт 9:00–19:00, Сб 10:00–15:00
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 20px;">
              <a href="${SITE}" style="color:${C.link};font-size:14px;font-weight:700;text-decoration:underline;">Перейти на сайт ${BRAND}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;font-size:11px;color:${C.textMuted};line-height:1.5;">
              ИП Кореневский А. О. · ИНН 380121133702 · ОГРНИП 304380112000142<br />
              665830, Иркутская область, г. Ангарск, 17 микрорайон, 4а
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

const TITLE_MAP = {
  "confirm.html": `Подтвердите email — ${BRAND}`,
  "recovery.html": `Сброс пароля — ${BRAND}`,
  "magic_link.html": `Вход в кабинет — ${BRAND}`,
  "invite.html": `Приглашение — ${BRAND}`,
  "email_change.html": `Подтвердите новый email — ${BRAND}`,
  "reauthentication.html": `Код подтверждения — ${BRAND}`,
  "agency-invite.html": `Приглашение в агентство — ${BRAND}`,
  "property-submitted.html": `Объект на проверке — ${BRAND}`,
  "property-approved.html": `Объект одобрен — ${BRAND}`,
};

function extractBody(html) {
  const marker = '<td style="padding:24px 32px 8px;">';
  const start = html.indexOf(marker);
  const endMarker = 'padding:20px 32px 12px;border-top:';
  const end = html.indexOf(endMarker);
  if (start === -1 || end === -1) return null;
  let body = html
    .slice(start + marker.length, html.lastIndexOf("<tr>", end))
    .trim();
  body = body.replace(/<\/td>\s*<\/tr>\s*$/i, "").trim();
  return body;
}

function patchBody(body) {
  return body
    .replace(/АрендаСити/g, BRAND)
    .replace(/background:#1a1a1a/g, `background:${C.primary}`)
    .replace(/background:#faf7f1/g, `background:${C.bgMuted}`)
    .replace(/border:1px solid #e6e0d4/g, `border:1px solid ${C.border}`)
    .replace(/color:#8a6d2f/g, `color:${C.link}`)
    .replace(/color:#333/g, `color:${C.textBody}`)
    .replace(/color:#6b6560/g, `color:${C.textMuted}`)
    .replace(/color:#8a847c/g, `color:${C.textMuted}`)
    .replace(/color:#1a1a1a/g, `color:${C.text}`);
}

function rebuild(file, html) {
  const body = extractBody(html);
  if (!body) {
    console.warn(`  skip (no body): ${file}`);
    return false;
  }
  const title = TITLE_MAP[path.basename(file)] || BRAND;
  const out =
    HEADER.replace("__TITLE__", title) +
    "\n              " +
    patchBody(body) +
    "\n" +
    FOOTER;
  fs.writeFileSync(file, out, "utf8");
  return true;
}

const dirs = [
  path.join(root, "supabase/email-templates"),
  path.join(root, "public/email"),
];

let count = 0;
for (const dir of dirs) {
  if (!fs.existsSync(dir)) continue;
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith(".html")) continue;
    const file = path.join(dir, name);
    if (rebuild(file, fs.readFileSync(file, "utf8"))) {
      console.log("updated", path.relative(root, file));
      count++;
    }
  }
}
console.log(`Done: ${count} templates`);
