/**
 * SMTP send helper for Edge Functions (Timeweb SMTP).
 */
export function utf8ToB64(s: string) {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

export function encodeHeader(s: string) {
  if (/^[\x20-\x7E]*$/.test(s)) return s;
  return `=?UTF-8?B?${utf8ToB64(s)}?=`;
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

export type SmtpSendOpts = {
  hostname: string;
  port: number;
  username: string;
  password: string;
  from: string;
  fromName: string;
  to: string;
  subject: string;
  html: string;
  text?: string;
  /** Extra header lines without trailing CRLF, e.g. List-Unsubscribe */
  extraHeaders?: string[];
  ehloDomain: string;
};

export async function sendSmtp(opts: SmtpSendOpts) {
  const implicitTls = opts.port === 465;
  let raw: Deno.Conn = implicitTls
    ? await Deno.connectTls({ hostname: opts.hostname, port: opts.port })
    : await Deno.connect({ hostname: opts.hostname, port: opts.port });

  let smtp = new SmtpConn(raw);
  try {
    const greet = await smtp.readReply();
    if (greet.code !== 220) throw new Error(`SMTP greeting: ${greet.text}`);

    await smtp.cmd(`EHLO ${opts.ehloDomain}`, 250);

    if (!implicitTls) {
      await smtp.cmd("STARTTLS", 220);
      raw = await Deno.startTls(raw, { hostname: opts.hostname });
      smtp = new SmtpConn(raw);
      await smtp.cmd(`EHLO ${opts.ehloDomain}`, 250);
    }

    await smtp.cmd("AUTH LOGIN", 334);
    await smtp.cmd(utf8ToB64(opts.username), 334);
    await smtp.cmd(utf8ToB64(opts.password), 235);

    await smtp.cmd(`MAIL FROM:<${opts.from}>`, 250);
    await smtp.cmd(`RCPT TO:<${opts.to}>`, [250, 251]);
    await smtp.cmd("DATA", 354);

    const fromHeader = `${encodeHeader(opts.fromName)} <${opts.from}>`;
    const date = new Date().toUTCString();
    const extras = (opts.extraHeaders || []).filter(Boolean);
    const boundary = `dadatut_${crypto.randomUUID().replace(/-/g, "")}`;

    let bodyBlock: string[];
    if (opts.text) {
      bodyBlock = [
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        "",
        `--${boundary}`,
        "Content-Type: text/plain; charset=UTF-8",
        "Content-Transfer-Encoding: base64",
        "",
        utf8ToB64(opts.text).replace(/(.{76})/g, "$1\r\n"),
        `--${boundary}`,
        "Content-Type: text/html; charset=UTF-8",
        "Content-Transfer-Encoding: base64",
        "",
        utf8ToB64(opts.html).replace(/(.{76})/g, "$1\r\n"),
        `--${boundary}--`,
      ];
    } else {
      bodyBlock = [
        "Content-Type: text/html; charset=UTF-8",
        "Content-Transfer-Encoding: base64",
        "",
        utf8ToB64(opts.html).replace(/(.{76})/g, "$1\r\n"),
      ];
    }

    const payload = [
      `From: ${fromHeader}`,
      `To: ${opts.to}`,
      `Subject: ${encodeHeader(opts.subject)}`,
      `Date: ${date}`,
      "MIME-Version: 1.0",
      ...extras,
      ...bodyBlock,
      ".",
    ].join("\r\n");

    await smtp.conn.write(encoder.encode(`${payload}\r\n`));
    const dataReply = await smtp.readReply();
    if (dataReply.code !== 250) {
      throw new Error(`SMTP DATA → ${dataReply.text}`);
    }
    await smtp.cmd("QUIT", [221, 250]);
  } finally {
    smtp.close();
  }
}
