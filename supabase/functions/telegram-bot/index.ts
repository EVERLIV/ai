/**
 * Telegram-консультант «Катя» АрендаСити + Tasker.
 *
 * 1) В чате ловит свободное обращение: «Катя …» (без слэш-команд).
 *    Подбирает объекты / КП по каталогу.
 * 2) По командам #tasker / /tasker — сводка и правки задач (Google Sheets / БД).
 *
 * Secrets (Cloud Supabase → Edge Functions → Secrets):
 *   TELEGRAM_BOT_TOKEN     — токен бота
 *   TELEGRAM_CHAT_ID       — id рабочей группы (опционально, для Tasker)
 *   ANTHROPIC_API_KEY      — Claude
 *   CATALOG_URL            — https://api.arendacity.com
 *   CATALOG_ANON_KEY       — anon key каталога
 *   SITE_URL               — https://arendacity.com
 *   TELEGRAM_WEBHOOK_SECRET — произвольная строка для ?secret= (защита webhook)
 *
 *   GOOGLE_SERVICE_ACCOUNT_JSON — JSON ключа Google service account
 *   GOOGLE_SHEETS_ID            — id Google Sheet
 *   GOOGLE_SHEETS_RANGE         — например Tasker!A:F
 *
 * Webhook:
 *   https://api.telegram.org/bot<TOKEN>/setWebhook?url=
 *   https://xbdwapunrlnxcuxjhaca.supabase.co/functions/v1/telegram-bot?secret=<SECRET>
 */

import {
  isGoogleSheetsReady,
  readSheetTable,
  updateCell,
  appendRow,
  findCol,
  colLetter,
  sheetTabFromRange,
  sheetPublicUrl,
  type SheetTable,
} from "./googleSheets.ts";

const MODEL = "claude-haiku-4-5";
const CATALOG_URL = Deno.env.get("CATALOG_URL") || "https://api.arendacity.com";
const CATALOG_ANON_KEY = Deno.env.get("CATALOG_ANON_KEY") || "";
const SITE_URL = (Deno.env.get("SITE_URL") || "https://arendacity.com").replace(/\/$/, "");

type TgUser = { id: number; first_name?: string; username?: string; is_bot?: boolean };
type TgChat = { id: number; type: string; title?: string };
type TgMessage = {
  message_id: number;
  chat: TgChat;
  from?: TgUser;
  text?: string;
  reply_to_message?: TgMessage;
};
type TgUpdate = { update_id: number; message?: TgMessage };

type CatalogRow = {
  id: string;
  public_id: string | null;
  type: string | null;
  district: string | null;
  address: string;
  price: number | null;
  price_per_m2: number | null;
  area: number | null;
  class: string | null;
  condition: string | null;
  features: string[] | null;
  floor: string | null;
  total_floors: number | null;
  deposit: string | null;
  contract_term: string | null;
  deal_type: string | null;
};

const num = (v: unknown) => Number(v) || 0;
const fmt = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ");

let catalogCache: { text: string; summary: string; rows: CatalogRow[]; at: number } = {
  text: "",
  summary: "",
  rows: [],
  at: 0,
};

function botToken() {
  return Deno.env.get("TELEGRAM_BOT_TOKEN") || "";
}

function allowedGroupId() {
  const raw = Deno.env.get("TELEGRAM_CHAT_ID") || "";
  return raw ? Number(raw) : null;
}

async function tg(method: string, body: Record<string, unknown>) {
  const token = botToken();
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN не задан");
  const resp = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await resp.json().catch(() => ({}));
  if (!resp.ok || !data.ok) {
    throw new Error(data.description || `Telegram ${method} ${resp.status}`);
  }
  return data;
}

async function reply(chatId: number, text: string, replyTo?: number) {
  const chunks: string[] = [];
  let rest = text;
  while (rest.length > 3500) {
    let cut = rest.lastIndexOf("\n", 3500);
    if (cut < 1000) cut = 3500;
    chunks.push(rest.slice(0, cut));
    rest = rest.slice(cut).trimStart();
  }
  if (rest) chunks.push(rest);

  for (let i = 0; i < chunks.length; i++) {
    await tg("sendMessage", {
      chat_id: chatId,
      text: chunks[i],
      parse_mode: "HTML",
      disable_web_page_preview: true,
      reply_to_message_id: i === 0 ? replyTo : undefined,
    });
  }
}

