import Fuse from "fuse.js";
import { rankByQualityMatch } from "@/lib/recommendationEngine";

/** Ключи сортировки каталога (как у агрегаторов). */
export type CatalogSortKey =
  | "default"
  | "price_asc"
  | "price_desc"
  | "price_m2_asc"
  | "price_m2_desc"
  | "area_asc"
  | "area_desc"
  | "metro_asc"
  | "street_asc"
  | "date_desc"
  | "date_asc";

export const CATALOG_SORT_OPTIONS: {
  label: string;
  value: CatalogSortKey;
}[] = [
  { label: "По релевантности (Quality Match)", value: "default" },
  { label: "По цене (сначала дешевле)", value: "price_asc" },
  { label: "По цене (сначала дороже)", value: "price_desc" },
  { label: "По цене за м² (сначала дешевле)", value: "price_m2_asc" },
  { label: "По цене за м² (сначала дороже)", value: "price_m2_desc" },
  { label: "По общей площади", value: "area_desc" },
  { label: "По площади (сначала меньше)", value: "area_asc" },
  { label: "По времени до метро", value: "metro_asc" },
  { label: "По улице", value: "street_asc" },
  { label: "По дате (сначала новые)", value: "date_desc" },
  { label: "По дате (сначала старые)", value: "date_asc" },
];

/** Обратная совместимость со старыми URL `sort=date`. */
export function normalizeCatalogSortKey(raw: string | null | undefined): CatalogSortKey {
  const v = (raw || "default").trim();
  if (v === "date") return "date_desc";
  if (CATALOG_SORT_OPTIONS.some((o) => o.value === v)) {
    return v as CatalogSortKey;
  }
  return "default";
}

export type SortableProperty = {
  id: string;
  price?: number | string | null;
  price_per_m2?: number | string | null;
  area?: number | string | null;
  address?: string | null;
  district?: string | null;
  published_date?: string | null;
  created_at?: string | null;
  title?: string | null;
  description?: string | null;
  type?: string | null;
  deal_type?: string | null;
  segment?: string | null;
  class?: string | null;
  condition?: string | null;
  cover_photo?: string | null;
  photos?: string[] | null;
  photos_count?: number | null;
  features?: string[] | null;
  views_count?: number | null;
  floor?: string | null;
  parking?: string | null;
  ceiling_height?: number | null;
  lat?: number | null;
  lng?: number | null;
  extras?: Record<string, unknown> | null | unknown;
};

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function priceM2(p: SortableProperty): number {
  const direct = num(p.price_per_m2);
  if (direct > 0) return direct;
  const price = num(p.price);
  const area = num(p.area);
  if (price > 0 && area > 0) return price / area;
  return 0;
}

/** Минуты до метро из extras (metro_minutes / metro). */
export function getMetroMinutes(p: SortableProperty): number {
  const e = p.extras || {};
  const raw =
    e.metro_minutes ?? e.metro_min ?? e.metro ?? e.time_to_metro ?? null;
  if (raw == null || raw === "" || raw === "—") return Number.POSITIVE_INFINITY;
  if (typeof raw === "number") {
    return Number.isFinite(raw) ? raw : Number.POSITIVE_INFINITY;
  }
  const match = String(raw).match(/(\d+(?:[.,]\d+)?)/);
  if (!match) return Number.POSITIVE_INFINITY;
  const n = Number(match[1].replace(",", "."));
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
}

function streetKey(p: SortableProperty): string {
  const addr = (p.address || "").trim().toLowerCase();
  if (!addr) return "\uffff";
  // «ул. Ленина, 10» → берём основную часть без номера дома в конце
  return addr.replace(/,\s*\d+[а-яa-z]?$/i, "").trim() || addr;
}

function dateTs(p: SortableProperty): number {
  const raw = p.published_date || p.created_at || "";
  const t = Date.parse(raw);
  return Number.isFinite(t) ? t : 0;
}

