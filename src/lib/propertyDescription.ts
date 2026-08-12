/**
 * Разбор текстового описания объекта в структурированные блоки.
 *
 * Описания приходят из разных источников (импорт, ручной ввод, генерация ИИ)
 * и содержат разметку в виде эмодзи-заголовков, списков с ✅/•/— и строк
 * вида "Цена: 200 000 ₽". В HTML переносы строк схлопываются, поэтому текст
 * нужно разобрать и отрисовать блоками.
 */

export type DescriptionBlock =
  | { kind: "heading"; text: string; icon: string | null }
  | { kind: "paragraph"; text: string }
  | { kind: "list"; items: { icon: string | null; text: string }[] }
  | { kind: "facts"; items: { label: string; value: string }[] };

/** Максимальная длина строки, которая ещё может быть заголовком. */
const MAX_HEADING_LENGTH = 80;

/** Максимальная длина метки в строке вида "Цена: 200 000 ₽". */
const MAX_FACT_LABEL_LENGTH = 32;

/** Максимальная длина значения — иначе это обычное предложение с двоеточием. */
const MAX_FACT_VALUE_LENGTH = 48;

/** Максимальная длина пункта списка с эмодзи-маркером. */
const MAX_LIST_ITEM_LENGTH = 120;

/** Маркеры списка в начале строки. */
const BULLET_RE = /^(➡️|[✅✔☑✓•▪◦·—–\-👉→])\s+/u;

/** Ведущий эмодзи строки (заголовки часто начинаются с него). */
const LEADING_EMOJI_RE =
  /^(\p{Extended_Pictographic}(?:️)?(?:‍\p{Extended_Pictographic}(?:️)?)*)\s*/u;

/** Строка вида "Метка: значение". */
const FACT_RE = /^([^:]{2,32}):\s*(.+)$/u;