async function loadCatalog() {
  if (catalogCache.text && Date.now() - catalogCache.at < 5 * 60_000) return catalogCache;

  const params = new URLSearchParams({
    is_active: "eq.true",
    select:
      "id,public_id,type,district,address,price,price_per_m2,area,class,condition,features,floor,total_floors,deposit,contract_term,deal_type",
    order: "price.asc.nullslast",
    limit: "300",
  });

  const resp = await fetch(`${CATALOG_URL}/rest/v1/properties?${params}`, {
    headers: {
      apikey: CATALOG_ANON_KEY,
      Authorization: `Bearer ${CATALOG_ANON_KEY}`,
    },
  });
  if (!resp.ok) throw new Error(`catalog ${resp.status}`);

  const rows = (await resp.json()) as CatalogRow[];
  const text = rows
    .map((p) => {
      const link = `${SITE_URL}/property/${p.id}`;
      const parts = [
        `${p.deal_type || "Аренда"} · ${p.type || "—"} · ${p.address}${p.district ? ` (${p.district})` : ""}`,
        `${num(p.area)} м²`,
        num(p.price) > 0
          ? `${fmt(num(p.price))} ₽${(p.deal_type || "").includes("Продаж") ? "" : "/мес"}`
          : "по запросу",
      ];
      if (num(p.price_per_m2) > 0) parts.push(`${fmt(num(p.price_per_m2))} ₽/м²`);
      if (p.class) parts.push(`класс ${p.class}`);
      if (p.condition) parts.push(String(p.condition));
      if (p.floor) parts.push(`этаж ${p.floor}/${p.total_floors ?? "—"}`);
      if (p.deposit) parts.push(`депозит ${p.deposit}`);
      if (Array.isArray(p.features) && p.features.length) parts.push(p.features.slice(0, 6).join(", "));
      return `• [${p.public_id || p.id.slice(0, 8)}] ${parts.join(" · ")}\n  Ссылка: ${link}`;
    })
    .join("\n") || "Сейчас опубликованных объектов нет.";

  const prices = rows.map((p) => num(p.price)).filter((v) => v > 0);
  const areas = rows.map((p) => num(p.area)).filter((v) => v > 0);
  const byType: Record<string, number> = {};
  for (const p of rows) byType[String(p.type ?? "—")] = (byType[String(p.type ?? "—")] ?? 0) + 1;

  const summary = [
    `Всего активных объектов: ${rows.length}.`,
    `По типам: ${Object.entries(byType).map(([t, n]) => `${t} — ${n}`).join(", ") || "—"}.`,
    prices.length ? `Цены: от ${fmt(Math.min(...prices))} до ${fmt(Math.max(...prices))} ₽.` : "",
    areas.length ? `Площади: от ${Math.min(...areas)} до ${Math.max(...areas)} м².` : "",
  ]
    .filter(Boolean)
    .join(" ");

  catalogCache = { text, summary, rows, at: Date.now() };
  return catalogCache;
}

function consultantPrompt(cat: { text: string; summary: string }, userName: string) {
  return `Ты — Катя, консультант агентства АРЕНДА СИТИ в Telegram.
К Вам обращаются по имени: «Катя …». Отвечайте от первого лица коротко, по-человечески.

## Стиль общения (обязательно)
- Обращайтесь к собеседнику только на «Вы» (Вы, Вам, Ваш, Ваши). Никогда на «ты».
- Коротко, по делу, как в деловом мессенджере.
- Без рекламных штампов и канцелярита.
- Не выдумывайте объекты, цены и площади — только каталог ниже.
- Если просят только число / количество / «кол-во» — ответьте ОДНОЙ цифрой (или одной короткой фразой с числом), без списка и ссылок.
- Если просят КП / коммерческое предложение — оформите текст КП:
  объект, адрес, площадь, ставка/цена, ключевые условия, ссылка на сайт,
  контакты: +7 (908) 658-19-19, info@arendacity.ru.
- Когда просят варианты (не «только число») — добавляйте ссылки ${SITE_URL}/property/<id> из каталога.
- Можно предложить 2–3 лучших варианта, не весь список.
- Если нет подходящего — скажите прямо.

## Сводка
${cat.summary}

## Каталог (код · детали · ссылка)
${cat.text}

${userName ? `Собеседника зовут ${userName}.` : ""}`;
}

/** «Катя …» / «Катя, …» / «Катяи …» — свободное обращение к боту */
function parseKatyaAddress(text: string): { addressed: boolean; question: string } {
  const t = text.trim();
  // Катя / Катяи / Кате в начале
  const m = t.match(/^катя(?:и|е|ю|й)?(?:\s*[,.:;!\-—–]+\s*|\s+)(.+)$/iu);
  if (m) return { addressed: true, question: m[1].trim() };
  if (/^катя(?:и|е|ю|й)?[!?.…]*$/iu.test(t)) {
    return { addressed: true, question: "" };
  }
  return { addressed: false, question: t };
}

/** Быстрый ответ «только число», если явно просят кол-во по месту */
function tryCountOnlyAnswer(question: string, rows: CatalogRow[]): string | null {
  const q = question.toLowerCase();
  const wantsCount = /(кол[- ]?во|количеств|сколько|число)/i.test(q) &&
    /(только|лишь|просто|одну?\s+цифр)/i.test(q);
  // «сколько …» тоже часто = только число
  const wantsHowMany = /^сколько\b/i.test(question.trim()) ||
    (/(сколько|кол[- ]?во)/i.test(q) && /(только|напиши)/i.test(q));
  if (!wantsCount && !wantsHowMany) return null;

  // Вытаскиваем топоним после в/на/по
  const placeMatch = q.match(/\b(?:в|на|по)\s+([а-яёa-z0-9\-]+(?:\s+[а-яёa-z0-9\-]+)?)/i);
  const place = placeMatch?.[1]?.replace(/\s+/g, " ").trim();
  if (!place || place.length < 3) return null;

  const stem = place.replace(/(ске|цке|ске|е|и|у|а|я|ой|ый|ом|ем)$/i, "");
  const filtered = rows.filter((r) => {
    const hay = `${r.district || ""} ${r.address || ""}`.toLowerCase();
    return hay.includes(place) || (stem.length >= 4 && hay.includes(stem));
  });
  return String(filtered.length);
}

async function handlePropertyQuestion(msg: TgMessage, text: string) {
  const cat = await loadCatalog();
  const quick = tryCountOnlyAnswer(text, cat.rows);
  if (quick != null) {
    await reply(msg.chat.id, quick, msg.message_id);
    return;
  }
  const name = msg.from?.first_name || "";
  const answer = await askClaude(consultantPrompt(cat, name), text);
  await reply(msg.chat.id, toTelegramHtml(answer), msg.message_id);
}