function compareNum(
  a: number,
  b: number,
  dir: "asc" | "desc",
  emptyLast = true,
): number {
  const aEmpty = !Number.isFinite(a) || a <= 0;
  const bEmpty = !Number.isFinite(b) || b <= 0;
  if (emptyLast) {
    if (aEmpty && bEmpty) return 0;
    if (aEmpty) return 1;
    if (bEmpty) return -1;
  }
  return dir === "asc" ? a - b : b - a;
}

/**
 * Умный поиск: Fuse.js ранжирует по релевантности (адрес, район, тип, описание).
 * Возвращает id в порядке score (лучше → раньше).
 */
export function rankPropertyIdsByQuery<T extends SortableProperty>(
  items: T[],
  query: string,
): string[] {
  const q = query.trim();
  if (!q || items.length === 0) return items.map((i) => i.id);

  const fuse = new Fuse(items, {
    keys: [
      { name: "address", weight: 0.35 },
      { name: "district", weight: 0.25 },
      { name: "type", weight: 0.15 },
      { name: "title", weight: 0.15 },
      { name: "description", weight: 0.1 },
    ],
    threshold: 0.45,
    ignoreLocation: true,
    includeScore: true,
  });

  const hits = fuse.search(q);
  if (!hits.length) {
    // Fallback: простая подстрока, как раньше
    const lower = q.toLowerCase();
    return items
      .filter(
        (p) =>
          (p.address || "").toLowerCase().includes(lower) ||
          (p.district || "").toLowerCase().includes(lower) ||
          (p.type || "").toLowerCase().includes(lower) ||
          (p.description || "").toLowerCase().includes(lower),
      )
      .map((p) => p.id);
  }
  return hits.map((h) => h.item.id);
}

/** Сортировка списка объектов каталога. */
export function sortCatalogProperties<T extends SortableProperty>(
  items: T[],
  sort: CatalogSortKey,
  opts?: { searchQuery?: string },
): T[] {
  const list = [...items];
  const query = opts?.searchQuery?.trim() || "";

  if (sort === "default") {
    // Quality Match: качество карточки + предпочтения + (при запросе) текст.
    // Fuse усиливает порядок при явном поисковом запросе.
    const ranked = rankByQualityMatch(list, { searchQuery: query });
    if (!query) return ranked;

    const fuseOrder = rankPropertyIdsByQuery(ranked, query);
    const fuseRank = new Map(fuseOrder.map((id, i) => [id, i]));
    return [...ranked].sort((a, b) => {
      const ra = fuseRank.has(a.id) ? fuseRank.get(a.id)! : 999999;
      const rb = fuseRank.has(b.id) ? fuseRank.get(b.id)! : 999999;
      if (ra !== rb) return ra - rb;
      return dateTs(b) - dateTs(a);
    });
  }

  switch (sort) {
    case "price_asc":
      list.sort((a, b) => compareNum(num(a.price), num(b.price), "asc"));
      break;
    case "price_desc":
      list.sort((a, b) => compareNum(num(a.price), num(b.price), "desc"));
      break;
    case "price_m2_asc":
      list.sort((a, b) => compareNum(priceM2(a), priceM2(b), "asc"));
      break;
    case "price_m2_desc":
      list.sort((a, b) => compareNum(priceM2(a), priceM2(b), "desc"));
      break;
    case "area_asc":
      list.sort((a, b) => compareNum(num(a.area), num(b.area), "asc"));
      break;
    case "area_desc":
      list.sort((a, b) => compareNum(num(a.area), num(b.area), "desc"));
      break;
    case "metro_asc":
      list.sort((a, b) => {
        const ma = getMetroMinutes(a);
        const mb = getMetroMinutes(b);
        if (ma === mb) return dateTs(b) - dateTs(a);
        return ma - mb;
      });
      break;
    case "street_asc":
      list.sort((a, b) => {
        const cmp = streetKey(a).localeCompare(streetKey(b), "ru");
        if (cmp !== 0) return cmp;
        return dateTs(b) - dateTs(a);
      });
      break;
    case "date_asc":
      list.sort((a, b) => dateTs(a) - dateTs(b));
      break;
    case "date_desc":
    default:
      list.sort((a, b) => dateTs(b) - dateTs(a));
      break;
  }

  return list;
}
