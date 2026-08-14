/**
 * Письма собственнику: объект на проверке / объект одобрен.
 *
 * Секреты (Cloud Dashboard → Edge Functions → Secrets):
 *   SMTP_HOST          smtp.timeweb.ru
 *   SMTP_PORT          587 (STARTTLS) или 465 (SSL)
 *   SMTP_USER          noreply@arendacity.com
 *   SMTP_PASS          пароль ящика
 *   SMTP_FROM          noreply@arendacity.com
 *   SMTP_FROM_NAME     АрендаСити
 *   NOTIFY_EMAIL_SECRET  (необязательно) — заголовок x-notify-secret
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info, x-notify-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SITE_URL = "https://arendacity.com";

type PropertyPayload = {
  id?: string | null;
  public_id?: string | null;
  address?: string | null;
  district?: string | null;
  type?: string | null;
  deal_type?: string | null;
  area?: number | string | null;
  price?: number | string | null;
  floor?: string | number | null;
  deposit?: string | null;
  contract_term?: string | null;
  request_type?: string | null;
  description?: string | null;
};

type Body = {
  event?: string;
  to?: string | null;
  name?: string | null;
  property?: PropertyPayload | null;
};

const REQUEST_TYPE_LABELS: Record<string, string> = {
  free_listing: "Бесплатное размещение",
  management: "Передать в управление",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function utf8ToB64(s: string) {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function encodeHeader(s: string) {
  if (/^[\x20-\x7E]*$/.test(s)) return s;
  return `=?UTF-8?B?${utf8ToB64(s)}?=`;
}

function formatPrice(value: number | string | null | undefined) {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n <= 0) return "";
  return `${n.toLocaleString("ru-RU")} ₽`;
}

function row(label: string, value: string | number | null | undefined) {
  if (value === null || value === undefined) return "";
  const text = String(value).trim();
  if (!text) return "";
  return `<span style="color:#8a847c;">${escapeHtml(label)}:</span> ${escapeHtml(text)}<br />`;
}

function propertyCard(p: PropertyPayload) {
  const area = p.area !== null && p.area !== undefined && String(p.area) !== ""
    ? `${p.area} м²`
    : "";
  const requestLabel = p.request_type
    ? (REQUEST_TYPE_LABELS[p.request_type] || p.request_type)
    : "";
  const desc = (p.description || "").trim();
  const descShort = desc.length > 400 ? `${desc.slice(0, 400)}…` : desc;

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#faf7f1;border:1px solid #e6e0d4;">
      <tr>
        <td style="padding:16px 18px;font-size:14px;line-height:1.65;color:#333;">
          <strong style="font-size:15px;">Карточка объекта</strong><br />
          ${row("ID", p.public_id || (p.id ? p.id.slice(0, 8).toUpperCase() : ""))}
          ${row("Адрес", p.address)}
          ${row("Район", p.district)}
          ${row("Тип", p.type)}
          ${row("Сделка", p.deal_type)}
          ${row("Площадь", area)}
          ${row("Цена", formatPrice(p.price ?? null))}
          ${row("Этаж", p.floor == null ? "" : String(p.floor))}
          ${row("Залог", p.deposit)}
          ${row("Срок договора", p.contract_term)}
          ${row("Тип заявки", requestLabel)}
          ${descShort ? `<span style="color:#8a847c;">Описание:</span> ${escapeHtml(descShort)}` : ""}
        </td>
      </tr>
    </table>`;
}

function layout(title: string, inner: string) {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)}</title>
</head>
<body style="margin:0;padding:0;background:#f4f1ea;font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f4f1ea;padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;width:100%;background:#ffffff;border:1px solid #e6e0d4;">
          <tr>
            <td style="padding:24px 32px 16px;border-bottom:3px solid #c4a35a;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="vertical-align:middle;padding-right:12px;">
                    <img src="${SITE_URL}/favicon.png" width="36" height="36" alt="АрендаСити" style="display:block;border:0;" />
                  </td>
                  <td style="vertical-align:middle;">
                    <p style="margin:0;font-size:18px;font-weight:700;letter-spacing:0.04em;">
                      АРЕНДА<span style="color:#c4a35a;">СИТИ</span>
                    </p>
                    <p style="margin:4px 0 0;font-size:12px;color:#6b6560;">Коммерческая недвижимость</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 32px 0;font-size:13px;line-height:1.55;color:#6b6560;">
              Подбор и размещение офисов, складов и торговых площадей в Ангарске и Иркутской области.
            </td>
          </tr>
          <tr>
            <td style="padding:24px 32px 8px;">
              ${inner}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px 12px;border-top:1px solid #efe8da;font-size:13px;line-height:1.7;color:#6b6560;">
              <strong style="color:#1a1a1a;">Контакты</strong><br />
              Телефон: <a href="tel:+79086581919" style="color:#8a6d2f;text-decoration:none;">+7 (908) 658-19-19</a><br />
              Почта: <a href="mailto:info@arendacity.ru" style="color:#8a6d2f;text-decoration:none;">info@arendacity.ru</a><br />
              Офис: Ангарск, 17 микрорайон, 4а<br />
              Часы работы: Пн–Пт 9:00–19:00, Сб 10:00–15:00
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 20px;">
              <a href="${SITE_URL}" style="color:#8a6d2f;font-size:14px;font-weight:700;text-decoration:underline;">Перейти на сайт АрендаСити</a>
            </td>
          </tr>
          <tr>
            <td style="padding:0 32px 28px;font-size:11px;color:#8a847c;line-height:1.5;">
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
}

function button(href: string, label: string) {
  return `<table role="presentation" cellspacing="0" cellpadding="0">
    <tr>
      <td style="background:#1a1a1a;">
        <a href="${escapeHtml(href)}"
          style="display:inline-block;padding:13px 22px;color:#ffffff;text-decoration:none;font-size:14px;font-weight:700;">
          ${escapeHtml(label)}
        </a>
      </td>
    </tr>
  </table>`;
}

function buildEmail(event: "submitted" | "approved", name: string, p: PropertyPayload) {
  const hello = name ? `Здравствуйте, ${escapeHtml(name)}!` : "Здравствуйте!";
  const card = propertyCard(p);
  const cabinet = `${SITE_URL}/account`;
  const objectUrl = p.id ? `${SITE_URL}/property/${p.id}` : cabinet;

  if (event === "submitted") {
    const title = "Объект отправлен на проверку — АрендаСити";
    const inner = `
      <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;">Объект отправлен на проверку</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#333;">
        ${hello} Мы получили вашу заявку. Объект появится в публичном каталоге после модерации.
        Обычно проверка занимает один рабочий день.
      </p>
      ${card}
      <p style="margin:20px 0 16px;font-size:14px;line-height:1.55;color:#333;">
        Статус заявки можно смотреть в личном кабинете.
      </p>
      ${button(cabinet, "Открыть кабинет")}
    `;
    return { subject: title, html: layout(title, inner) };
  }

  const isManagement = p.request_type === "management";
  const title = "Поздравляем: объект одобрен — АрендаСити";
  const lead = isManagement
    ? `${hello} Заявка на управление объектом одобрена. Мы берём объект в работу и свяжемся с вами по дальнейшим шагам.`
    : `${hello} Ваш объект прошёл проверку и опубликован в каталоге АрендаСити. Клиенты уже могут увидеть объявление и оставить заявку.`;
  const inner = `
    <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;">Поздравляем: объект одобрен</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#333;">${lead}</p>
    ${card}
    <p style="margin:20px 0 16px;font-size:14px;line-height:1.55;color:#333;">
      Откройте карточку объекта или кабинет, чтобы следить за откликами.
    </p>
    ${button(objectUrl, "Смотреть объект")}
    <p style="margin:16px 0 0;">
      <a href="${cabinet}" style="color:#8a6d2f;font-size:14px;font-weight:700;">Открыть кабинет</a>
    </p>
  `;
  return { subject: title, html: layout(title, inner) };
}

const encoder = new TextEncoder();
const decoder = new TextDecoder();

class SmtpConn {
  conn: Deno.Conn;
  leftover = new Uint8Array(0);

  constructor(conn: Deno.Conn) {
    this.conn = conn;
  }

  async writeLine(line: string) {
    await this.conn.write(encoder.encode(line + "\r\n"));
  }

  async readReply(): Promise<{ code: number; text: string }> {
    const lines: string[] = [];
    while (true) {
      const line = await this.readLine();
      if (!line) throw new Error("SMTP: пустой ответ");
      lines.push(line);
      if (line.length >= 4 && line[3] === " ") {
        const code = Number(line.slice(0, 3));
        return { code, text: lines.join("\n") };
      }
    }
  }

  async readLine(): Promise<string> {
    while (true) {
      const idx = this.leftover.indexOf(10);
      if (idx >= 0) {
        let line = decoder.decode(this.leftover.subarray(0, idx));
        this.leftover = this.leftover.slice(idx + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        return line;
      }
      const chunk = new Uint8Array(1024);
      const n = await this.conn.read(chunk);
      if (n === null) {
        if (this.leftover.length === 0) return "";
        const rest = decoder.decode(this.leftover);
        this.leftover = new Uint8Array(0);
        return rest.replace(/\r$/, "");
      }
      const next = new Uint8Array(this.leftover.length + n);
      next.set(this.leftover);
      next.set(chunk.subarray(0, n), this.leftover.length);
      this.leftover = next;
    }
  }

  async cmd(line: string, expected?: number | number[]) {
    await this.writeLine(line);
    const reply = await this.readReply();
    const ok = expected === undefined
      ? reply.code >= 200 && reply.code < 400
      : (Array.isArray(expected) ? expected : [expected]).includes(reply.code);
    if (!ok) throw new Error(`SMTP ${line.split(" ")[0]} → ${reply.text}`);
    return reply;
  }

  close() {
    try {
      this.conn.close();
    } catch {
      /* ignore */
    }
  }
}