/** «Катя покажи задачи / аналитика…» */
function isTaskReadIntent(q: string) {
  const t = q.trim();
  // «задача для …» — это СОЗДАНИЕ, не чтение
  if (/задач[ауие]\s+для(?:\s|[-–—:]|$)/i.test(t)) return false;
  if (
    /(список|покаж|вывед|сводк|аналитик|статистик|отчёт|отчет|срез|дай\s+задач|какие\s+задач|все\s+задач|мои\s+задач|наши\s+задач|по\s+задачам|статус(ы)?\s+задач|сколько\s+задач)/i
      .test(t)
  ) {
    return true;
  }
  if (/^(задачи|tasker|планер|канбан)[!?.…]*$/i.test(t)) return true;
  // «задачи Марии» = список, но не «задача для Марии»
  if (
    /задач[аи]\s+(марии|надежд|анастаси|александр)/i.test(t) &&
    !/(запиш|добав|создай|занес|внеси|поставь|для)/i.test(t)
  ) {
    return true;
  }
  return false;
}

/** «Катя задача для …» / «запиши в задачи…» */
function isTaskWriteIntent(q: string) {
  if (isTaskReadIntent(q)) return false;
  const t = q.trim();
  // Главный паттерн: «задача для Марии …» / «задача для - Мария …»
  if (/задач[ауие]\s+для(?:\s|[-–—:]|$)/i.test(t)) return true;
  if (
    /(запиш|добав|создай|занес|внеси|поставь|зафиксир|кинь|закинь).{0,80}(задач|таск|tasker|таблиц|план|канбан|sheets?)/i
      .test(t)
  ) {
    return true;
  }
  if (/(^|[\s])(новая\s+задача|в\s+задачи|в\s+планер|в\s+таблицу)/i.test(t)) return true;
  if (/задач[ауие]/i.test(t) && /(марии|надежд|анастаси|ответствен|срок|до\s*\d)/i.test(t)) {
    return true;
  }
  if (/задач[ауие]\s*[:\-–—]/i.test(t)) return true;
  return false;
}

function normalizeRuDate(d: string, m: string, y?: string): string {
  const dd = d.padStart(2, "0");
  const mm = m.padStart(2, "0");
  let year: number;
  if (y) {
    year = Number(y.length === 2 ? `20${y}` : y);
  } else {
    const now = new Date();
    year = now.getFullYear();
    const candidate = new Date(year, Number(mm) - 1, Number(dd));
    if (candidate.getTime() < now.getTime() - 30 * 86400000) year += 1;
  }
  return `${dd}.${mm}.${year}`;
}

function fixGenitiveName(name: string) {
  const n = name.trim();
  if (/ии$/i.test(n)) return n.replace(/ии$/i, "ия");
  const map: Record<string, string> = {
    марии: "Мария",
    марие: "Мария",
    надежде: "Надежда",
    анастасии: "Анастасия",
    александру: "Александр",
    ивану: "Иван",
  };
  return map[n.toLowerCase()] || n;
}

type ParsedTaskSpeech = {
  title: string;
  assignee: string | null;
  due: string | null;
  project: string;
  priority: string;
};

