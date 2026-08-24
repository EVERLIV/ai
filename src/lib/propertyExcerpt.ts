import { parsePropertyDescription } from "@/lib/propertyDescription";

const DEFAULT_MAX = 155;

function truncateAtWord(text: string, max: number): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= max) return normalized;
  const slice = normalized.slice(0, max);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > max * 0.55 ? slice.slice(0, lastSpace) : slice;
  return `${cut.trim()}…`;
}

/** Plain-text excerpt for catalog cards — no mid-word cuts from raw imports. */
export function buildPropertyListingExcerpt(
  raw: string | null | undefined,
  maxLength = DEFAULT_MAX,
): string {
  if (!raw?.trim()) return "";

  const blocks = parsePropertyDescription(raw);
  const parts: string[] = [];

  for (const block of blocks) {
    if (block.kind === "paragraph") {
      parts.push(block.text);
    } else if (block.kind === "list") {
      for (const item of block.items) {
        parts.push(item.text);
      }
    } else if (block.kind === "facts") {
      for (const item of block.items) {
        parts.push(`${item.label}: ${item.value}`);
      }
    } else if (block.kind === "heading" && parts.length === 0) {
      parts.push(block.text);
    }
    if (parts.join(" ").length >= maxLength) break;
  }

  const joined = parts.join(" ").replace(/\s+/g, " ").trim();
  if (joined) return truncateAtWord(joined, maxLength);

  return truncateAtWord(raw.replace(/\s+/g, " ").trim(), maxLength);
}
