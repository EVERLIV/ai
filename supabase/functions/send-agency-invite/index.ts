/**
 * Письмо-приглашение в агентство (noreply@dadatut.ru).
 * Не связано с Auth verification / GoTrue confirm — отдельный event.
 *
 * Секреты (те же, что у notify-property-email):
 *   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_FROM_NAME
 *   NOTIFY_EMAIL_SECRET (опционально) — заголовок x-notify-secret
 */

import {
  EMAIL_BRAND,
  emailButton,
  emailFromDefaults,
  emailLayout,
  emailSmtpDomain,
  escapeHtml,
} from "../_shared/emailTheme.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, apikey, content-type, x-client-info, x-notify-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};


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

function buildAgencyInviteEmail(opts: {
  agencyName: string;
  roleLabel: string;
  inviteUrl: string;
  invitedByName: string;
  expiresAt: string;
}) {
  const brand = EMAIL_BRAND.name;
  const agency = escapeHtml(opts.agencyName || "агентство");
  const role = escapeHtml(opts.roleLabel || "Сотрудник");
  const by = opts.invitedByName
    ? ` Вас пригласил(а) <strong>${escapeHtml(opts.invitedByName)}</strong>.`
    : "";
  const expires = opts.expiresAt
    ? `<p style="margin:16px 0 0;font-size:13px;line-height:1.5;color:#676E79;">Ссылка действует до <strong>${escapeHtml(opts.expiresAt)}</strong>.</p>`
    : "";

  const title = `Приглашение в агентство «${opts.agencyName || brand}»`;
  const subject = `Вас пригласили в агентство — ${brand}`;

  const inner = `
    <h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;">Приглашение в агентство</h1>
    <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#2A3140;">
      Здравствуйте! Вас пригласили присоединиться к агентству
      <strong>${agency}</strong> на платформе <strong>${brand}</strong>
      в роли <strong>${role}</strong>.${by}
    </p>
    <p style="margin:0 0 16px;font-size:14px;line-height:1.55;color:#2A3140;">
      Нажмите кнопку ниже: если у вас ещё нет аккаунта — зарегистрируйтесь,
      если аккаунт есть — войдите. После этого вы станете участником команды агентства.
    </p>
    ${emailButton(opts.inviteUrl, "Принять приглашение")}
    ${expires}
    <p style="margin:24px 0 0;font-size:13px;line-height:1.5;color:#676E79;">
      Если кнопка не открывается, скопируйте ссылку в браузер:<br />
      <a href="${escapeHtml(opts.inviteUrl)}" style="color:#8B0015;word-break:break-all;">${escapeHtml(opts.inviteUrl)}</a>
    </p>
    <p style="margin:20px 0 0;font-size:13px;line-height:1.5;color:#676E79;">
      Если вы не ожидали это письмо — просто проигнорируйте его.
    </p>
  `;

  return { subject, html: emailLayout(title, inner) };
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

    const ehlo = emailSmtpDomain();
    await smtp.cmd(`EHLO ${ehlo}`, 250);

    if (!implicitTls) {
      await smtp.cmd("STARTTLS", 220);
      raw = await Deno.startTls(raw, { hostname: opts.hostname });
      smtp = new SmtpConn(raw);
      await smtp.cmd(`EHLO ${ehlo}`, 250);
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
    const { from, fromName } = emailFromDefaults();

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