async function sendSmtp(opts: {
  hostname: string;
  port: number;
  username: string;
  password: string;
  from: string;
  fromName: string;
  to: string;
  subject: string;
  html: string;
}) {
  const implicitTls = opts.port === 465;
  let raw: Deno.Conn = implicitTls
    ? await Deno.connectTls({ hostname: opts.hostname, port: opts.port })
    : await Deno.connect({ hostname: opts.hostname, port: opts.port });

  let smtp = new SmtpConn(raw);
  try {
    const greet = await smtp.readReply();
    if (greet.code !== 220) throw new Error(`SMTP greeting: ${greet.text}`);

    await smtp.cmd(`EHLO arendacity.com`, 250);

    if (!implicitTls) {
      await smtp.cmd("STARTTLS", 220);
      raw = await Deno.startTls(raw, { hostname: opts.hostname });
      smtp = new SmtpConn(raw);
      await smtp.cmd(`EHLO arendacity.com`, 250);
    }

    await smtp.cmd("AUTH LOGIN", 334);
    await smtp.cmd(utf8ToB64(opts.username), 334);
    await smtp.cmd(utf8ToB64(opts.password), 235);

    await smtp.cmd(`MAIL FROM:<${opts.from}>`, 250);
    await smtp.cmd(`RCPT TO:<${opts.to}>`, [250, 251]);
    await smtp.cmd("DATA", 354);

    const fromHeader = `${encodeHeader(opts.fromName)} <${opts.from}>`;
    const date = new Date().toUTCString();
    const payload = [
      `From: ${fromHeader}`,
      `To: ${opts.to}`,
      `Subject: ${encodeHeader(opts.subject)}`,
      `Date: ${date}`,
      "MIME-Version: 1.0",
      "Content-Type: text/html; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
      "",
      utf8ToB64(opts.html).replace(/(.{76})/g, "$1\r\n"),
      ".",
    ].join("\r\n");

    await smtp.conn.write(encoder.encode(payload + "\r\n"));
    const dataReply = await smtp.readReply();
    if (dataReply.code !== 250) throw new Error(`SMTP DATA → ${dataReply.text}`);
    await smtp.cmd("QUIT", [221, 250]);
  } finally {
    smtp.close();
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const secret = Deno.env.get("NOTIFY_EMAIL_SECRET");
    if (secret) {
      const given = req.headers.get("x-notify-secret") || "";
      if (given !== secret) return json({ error: "Forbidden" }, 403);
    }

    const body = (await req.json().catch(() => ({}))) as Body;
    const to = (body.to || "").trim();
    if (!to) return json({ ok: true, skipped: "no_email" });

    const event = body.event === "approved" ? "approved" : body.event === "submitted" ? "submitted" : null;
    if (!event) return json({ error: "Неизвестный event" }, 400);

    const host = Deno.env.get("SMTP_HOST") || "smtp.timeweb.ru";
    const port = Number(Deno.env.get("SMTP_PORT") || "587");
    const username = Deno.env.get("SMTP_USER") || "";
    const password = Deno.env.get("SMTP_PASS") || "";
    const from = Deno.env.get("SMTP_FROM") || username;
    const fromName = Deno.env.get("SMTP_FROM_NAME") || "АрендаСити";

    if (!username || !password) {
      throw new Error("SMTP_USER или SMTP_PASS не заданы");
    }

    const mail = buildEmail(event, (body.name || "").trim(), body.property || {});
    await sendSmtp({
      hostname: host,
      port: Number.isFinite(port) ? port : 587,
      username,
      password,
      from,
      fromName,
      to,
      subject: mail.subject,
      html: mail.html,
    });

    return json({ ok: true });
  } catch (e) {
    console.error("notify-property-email:", e);
    return json({ error: e instanceof Error ? e.message : "Ошибка" }, 500);
  }
});