function parseTaskSpeech(q: string): ParsedTaskSpeech | null {
  let rest = q.trim();
  rest = rest
    .replace(
      /^(пожалуйста[, ]*)?(запишите|запиши|добавьте|добавь|создайте|создай|занеси|внеси|поставь|зафиксируй|кинь|закинь)\s+(пожалуйста\s+)?(в\s+)?(задачи|задачу|таблицу|план(?:ер)?|канбан|tasker)\s*/iu,
      "",
    )
    .replace(/^[-–—:|]+\s*/u, "")
    .trim();

  if (!rest) return null;

  let assignee: string | null = null;
  let due: string | null = null;

  // «задача для Марии — текст» / «задача для - Мария текст» / «задача для Марии: текст»
  // Имя — одно слово (Марии / Мария); дальше идёт текст задачи
  const forMatch = rest.match(
    /^задач[ауие]?\s+для\s*[-–—:]?\s*([А-ЯЁA-Za-zа-яё]+)\s*[-–—:,]?\s*(.*)$/iu,
  );
  if (forMatch) {
    assignee = fixGenitiveName(forMatch[1]);
    rest = (forMatch[2] || "").trim();
  }

  const dashParts = rest
    .split(/\s*[-–—|]\s*/)
    .map((p) => p.trim())
    .filter(Boolean);

  let titleHint: string | null = null;
  if (dashParts.length >= 2) {
    const first = dashParts[0];
    if (!/^(текст|title|задача)$/i.test(first) && first.length >= 2) {
      titleHint = first;
    } else if (dashParts[1] && !/(до|срок|дедлайн|задач|ответствен)/i.test(dashParts[1])) {
      titleHint = dashParts[1];
    }
  }

  if (!assignee) {
    const asgPatterns = [
      /(?:^|[\s,;|])(?:задач[аеиу]?|ответственн\w*|исполнител\w*|для|на)\s+([А-ЯЁA-Z][а-яёa-zА-ЯЁA-Z]+(?:\s+[А-ЯЁA-Z][а-яёa-z]+)?)\s*$/u,
      /для\s+([А-ЯЁA-Zа-яёa-z]+)/u,
      /([А-ЯЁ][а-яё]+и)\s*$/u,
    ];
    for (const re of asgPatterns) {
      const m = rest.match(re);
      if (m) {
        assignee = fixGenitiveName(m[1]);
        rest = rest.replace(m[0], " ").trim();
        break;
      }
    }
  }

  const dueM = rest.match(
    /(?:сделать\s+|сдел[ае]ть\s+|сдалть\s+|срок\s+|дедлайн\s+)?(?:до|к)\s*[:\s]*(\d{1,2})\s*[.ю,/\\-]\s*(\d{1,2})(?:\s*[.ю,/\\-]\s*(\d{2,4}))?/iu,
  );
  if (dueM) {
    due = normalizeRuDate(dueM[1], dueM[2], dueM[3]);
    rest = rest.replace(dueM[0], " ").trim();
  }

  rest = rest
    .replace(/\b(сделать|сдел[ае]ть|сдалть)\b/giu, " ")
    .replace(/^[-–—:|]+\s*/u, "")
    .replace(/\s*[-–—|]+\s*$/u, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (/^текст\b/i.test(rest)) {
    rest = rest.replace(/^текст\s*[-–—:|]*\s*/iu, "").trim();
  }

  let title = (rest && rest.length >= 2 ? rest : titleHint) || "";
  title = title.replace(/^текст\s*[-–—:|]*\s*/iu, "").trim();
  title = title.replace(/^задач[ауие]?\s*[:\-–—]\s*/iu, "").trim();
  // убрать хвост «для Марии», если остался
  title = title.replace(/\s+для\s+[А-ЯЁA-Zа-яёa-z]+$/iu, "").trim();

  if (!title || title.length < 2) return null;

  return {
    title,
    assignee,
    due,
    project: "Аренда Сити",
    priority: "🟡 Средний",
  };
}

/** Fallback: Claude вытаскивает поля задачи из свободной фразы */
async function parseTaskSpeechWithAi(q: string): Promise<ParsedTaskSpeech | null> {
  try {
    const raw = await askClaude(
      `Извлеки задачу из русской фразы. Ответь ТОЛЬКО JSON без markdown:
{"title":"краткий текст задачи","assignee":"имя или null","due":"DD.MM.YYYY или null","project":"Аренда Сити"}
due: если день.месяц без года — подставь текущий/следующий год. assignee в именительном падеже (Мария не Марии).
title — суть работы, без слов «запиши/добавь/задача».`,
      q,
    );
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const j = JSON.parse(m[0]) as {
      title?: string;
      assignee?: string | null;
      due?: string | null;
      project?: string;
    };
    const title = String(j.title || "").trim();
    if (title.length < 2) return null;
    return {
      title,
      assignee: j.assignee ? fixGenitiveName(String(j.assignee)) : null,
      due: j.due ? String(j.due).trim() : null,
      project: j.project?.trim() || "Аренда Сити",
      priority: "🟡 Средний",
    };
  } catch (e) {
    console.error("parseTaskSpeechWithAi", e);
    return null;
  }
}

function todayRu() {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getFullYear()}`;
}

async function nextTaskId(table: SheetTable) {
  const idI = findCol(table.headers, ["id", "№", "номер"]);
  let max = 0;
  for (const r of table.rows) {
    const n = Number(String(idI >= 0 ? r[idI] : r[0]).replace(/\D/g, ""));
    if (Number.isFinite(n) && n > max) max = n;
  }
  return String(max + 1 || table.rows.length + 1);
}

function buildTaskRow(
  headers: string[],
  parsed: ParsedTaskSpeech,
  id: string,
  poster: string,
): string[] {
  return headers.map((h) => {
    const key = h.toLowerCase().trim();
    if (key === "id" || key === "№" || key === "no" || key === "#") return id;
    // Точное «задача», не «дней до дедлайна»
    if (key === "задача" || key === "title" || key === "название" || key === "task") return parsed.title;
    if (key.includes("проект") || key === "project") return parsed.project;
    if (key === "тип" || key === "type") return "Другое";
    if (key.includes("постановщик")) return poster;
    if (key.includes("ответствен") || key.includes("исполн") || key === "assignee") {
      return parsed.assignee || "";
    }
    if (key.includes("приоритет") || key === "priority") return parsed.priority;
    if (key === "статус" || key === "status") return "Создана";
    if (key.includes("поставлена") || key === "created") return todayRu();
    if (
      (key.includes("дедлайн") || key.includes("желаем")) &&
      !key.includes("дн") &&
      !key.includes("откл")
    ) {
      return parsed.due || "";
    }
    return "";
  });
}

async function handleKatyaTaskCreate(msg: TgMessage, question: string) {
  try {
    if (!isGoogleSheetsReady()) {
      await reply(
        msg.chat.id,
        "Таблицу задач пока не подключила. Нужны секреты Google Sheets.",
        msg.message_id,
      );
      return;
    }

    let parsed = parseTaskSpeech(question);
    if (!parsed || parsed.title.length < 3) {
      parsed = await parseTaskSpeechWithAi(question);
    }
    if (!parsed) {
      await reply(
        msg.chat.id,
        "Не разобрала задачу. Пример:\n<code>Катя запишите в задачи — согласовать вывеску до 14.05 задача Марии</code>",
        msg.message_id,
      );
      return;
    }

    const table = await readSheetTable();
    const headers = table.headers.length
      ? table.headers
      : ["ID", "Задача", "Проект", "Тип", "Постановщик", "Ответственный", "Приоритет", "Статус", "Поставлена", "Взята в работу", "Дедлайн (желаемый)"];

    const id = await nextTaskId(table);
    const poster = msg.from?.first_name || "Telegram";
    const hasTitleCol = findCol(headers, ["задача", "title", "название", "task"]) >= 0;
    const values = hasTitleCol
      ? buildTaskRow(headers, parsed, id, poster)
      : [
        id,
        parsed.title,
        parsed.project,
        "Другое",
        poster,
        parsed.assignee || "",
        parsed.priority,
        "Создана",
        todayRu(),
        "",
        parsed.due || "",
      ];

    const rowNum = await appendRow(values);
    console.log("task created", { id, rowNum, title: parsed.title, assignee: parsed.assignee, due: parsed.due });

    const bits = [
      `✅ Записала в задачи (строка ${rowNum}): <b>${escapeHtml(parsed.title)}</b>`,
      parsed.assignee ? `Ответственный: <b>${escapeHtml(parsed.assignee)}</b>` : null,
      parsed.due ? `Срок: <b>${escapeHtml(parsed.due)}</b>` : null,
      sheetPublicUrl() ? `<a href="${sheetPublicUrl()}">Открыть таблицу</a>` : null,
    ].filter(Boolean);

    await reply(msg.chat.id, bits.join("\n"), msg.message_id);
  } catch (e) {
    console.error("handleKatyaTaskCreate", e);
    await reply(
      msg.chat.id,
      `Не смогла записать в таблицу: <code>${escapeHtml(String(e).slice(0, 200))}</code>`,
      msg.message_id,
    );
  }
}

async function askClaude(system: string, userText: string) {
  const key = Deno.env.get("ANTHROPIC_API_KEY");
  if (!key) throw new Error("ANTHROPIC_API_KEY не настроен");

  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1400,
      system,
      messages: [{ role: "user", content: userText.slice(0, 2000) }],
    }),
  });

  if (!resp.ok) {
    const detail = await resp.text();
    console.error("anthropic", resp.status, detail.slice(0, 300));
    throw new Error("Модель временно недоступна");
  }

  const data = await resp.json();
  const text = (data.content ?? []).find((b: { type: string }) => b.type === "text")?.text ?? "";
  if (!text) throw new Error("Пустой ответ модели");
  return text;
}

/** Экранирование для Telegram HTML (модель может вернуть сырой текст). */
function toTelegramHtml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

type TaskRow = {
  id: string;
  title: string;
  status: string;
  priority: string;
  assignee: string | null;
  due_date: string | null;
  notes: string | null;
  /** 1-based Google Sheet row when source is Sheets */
  sheetRow?: number;
};

function sheetToTasks(table: SheetTable): TaskRow[] {
  const titleI = findCol(table.headers, ["title", "задача", "task", "name", "название"]);
  const statusI = findCol(table.headers, ["status", "статус", "state"]);
  const priorityI = findCol(table.headers, ["priority", "приоритет"]);
  const assigneeI = findCol(table.headers, ["assignee", "ответственный", "owner", "исполнитель"]);
  const dueI = findCol(table.headers, ["дедлайн", "due_date", "due", "deadline", "желаемый", "срок"]);
  const notesI = findCol(table.headers, ["notes", "note", "заметка", "комментарий", "comment"]);

  if (titleI < 0) {
    // Нет заголовка title — берём первую колонку
    return table.rows.map((r, i) => ({
      id: `row-${table.rowNumbers[i]}`,
      title: r[0] || `Строка ${table.rowNumbers[i]}`,
      status: r[1] || "",
      priority: r[2] || "",
      assignee: r[3] || null,
      due_date: r[4] || null,
      notes: r[5] || null,
      sheetRow: table.rowNumbers[i],
    }));
  }

  return table.rows.map((r, i) => ({
    id: `row-${table.rowNumbers[i]}`,
    title: r[titleI] || "",
    status: statusI >= 0 ? r[statusI] : "",
    priority: priorityI >= 0 ? r[priorityI] : "",
    assignee: assigneeI >= 0 ? r[assigneeI] || null : null,
    due_date: dueI >= 0 ? r[dueI] || null : null,
    notes: notesI >= 0 ? r[notesI] || null : null,
    sheetRow: table.rowNumbers[i],
  })).filter((t) => t.title.trim());
}

async function loadTasks(): Promise<{ tasks: TaskRow[]; source: "sheets" | "db"; table?: SheetTable }> {
  if (isGoogleSheetsReady()) {
    const table = await readSheetTable();
    return { tasks: sheetToTasks(table), source: "sheets", table };
  }

  const params = new URLSearchParams({
    select: "id,title,status,priority,assignee,due_date,notes",
    order: "updated_at.desc",
    limit: "100",
  });
  const resp = await fetch(`${CATALOG_URL}/rest/v1/tasks?${params}`, {
    headers: {
      apikey: CATALOG_ANON_KEY,
      Authorization: `Bearer ${CATALOG_ANON_KEY}`,
    },
  });
  if (!resp.ok) throw new Error(`tasks ${resp.status}`);
  const tasks = (await resp.json()) as TaskRow[];
  return { tasks, source: "db" };
}

async function patchTask(
  task: TaskRow,
  patch: { status?: string; notes?: string },
  table?: SheetTable,
) {
  if (task.sheetRow && table && isGoogleSheetsReady()) {
    const tab = sheetTabFromRange();
    if (patch.status != null) {
      const statusI = findCol(table.headers, ["status", "статус", "state"]);
      const col = statusI >= 0 ? statusI : 1;
      await updateCell(`${tab}!${colLetter(col)}${task.sheetRow}`, patch.status);
    }
    if (patch.notes != null) {
      let notesI = findCol(table.headers, ["notes", "note", "заметка", "комментарий", "comment"]);
      if (notesI < 0) notesI = Math.max(table.headers.length - 1, 5);
      await updateCell(`${tab}!${colLetter(notesI)}${task.sheetRow}`, patch.notes);
    }
    return;
  }

  const resp = await fetch(`${CATALOG_URL}/rest/v1/tasks?id=eq.${task.id}`, {
    method: "PATCH",
    headers: {
      apikey: CATALOG_ANON_KEY,
      Authorization: `Bearer ${CATALOG_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({ ...patch, updated_at: new Date().toISOString() }),
  });
  if (!resp.ok) throw new Error(`task update ${resp.status}`);
}

