/**
 * Письмо-приглашение в агентство (noreply@arendacity.com).
 * Не связано с Auth verification / GoTrue confirm — отдельный event.
 *
 * Секреты (те же, что у notify-property-email):
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_FROM_NAME
 *   NOTIFY_EMAIL_SECRET (опционально) — заголовок x-notify-secret
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info, x-notify-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SITE_URL = "https://arendacity.com";

type Body = {
  to?: string | null;
  agencyName?: string | null;
  roleLabel?: string | null;
  inviteUrl?: string | null;
  invitedByName?: string | null;
  expiresAt?: string | null;
};

const ROLE_FALLBACK: Record<string, string> = {
  admin: "Админ",
  member: "Сотрудник",
  owner: "Владелец",
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

function formatExpires(iso: string | null | undefined) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
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

function buildAgencyInviteEmail(opts: {
  agencyName: string;
  roleLabel: string;
  inviteUrl: string;
  invitedByName: string;
  expiresAt: string;
}) {
  const agency = escapeHtml(opts.agencyName || "агентство");
  const role = escapeHtml(opts.roleLabel || "Сотрудник");
  const by = opts.invitedByName
    ? ` Вас пригласил(а) <strong>${escapeHtml(opts.invitedByName)}</strong>.`
    : "";
  const expires = opts.expiresAt
    ? `<p style="margin:16px 0 0;font-size:13px;line-height:1.5;color:#6b6560;">Ссылка действует до <strong>${escapeHtml(opts.expiresAt)}</strong>.</p>`
    : "";

  const title = `Приглашение в агентство «${opts.agencyName || "АрендаСити"}»`;
  const subject = `Вас пригласили в агентство — АрендаСити`;

  const inner = `
    <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;">Приглашение в агентство</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#333;">
      Здравствуйте! Вас пригласили присоединиться к агентству
      <strong>${agency}</strong> на платформе <strong>АрендаСити</strong>
      в роли <strong>${role}</strong>.${by}
    </p>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.55;color:#333;">
      Нажмите кнопку ниже: если у вас ещё нет аккаунта — зарегистрируйтесь,
      если аккаунт есть — войдите. После этого вы станете участником команды агентства.
    </p>
    ${button(opts.inviteUrl, "Принять приглашение")}
    ${expires}
    <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#6b6560;">
      Если кнопка не открывается, скопируйте ссылку в браузер:<br />
      <a href="${escapeHtml(opts.inviteUrl)}" style="color:#8a6d2f;word-break:break-all;">${escapeHtml(opts.inviteUrl)}</a>
    </p>
    <p style="margin:20px 0 0;font-size:13px;line-height:1.5;color:#6b6560;">
      Если вы не ожидали это письмо — просто проигнорируйте его.
    </p>
  `;

  const html = `<!DOCTYPE html>
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

  return { subject, html };
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
    await this.conn.write(encoder.encode(`${line}\r\n`));
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
    const ok =
      expected === undefined
        ? reply.code >= 200 && reply.code < 400
        : (Array.isArray(expected) ? expected : [expected]).includes(
            reply.code,
          );
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

    await smtp.conn.write(encoder.encode(`${payload}\r\n`));
    const dataReply = await smtp.readReply();
    if (dataReply.code !== 250)
      throw new Error(`SMTP DATA → ${dataReply.text}`);
    await smtp.cmd("QUIT", [221, 250]);
  } finally {
    smtp.close();
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const secret = Deno.env.get("NOTIFY_EMAIL_SECRET");
    if (secret) {
      const given = req.headers.get("x-notify-secret") || "";
      if (given !== secret) return json({ error: "Forbidden" }, 403);
    }

    const body = (await req.json().catch(() => ({}))) as Body;
    const to = (body.to || "").trim().toLowerCase();
    if (!to) return json({ ok: true, skipped: "no_email" });

    const inviteUrl = (body.inviteUrl || "").trim();
    if (!inviteUrl) return json({ error: "inviteUrl required" }, 400);

    const roleRaw = (body.roleLabel || "").trim();
    const roleLabel = ROLE_FALLBACK[roleRaw] || roleRaw || "Сотрудник";

    const host = Deno.env.get("SMTP_HOST") || "smtp.timeweb.ru";
    const port = Number(Deno.env.get("SMTP_PORT") || "587");
    const username = Deno.env.get("SMTP_USER") || "";
    const password = Deno.env.get("SMTP_PASS") || "";
    const from = Deno.env.get("SMTP_FROM") || username;
    const fromName = Deno.env.get("SMTP_FROM_NAME") || "АрендаСити";

    if (!username || !password) {
      throw new Error("SMTP_USER или SMTP_PASS не заданы");
    }

    const mail = buildAgencyInviteEmail({
      agencyName: (body.agencyName || "").trim() || "Агентство",
      roleLabel,
      inviteUrl,
      invitedByName: (body.invitedByName || "").trim(),
      expiresAt: formatExpires(body.expiresAt),
    });

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
    console.error("send-agency-invite:", e);
    return json({ error: e instanceof Error ? e.message : "Ошибка" }, 500);
  }
});
