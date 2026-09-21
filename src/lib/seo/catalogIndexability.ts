/**
 * Query-параметры каталога (фильтры, sort, page) дают дубли контента.
 * Canonical всегда на чистый path категории (/kupit/kvartiry);
 * при наличии soft-query — noindex,follow.
 */
const INDEXABLE_EMPTY = new Set([""]);

/** Параметры, которые не считаем «фильтром» (utm и т.п.). */
const IGNORED_KEYS = new Set([
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "fbclid",
  "gclid",
  "yclid",
  "tab",
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

/** Чистый path категории без query — indexable. */
export function catalogCanonicalPath(pathname: string): string {
  return pathname.replace(/\/+$/, "") || "/";
}