function tasksAsTable(tasks: TaskRow[], source: string) {
  if (!tasks.length) return "Записей в таблице сейчас нет.";
  const lines = [
    `<b>Задачи · ${source === "sheets" ? "team_kanban_planner_v3" : "БД"}</b>`,
  ];
  if (source === "sheets" && sheetPublicUrl()) {
    lines.push(`<a href="${sheetPublicUrl()}">Открыть таблицу</a>`);
  }
  for (const t of tasks.slice(0, 40)) {
    lines.push(
      `<code>${escapeHtml(t.status || "—")}</code> · ${escapeHtml(t.priority || "—")} · ${escapeHtml(t.assignee || "—")} · ${escapeHtml(t.due_date || "—")} · ${escapeHtml(t.title)}`,
    );
  }
  if (tasks.length > 40) lines.push(`… ещё ${tasks.length - 40}`);
  return lines.join("\n");
}

function parseDueDate(raw: string | null): Date | null {
  if (!raw) return null;
  const m = String(raw).trim().match(/(\d{1,2})[.\/-](\d{1,2})(?:[.\/-](\d{2,4}))?/);
  if (!m) return null;
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  let y = m[3] ? Number(m[3].length === 2 ? `20${m[3]}` : m[3]) : new Date().getFullYear();
  const d = new Date(y, mm - 1, dd);
  return Number.isNaN(d.getTime()) ? null : d;
}

