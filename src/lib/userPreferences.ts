/**
 * Сигналы предпочтений пользователя (локально в браузере).
 * Используются рекомендательным ранжированием — без продажи позиции за деньги.
 */

const STORAGE_KEY = "ac_rec_prefs_v1";
const MAX_RECENT = 40;

export type UserPreferenceSignals = {
  /** Недавние просмотры объявлений */
  viewedIds: string[];
  /** Типы объектов (Офис, Квартира…) */
  types: Record<string, number>;
  /** Районы */
  districts: Record<string, number>;
  /** Аренда / Продажа */
  dealTypes: Record<string, number>;
  /** Сегмент commercial | residential */
  segments: Record<string, number>;
  /** Цены просмотренных (для медианы) */
  prices: number[];
  /** Площади просмотренных */
  areas: number[];
  /** Последние текстовые запросы */
  queries: string[];
  updatedAt: number;
};

function emptyPrefs(): UserPreferenceSignals {
  return {
    viewedIds: [],
    types: {},
    districts: {},
    dealTypes: {},
    segments: {},
    prices: [],
    areas: [],
    queries: [],
    updatedAt: 0,
  };
}

function bump(map: Record<string, number>, key: string, by = 1) {
  const k = key.trim();
  if (!k || k === "—" || k === "Все") return;
  map[k] = (map[k] || 0) + by;
}

export function readUserPreferences(): UserPreferenceSignals {
  if (typeof window === "undefined") return emptyPrefs();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyPrefs();
    const parsed = JSON.parse(raw) as Partial<UserPreferenceSignals>;
    return {
      ...emptyPrefs(),
      ...parsed,
      viewedIds: Array.isArray(parsed.viewedIds) ? parsed.viewedIds : [],
      types: parsed.types || {},
      districts: parsed.districts || {},
      dealTypes: parsed.dealTypes || {},
      segments: parsed.segments || {},
      prices: Array.isArray(parsed.prices) ? parsed.prices : [],
      areas: Array.isArray(parsed.areas) ? parsed.areas : [],
      queries: Array.isArray(parsed.queries) ? parsed.queries : [],
      updatedAt: Number(parsed.updatedAt) || 0,
    };
  } catch {
    return emptyPrefs();
  }
}

function writePrefs(prefs: UserPreferenceSignals) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* quota */
  }
}

export type PreferenceEventProperty = {
  id: string;
  type?: string | null;
  district?: string | null;
  deal_type?: string | null;
  segment?: string | null;
  price?: number | string | null;
  area?: number | string | null;
};

/** Фиксация просмотра карточки / страницы объекта */
export function trackPropertyPreference(property: PreferenceEventProperty) {
  const prefs = readUserPreferences();
  prefs.viewedIds = [
    property.id,
    ...prefs.viewedIds.filter((id) => id !== property.id),
  ].slice(0, MAX_RECENT);
  if (property.type) bump(prefs.types, property.type, 2);
  if (property.district) bump(prefs.districts, property.district, 2);
  if (property.deal_type) bump(prefs.dealTypes, property.deal_type, 1);
  if (property.segment) bump(prefs.segments, String(property.segment), 1);
  const price = Number(property.price);
  if (Number.isFinite(price) && price > 0) {
    prefs.prices = [...prefs.prices, price].slice(-MAX_RECENT);
  }
  const area = Number(property.area);
  if (Number.isFinite(area) && area > 0) {
    prefs.areas = [...prefs.areas, area].slice(-MAX_RECENT);
  }
  prefs.updatedAt = Date.now();
  writePrefs(prefs);
}

/** Фиксация поискового запроса и фильтров каталога */
export function trackSearchPreference(input: {
  query?: string;
  types?: string[];
  district?: string;
  dealType?: string;
  segment?: string;
}) {
  const prefs = readUserPreferences();
  const q = input.query?.trim();
  if (q && q.length >= 2) {
    prefs.queries = [q, ...prefs.queries.filter((x) => x !== q)].slice(0, 12);
  }
  for (const t of input.types || []) bump(prefs.types, t, 1);
  if (input.district && input.district !== "Все") {
    bump(prefs.districts, input.district, 1);
  }
  if (input.dealType && input.dealType !== "Все") {
    bump(prefs.dealTypes, input.dealType, 1);
  }
  if (input.segment) bump(prefs.segments, input.segment, 1);
  prefs.updatedAt = Date.now();
  writePrefs(prefs);
}

export function clearUserPreferences() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}

export function median(values: number[]): number | null {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2;
}