/** Снимает обёртывающие кавычки и лишние пробелы, нормализует переносы. */
function normalize(raw: string): string {
  let text = raw.replace(/\r\n?/g, "\n").trim();
  // Импортированные описания иногда целиком обёрнуты в кавычки.
  while (
    text.length > 1 &&
    ((text.startsWith('"') && text.endsWith('"')) ||
      (text.startsWith("«") && text.endsWith("»")))
  ) {
    text = text.slice(1, -1).trim();
  }
  // Незакрытая кавычка в начале — частый артефакт импорта из CSV.
  if (/^["«»]/.test(text)) text = text.slice(1).trim();
  return text;
}

/**
 * Вставляет переносы перед эмодзи-заголовками, если исходный текст пришёл
 * одним абзацем (частый случай при импорте — переносы теряются).
 */
function restoreBreaks(text: string): string {
  if (text.includes("\n")) return text;
  return text.replace(
    /\s+(?=\p{Extended_Pictographic}(?:️)?\s*\p{Lu})/gu,
    "\n",
  );
}

function splitLeadingEmoji(line: string): { icon: string | null; text: string } {
  const match = line.match(LEADING_EMOJI_RE);
  if (!match) return { icon: null, text: line };
  return { icon: match[1], text: line.slice(match[0].length).trim() };
}

/**
 * Заголовок — короткая строка без завершающей точки, начинающаяся с эмодзи
 * или целиком набранная как короткий заголовок раздела.
 */
function isHeading(line: string): boolean {
  if (line.length > MAX_HEADING_LENGTH) return false;
  if (BULLET_RE.test(line)) return false;
  if (/[.!?,;]$/.test(line)) return false;
  const { icon, text } = splitLeadingEmoji(line);
  if (!text) return false;
  // "🏡 Строительства дома — 5,4 соток" — это пункт списка с эмодзи-маркером,
  // а не заголовок раздела: пояснение через тире.
  if (text.includes(" — ") || text.includes(": ")) return false;
  if (icon) return true;
  // Без эмодзи считаем заголовком только явно короткие строки без двоеточия.
  return line.length <= 48 && !line.includes(":") && /^\p{Lu}/u.test(line);
}

/**
 * Строка с ведущим эмодзи и пояснением через тире — пункт списка
 * ("🏡 Строительства небольшого дома — 5,4 соток, центр города").
 */
function asEmojiListItem(line: string): { icon: string | null; text: string } | null {
  const { icon, text } = splitLeadingEmoji(line);
  if (!icon || !text) return null;
  if (!text.includes(" — ")) return null;
  // Длинная строка с двоеточием и точками — это абзац с эмодзи,
  // например "🚗 Транспорт: автобусы… Трасса М-53 — 115 км."
  if (text.length > MAX_LIST_ITEM_LENGTH) return null;
  if (/[.!?]\s/.test(text)) return null;
  return { icon, text };
}

/**
 * Отличает пару "метка — значение" ("Цена: 200 000 ₽") от обычного
 * предложения с двоеточием ("Инфраструктура рядом: магазины, аптеки…").
 */
function isFactLine(label: string, value: string): boolean {
  if (!label || !value) return false;
  if (label.length > MAX_FACT_LABEL_LENGTH || label.includes(" — ")) return false;
  if (value.length > MAX_FACT_VALUE_LENGTH) return false;
  // Перечисление или законченное предложение — это проза, а не значение.
  if (value.includes(",") || /[.!?;]$/.test(value)) return false;
  return true;
}

/** Делит абзац на строки-элементы, если маркеры идут внутри одной строки. */
function splitInlineBullets(paragraph: string): string[] {
  if (paragraph.includes("\n")) return paragraph.split("\n");
  const parts = paragraph.split(/\s+(?=[✅✔☑✓](?:️)?\s)/u);
  return parts.length > 1 ? parts : [paragraph];
}

export function parsePropertyDescription(raw: string | null | undefined): DescriptionBlock[] {
  if (!raw) return [];
  const text = restoreBreaks(normalize(raw));
  if (!text) return [];

  const blocks: DescriptionBlock[] = [];
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  for (const [index, paragraph] of paragraphs.entries()) {
    // Первая строка-заголовок объявления: эмодзи + название, части через "|".
    if (index === 0 && !paragraph.includes("\n") && paragraph.includes(" | ")) {
      const { icon, text: titleText } = splitLeadingEmoji(paragraph);
      if (icon) {
        blocks.push({ kind: "heading", text: titleText.split(" | ")[0].trim(), icon });
        const rest = titleText.split(" | ").slice(1).join(" · ").trim();
        if (rest) blocks.push({ kind: "paragraph", text: rest });
        continue;
      }
    }

    const lines = splitInlineBullets(paragraph)
      .map((l) => l.trim())
      .filter(Boolean);

    let listBuffer: { icon: string | null; text: string }[] = [];
    let factBuffer: { label: string; value: string }[] = [];
    let paragraphBuffer: string[] = [];

    const flushList = () => {
      if (listBuffer.length) {
        blocks.push({ kind: "list", items: listBuffer });
        listBuffer = [];
      }
    };
    const flushFacts = () => {
      if (factBuffer.length) {
        blocks.push({ kind: "facts", items: factBuffer });
        factBuffer = [];
      }
    };
    const flushParagraph = () => {
      if (paragraphBuffer.length) {
        blocks.push({ kind: "paragraph", text: paragraphBuffer.join(" ") });
        paragraphBuffer = [];
      }
    };
    const flushAll = () => {
      flushParagraph();
      flushList();
      flushFacts();
    };

    for (const line of lines) {
      const bullet = line.match(BULLET_RE);
      if (bullet) {
        flushParagraph();
        flushFacts();
        listBuffer.push({ icon: bullet[1], text: line.slice(bullet[0].length).trim() });
        continue;
      }

      if (isHeading(line)) {
        flushAll();
        const { icon, text: headingText } = splitLeadingEmoji(line);
        blocks.push({ kind: "heading", text: headingText, icon });
        continue;
      }

      const emojiItem = asEmojiListItem(line);
      if (emojiItem) {
        flushParagraph();
        flushFacts();
        listBuffer.push(emojiItem);
        continue;
      }

      const fact = line.match(FACT_RE);
      if (fact && isFactLine(fact[1].trim(), fact[2].trim())) {
        flushParagraph();
        flushList();
        factBuffer.push({ label: fact[1].trim(), value: fact[2].trim() });
        continue;
      }

      flushList();
      flushFacts();
      paragraphBuffer.push(line);
    }

    flushAll();
  }

  return blocks;
}