function isDoneStatus(status: string) {
  const s = status.toLowerCase();
  return /готов|done|выполн|закрыт|заверш/i.test(s);
}

function tasksAnalytics(tasks: TaskRow[]): string {
  const total = tasks.length;
  if (!total) return "В планере пока нет задач.";

  const byStatus: Record<string, number> = {};
  const byAssignee: Record<string, number> = {};
  const byPriority: Record<string, number> = {};
  let overdue = 0;
  let dueSoon = 0;
  let noDue = 0;
  let done = 0;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const soon = new Date(now);
  soon.setDate(soon.getDate() + 7);

  for (const t of tasks) {
    const st = (t.status || "—").trim() || "—";
    byStatus[st] = (byStatus[st] || 0) + 1;
    if (isDoneStatus(st)) done += 1;

    const who = (t.assignee || "Без ответственного").trim() || "Без ответственного";
    byAssignee[who] = (byAssignee[who] || 0) + 1;

    const pr = (t.priority || "—").trim() || "—";
    byPriority[pr] = (byPriority[pr] || 0) + 1;

    const due = parseDueDate(t.due_date);
    if (!due) {
      noDue += 1;
      continue;
    }
    if (!isDoneStatus(st) && due < now) overdue += 1;
    else if (!isDoneStatus(st) && due <= soon) dueSoon += 1;
  }

  const open = total - done;
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0);

  const top = (obj: Record<string, number>, n = 8) =>
    Object.entries(obj)
      .sort((a, b) => b[1] - a[1])
      .slice(0, n)
      .map(([k, v]) => `· ${escapeHtml(k)} — <b>${v}</b>`)
      .join("\n");

  const overdueList = tasks
    .filter((t) => {
      const due = parseDueDate(t.due_date);
      return due && !isDoneStatus(t.status) && due < now;
    })
    .slice(0, 8)
    .map(
      (t) =>
        `· ${escapeHtml(t.due_date || "—")} · ${escapeHtml(t.assignee || "—")} · ${escapeHtml(t.title)}`,
    )
    .join("\n");

  const lines = [
    `<b>Аналитика задач</b> · team_kanban_planner_v3`,
    sheetPublicUrl() ? `<a href="${sheetPublicUrl()}">Открыть таблицу</a>` : "",
    "",
    `<b>Всего:</b> ${total} · открыто ${open} · готово ${done} (${pct(done)}%)`,
    `<b>Просрочено:</b> ${overdue} · ближайшие 7 дней: ${dueSoon} · без срока: ${noDue}`,
    "",
    `<b>По статусам</b>`,
    top(byStatus),
    "",
    `<b>По ответственным</b>`,
    top(byAssignee),
    "",
    `<b>По приоритетам</b>`,
    top(byPriority, 6),
  ];

  if (overdueList) {
    lines.push("", `<b>Просроченные</b>`, overdueList);
  }

  return lines.filter((l) => l !== undefined).join("\n");
}

function filterTasksByQuestion(tasks: TaskRow[], q: string): TaskRow[] {
  const low = q.toLowerCase();
  let list = tasks;

  // фильтр по человеку
  const people = ["мария", "надежда", "анастасия", "александр", "марии", "надежде", "анастасии"];
  for (const p of people) {
    if (low.includes(p)) {
      const stem = p.replace(/(ии|ие|е|а|я)$/i, "").slice(0, 5);
      list = list.filter((t) => (t.assignee || "").toLowerCase().includes(stem));
      break;
    }
  }

  if (/просроч/i.test(q)) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    list = list.filter((t) => {
      const due = parseDueDate(t.due_date);
      return due && !isDoneStatus(t.status) && due < now;
    });
  } else if (/готов|done|выполнен/i.test(q)) {
    list = list.filter((t) => isDoneStatus(t.status));
  } else if (/открыт|в работе|создан|назначен|не\s*закрыт/i.test(q)) {
    list = list.filter((t) => !isDoneStatus(t.status));
  }

  if (/высок|🔴/i.test(q)) {
    list = list.filter((t) => /высок|🔴/i.test(t.priority || ""));
  }

  return list;
}

