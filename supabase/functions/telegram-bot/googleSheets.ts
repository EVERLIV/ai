/**
 * Google Sheets API (service account) for Deno Edge.
 *
 * Secrets:
 *   GOOGLE_SERVICE_ACCOUNT_JSON — весь JSON ключа service account одной строкой
 *   GOOGLE_SHEETS_ID            — id таблицы из URL
 *   GOOGLE_SHEETS_RANGE         — например Tasker!A:F (по умолчанию Sheet1!A:Z)
 */

type SaJson = {
  client_email: string;
  private_key: string;
  token_uri?: string;
};

function sheetsConfigured() {
  return Boolean(Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON") && Deno.env.get("GOOGLE_SHEETS_ID"));
}

function sheetId() {
  return Deno.env.get("GOOGLE_SHEETS_ID") || "";
}

function sheetRange() {
  return Deno.env.get("GOOGLE_SHEETS_RANGE") || "Sheet1!A:Z";
}

function parseSa(): SaJson {
  let raw = (Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON") || "").trim().replace(/^\uFEFF/, "");
  if (!raw) throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON пуст");

  const tryParse = (s: string): unknown => JSON.parse(s);

  let parsed: unknown;
  try {
    parsed = tryParse(raw);
  } catch {
    // Секрет из dotenv часто приходит как {\"type\":...} или в лишних кавычках
    const unwrapped =
      (raw.startsWith("'") && raw.endsWith("'")) || (raw.startsWith('"') && raw.endsWith('"'))
        ? raw.slice(1, -1)
        : raw;
    const unescaped = unwrapped.replace(/\\"/g, '"');
    try {
      parsed = tryParse(unescaped);
    } catch {
      throw new Error("Ключ Google Sheets битый (JSON). Нужно заново вставить GOOGLE_SERVICE_ACCOUNT_JSON.");
    }
  }

  if (typeof parsed === "string") {
    try {
      parsed = tryParse(parsed);
    } catch {
      throw new Error("Ключ Google Sheets битый (JSON). Нужно заново вставить GOOGLE_SERVICE_ACCOUNT_JSON.");
    }
  }

  const sa = parsed as SaJson;
  if (!sa?.client_email || !sa?.private_key) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON некорректен");
  }
  sa.private_key = sa.private_key.replace(/\\n/g, "\n");
  return sa;
}

function b64url(data: ArrayBuffer | Uint8Array | string) {
  const bytes =
    typeof data === "string"
      ? new TextEncoder().encode(data)
      : data instanceof Uint8Array
        ? data
        : new Uint8Array(data);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function importPrivateKey(pem: string) {
  const body = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const binary = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8",
    binary.buffer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

let cachedToken: { access: string; exp: number } | null = null;

async function getAccessToken() {
  if (cachedToken && Date.now() < cachedToken.exp - 60_000) return cachedToken.access;

  const sa = parseSa();
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/spreadsheets",
      aud: sa.token_uri || "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsigned = `${header}.${claim}`;
  const key = await importPrivateKey(sa.private_key);
  const sig = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(unsigned),
  );
  const jwt = `${unsigned}.${b64url(sig)}`;

  const resp = await fetch(sa.token_uri || "https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  const data = await resp.json();
  if (!resp.ok || !data.access_token) {
    const desc = String(data.error_description || data.error || `Google token ${resp.status}`);
    if (/account not found/i.test(desc)) {
      throw new Error(
        "Google не находит service account (ключ удалён или битый). Нужен новый JSON-ключ.",
      );
    }
    throw new Error(desc);
  }
  cachedToken = { access: data.access_token, exp: Date.now() + (data.expires_in || 3600) * 1000 };
  return cachedToken.access;
}

async function sheetsFetch(path: string, init?: RequestInit) {
  const token = await getAccessToken();
  const resp = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sheetId()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(data.error?.message || `Sheets API ${resp.status}`);
  }
  return data;
}

export type SheetTable = {
  headers: string[];
  rows: string[][];
  /** 1-based sheet row index for each data row (header is row 1) */
  rowNumbers: number[];
};

/** Absolute 1-based start row from A1 range like Tasker!A4:S or A4:Z */
function rangeStartRow(range: string): number {
  const m = range.match(/![A-Za-z]+(\d+)/) || range.match(/^([A-Za-z]+)(\d+)/);
  if (m) {
    const n = Number(m[m.length - 1]);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 1;
}

export async function readSheetTable(range = sheetRange()): Promise<SheetTable> {
  const enc = encodeURIComponent(range);
  const data = await sheetsFetch(`/values/${enc}?majorDimension=ROWS`);
  const values: string[][] = data.values || [];
  if (!values.length) return { headers: [], rows: [], rowNumbers: [] };
  const headerRow = rangeStartRow(range);
  const headers = values[0].map((h) => String(h || "").trim());
  const rows = values.slice(1).map((r) => {
    const copy = [...r.map((c) => String(c ?? ""))];
    while (copy.length < headers.length) copy.push("");
    return copy;
  });
  // Header occupies headerRow; first data row is headerRow + 1
  const rowNumbers = rows.map((_, i) => headerRow + 1 + i);
  return { headers, rows, rowNumbers };
}

function colIndex(headers: string[], name: string) {
  const n = name.toLowerCase();
  const i = headers.findIndex((h) => h.toLowerCase() === n || h.toLowerCase().includes(n));
  return i;
}

export function findCol(headers: string[], candidates: string[]) {
  for (const c of candidates) {
    const i = colIndex(headers, c);
    if (i >= 0) return i;
  }
  return -1;
}

/** A1 column letter from 0-based index */
export function colLetter(index: number) {
  let n = index + 1;
  let s = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

export function sheetTabFromRange(range = sheetRange()) {
  const m = range.match(/^([^!]+)!/);
  return m ? m[1] : "Sheet1";
}

export async function updateCell(a1: string, value: string) {
  const enc = encodeURIComponent(a1);
  await sheetsFetch(`/values/${enc}?valueInputOption=USER_ENTERED`, {
    method: "PUT",
    body: JSON.stringify({ values: [[value]] }),
  });
}

export async function appendRow(values: string[]) {
  // Пишем в следующую свободную строку явно — append по диапазону A4:S
  // на листах с «шапкой» часто кладёт данные мимо таблицы.
  const table = await readSheetTable();
  const headerRow = rangeStartRow(sheetRange());
  const nextRow = table.rowNumbers.length
    ? Math.max(...table.rowNumbers) + 1
    : headerRow + 1;
  const tab = sheetTabFromRange();
  const a1 = `${tab}!A${nextRow}`;
  const enc = encodeURIComponent(a1);
  await sheetsFetch(`/values/${enc}?valueInputOption=USER_ENTERED`, {
    method: "PUT",
    body: JSON.stringify({ values: [values] }),
  });
  return nextRow;
}

export function isGoogleSheetsReady() {
  return sheetsConfigured();
}

export function sheetPublicUrl() {
  const id = sheetId();
  return id ? `https://docs.google.com/spreadsheets/d/${id}/edit` : "";
}
