/**
 * Query-параметры каталога (фильтры, sort, page) дают дубли контента.
 * Canonical всегда на чистый путь; при наличии query — noindex,follow.
 */
const INDEXABLE_EMPTY = new Set([""]);

/** Параметры, которые не считаем «фильтром» (редко; по умолчанию любой query → noindex). */
const IGNORED_KEYS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
  "gclid",
  "yclid",
  "tab", // вкладки каталога риелторов/агентств
]);

export function catalogHasFilterQuery(
  search: string | URLSearchParams,
): boolean {
  const params =
    typeof search === "string"
      ? new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
      : search;

  for (const key of params.keys()) {
    if (IGNORED_KEYS.has(key.toLowerCase())) continue;
    const value = params.get(key);
    if (value != null && value !== "" && !INDEXABLE_EMPTY.has(value)) {
      return true;
    }
  }
  return false;
}