async function handleKatyaTaskQuery(msg: TgMessage, question: string) {
  try {
    if (!isGoogleSheetsReady()) {
      await reply(
        msg.chat.id,
        "Таблица задач пока не подключена. Нужны секреты Google Sheets.",
        msg.message_id,
      );
      return;
    }

    const { tasks, source } = await loadTasks();
    const wantsAnalytics =
      /(аналитик|статистик|сводк|отчёт|отчет|срез|сколько)/i.test(question) ||
      /^(задачи|планер|канбан)[!?.…]*$/i.test(question.trim());

    if (wantsAnalytics && !/(список|покаж|вывед)/i.test(question)) {
      await reply(msg.chat.id, tasksAnalytics(tasks), msg.message_id);
      // если просили и список — добавим кратко
      if (/(и\s+список|списком)/i.test(question)) {
        const filtered = filterTasksByQuestion(tasks, question);
        await reply(msg.chat.id, tasksAsTable(filtered, source), msg.message_id);
      }
      return;
    }

    const filtered = filterTasksByQuestion(tasks, question);
    const head = wantsAnalytics ? tasksAnalytics(tasks) + "\n\n" : "";
    await reply(
      msg.chat.id,
      head + tasksAsTable(filtered, source),
      msg.message_id,
    );
  } catch (e) {
    console.error("handleKatyaTaskQuery", e);
    await reply(
      msg.chat.id,
      `Не удалось прочитать задачи: <code>${escapeHtml(String(e).slice(0, 200))}</code>`,
      msg.message_id,
    );
  }
}

function escapeHtml(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function tasksCsv(tasks: TaskRow[]) {
  const header = "title,status,priority,assignee,due_date,notes";
  const rows = tasks.map((t) =>
    [t.title, t.status, t.priority, t.assignee || "", t.due_date || "", t.notes || ""]
      .map((c) => `"${String(c).replace(/"/g, '""')}"`)
      .join(","),
  );
  return [header, ...rows].join("\n");
}

async function handleTasker(msg: TgMessage, raw: string) {
  const groupId = allowedGroupId();
  if (groupId != null && msg.chat.id !== groupId && msg.chat.type !== "private") {
    await reply(msg.chat.id, "Tasker доступен только в рабочей группе или в личке с ботом.", msg.message_id);
    return;
  }

  const text = raw.replace(/^[#/]?tasker\s*/i, "").trim();
  const sheetsOn = isGoogleSheetsReady();

  if (!text || /^(help|помощь|\?)$/i.test(text)) {
    await reply(
      msg.chat.id,
      [
        "<b>Tasker · Google Sheets / задачи</b>",
        sheetsOn
          ? `Источник: <b>Google Sheets</b>\n<a href="${sheetPublicUrl()}">Открыть таблицу</a>`
          : "Источник: БД задач (Google Sheets ещё не подключён)",
        "",
        "<code>#tasker list</code> — сводка",
        "<code>#tasker csv</code> — CSV для Excel",
        "<code>#tasker done &lt;название&gt;</code> — статус done",
        "<code>#tasker todo &lt;название&gt;</code> — статус todo",
        "<code>#tasker note название | текст</code> — заметка",
        "<code>#tasker set A2 значение</code> — ячейка Sheets (A1)",
        "<code>#tasker add Название | status | priority | assignee</code> — новая строка",
      ].join("\n"),
      msg.message_id,
    );
    return;
  }

  // Прямое редактирование ячейки Google Sheets: #tasker set B3 в работе
  const setMatch = text.match(/^set\s+([A-Za-z]+\d+)\s+(.+)$/i);
  if (setMatch) {
    if (!sheetsOn) {
      await reply(msg.chat.id, "Google Sheets не настроен. Нужны секреты GOOGLE_SHEETS_ID и GOOGLE_SERVICE_ACCOUNT_JSON.", msg.message_id);
      return;
    }
    const a1 = `${sheetTabFromRange()}!${setMatch[1].toUpperCase()}`;
    await updateCell(a1, setMatch[2].trim());
    await reply(msg.chat.id, `✏️ ${a1} = <code>${escapeHtml(setMatch[2].trim())}</code>`, msg.message_id);
    return;
  }

  const addMatch = text.match(/^add\s+(.+)$/i);
  if (addMatch) {
    if (!sheetsOn) {
      await reply(msg.chat.id, "Добавление строк работает через Google Sheets. Подключите таблицу.", msg.message_id);
      return;
    }
    const parts = addMatch[1].split("|").map((s) => s.trim());
    await appendRow(parts);
    await reply(msg.chat.id, `➕ Строка добавлена: <b>${escapeHtml(parts[0] || "")}</b>`, msg.message_id);
    return;
  }

  const { tasks, source, table } = await loadTasks();

  if (/^(list|список|сводка)$/i.test(text)) {
    await reply(msg.chat.id, tasksAsTable(tasks, source), msg.message_id);
    return;
  }

  if (/^(csv|excel|таблица)$/i.test(text)) {
    const csv = tasksCsv(tasks);
    await reply(msg.chat.id, `<b>CSV</b>\n<pre>${escapeHtml(csv.slice(0, 3500))}</pre>`, msg.message_id);
    return;
  }

  const doneMatch = text.match(/^(done|готово|выполнено)\s+(.+)$/i);
  if (doneMatch) {
    const q = doneMatch[2].trim().toLowerCase();
    const hit = tasks.find((t) => t.title.toLowerCase().includes(q));
    if (!hit) {
      await reply(msg.chat.id, `Не нашёл «${escapeHtml(doneMatch[2])}».`, msg.message_id);
      return;
    }
    const doneStatus = sheetsOn ? "Готово" : "done";
    await patchTask(hit, { status: doneStatus }, table);
    await reply(msg.chat.id, `✅ <b>${escapeHtml(hit.title)}</b> → ${doneStatus}`, msg.message_id);
    return;
  }

  const todoMatch = text.match(/^(todo|вернуть)\s+(.+)$/i);
  if (todoMatch) {
    const q = todoMatch[2].trim().toLowerCase();
    const hit = tasks.find((t) => t.title.toLowerCase().includes(q));
    if (!hit) {
      await reply(msg.chat.id, `Не нашёл «${escapeHtml(todoMatch[2])}».`, msg.message_id);
      return;
    }
    const todoStatus = sheetsOn ? "Создана" : "todo";
    await patchTask(hit, { status: todoStatus }, table);
    await reply(msg.chat.id, `↩️ <b>${escapeHtml(hit.title)}</b> → ${todoStatus}`, msg.message_id);
    return;
  }

  const noteMatch = text.match(/^(note|заметка)\s+(.+?)\s*\|\s*(.+)$/i);
  if (noteMatch) {
    const q = noteMatch[2].trim().toLowerCase();
    const note = noteMatch[3].trim();
    const hit = tasks.find((t) => t.title.toLowerCase().includes(q));
    if (!hit) {
      await reply(msg.chat.id, `Не нашёл «${escapeHtml(noteMatch[2])}».`, msg.message_id);
      return;
    }
    await patchTask(hit, { notes: note }, table);
    await reply(msg.chat.id, `📝 Заметка для <b>${escapeHtml(hit.title)}</b> сохранена.`, msg.message_id);
    return;
  }

  await reply(msg.chat.id, "Не понял команду Tasker. Напишите <code>#tasker help</code>", msg.message_id);
}

function shouldIgnore(text: string) {
  const t = text.trim();
  if (t.length < 2) return true;
  if (/^(ок|ok|да|нет|👍|😂|\+|спс|спасибо)$/i.test(t)) return true;
  return false;
}

function isTaskerCommand(text: string) {
  return /^[#/]?tasker\b/i.test(text.trim());
}

Deno.serve(async (req) => {
  try {
    if (req.method === "GET") {
      return new Response(
        JSON.stringify({
          ok: true,
          service: "telegram-bot",
          hint: "POST Telegram updates here",
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405 });
    }

    const url = new URL(req.url);
    const secret = Deno.env.get("TELEGRAM_WEBHOOK_SECRET");
    if (secret && url.searchParams.get("secret") !== secret) {
      return new Response("Forbidden", { status: 403 });
    }

    const update = (await req.json().catch(() => ({}))) as TgUpdate;
    const msg = update.message;
    if (!msg?.text || msg.from?.is_bot) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const text = msg.text.trim();

    // Быстрые команды
    if (/^\/(start|help)/i.test(text)) {
      await reply(
        msg.chat.id,
        [
          "<b>Катя · АрендаСити</b>",
          "Пишите свободно, начиная с имени (общаюсь на Вы):",
          "<code>Катя какие объекты в Ангарске, напишите кол-во только</code>",
          "<code>Катя задача для Марии — согласовать вывеску до 14.05</code>",
          "<code>Катя покажите задачи</code>",
          "<code>Катя аналитика по задачам</code>",
          "",
          "В личке можно без имени. Tasker: <code>#tasker help</code>",
        ].join("\n"),
        msg.message_id,
      );
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (isTaskerCommand(text)) {
      await handleTasker(msg, text);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (shouldIgnore(text)) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const katya = parseKatyaAddress(text);
    const isPrivate = msg.chat.type === "private";
    const replyToBot = Boolean(msg.reply_to_message?.from?.is_bot);
    // В чатах ловим «Катя …»; в личке и ответом на сообщение бота — тоже
    const addressed =
      katya.addressed ||
      isPrivate ||
      replyToBot ||
      /@(аренда|arenda|бот|bot|катя)/i.test(text);

    if (!addressed) {
      return new Response(JSON.stringify({ ok: true, skipped: "not_addressed" }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const question = katya.addressed ? katya.question : text;
    if (katya.addressed && !question) {
      await reply(
        msg.chat.id,
        "Да, я здесь. Могу подобрать объекты, показать список/аналитику задач или записать новую.\nНапример: «Катя аналитика по задачам» или «Катя запишите в задачи — …»",
        msg.message_id,
      );
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    await tg("sendChatAction", { chat_id: msg.chat.id, action: "typing" });

    if (isTaskReadIntent(question)) {
      await handleKatyaTaskQuery(msg, question);
    } else if (isTaskWriteIntent(question)) {
      await handleKatyaTaskCreate(msg, question);
    } else {
      await handlePropertyQuestion(msg, question);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("telegram-bot:", e);
    try {
      // best-effort error to chat if we can parse body again — skip
    } catch {
      /* ignore */
    }
    // Telegram retries on non-200; return 200 to avoid loops, log error
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
});
