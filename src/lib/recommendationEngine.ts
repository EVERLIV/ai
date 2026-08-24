/**
 * Quality Match — рекомендательный ранжировщик АрендаСити.
 *
 * Принцип: подбор по качеству объявления и соответствию запросу пользователя.
 * Оплата агентства, «премиум»-пакеты и рекламный бюджет НЕ влияют на позицию.
 *
 * Два этапа (как у крупных агрегаторов, но с другим целевым функционалом):
 * 1) отбор кандидатов по качеству карточки из активной выборки;
 * 2) переранжирование с учётом предпочтений пользователя и текстовой релевантности.
 */

import {
  median,
  readUserPreferences,
  type UserPreferenceSignals,
} from "@/lib/userPreferences";

export type RecommendableProperty = {
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

function dateTs(p: RecommendableProperty): number {
  const raw = p.published_date || p.created_at || "";
  const t = Date.parse(raw);
  return Number.isFinite(t) ? t : 0;
}

function photoCount(p: RecommendableProperty): number {
  if (typeof p.photos_count === "number" && p.photos_count > 0) {
    return p.photos_count;
  }
  const fromArr = Array.isArray(p.photos) ? p.photos.length : 0;
  if (fromArr > 0) return fromArr;
  return p.cover_photo ? 1 : 0;
}

function descLen(p: RecommendableProperty): number {
  return (p.description || "").trim().length;
}

function hasCoords(p: RecommendableProperty): boolean {
  return Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng));
}

function extrasRecord(p: RecommendableProperty): Record<string, unknown> {
  if (!p.extras || typeof p.extras !== "object" || Array.isArray(p.extras)) {
    return {};
  }
  return p.extras as Record<string, unknown>;
}

/** Верифицированный продавец / агентство — сигнал доверия, не платёж. */
function trustBoost(p: RecommendableProperty): number {
  const e = extrasRecord(p);
  let score = 0;
  if (e.agency_verified === true || e.is_verified === true) score += 8;
  if (e.agent_verified === true) score += 4;
  if (typeof e.avg_rating === "number" && e.avg_rating >= 4) score += 4;
  if (typeof e.reviews_count === "number" && e.reviews_count >= 3) score += 2;
  return score;
}

/**
 * Оценка качества карточки (0…~100).
 * Полнота, свежесть, умеренный интерес аудитории — без pay-to-rank.
 */
export function scoreListingQuality(p: RecommendableProperty): number {
  let s = 0;
  const photos = photoCount(p);
  s += Math.min(22, photos * 3.5);
  if (p.cover_photo) s += 4;

  const d = descLen(p);
  if (d >= 400) s += 16;
  else if (d >= 180) s += 12;
  else if (d >= 80) s += 7;
  else if (d >= 30) s += 3;

  const features = Array.isArray(p.features) ? p.features.length : 0;
  s += Math.min(10, features * 1.5);

  if (num(p.price) > 0) s += 6;
  if (num(p.area) > 0) s += 4;
  if (num(p.price_per_m2) > 0) s += 3;
  if ((p.district || "").trim() && p.district !== "—") s += 4;
  if ((p.address || "").trim().length > 8) s += 3;
  if ((p.floor || "") && p.floor !== "-" && p.floor !== "—") s += 2;
  if ((p.parking || "") && p.parking !== "Нет" && p.parking !== "-") s += 2;
  if (num(p.ceiling_height) > 0) s += 2;
  if ((p.condition || "").trim()) s += 2;
  if ((p.class || "").trim() && p.class !== "—") s += 2;
  if (hasCoords(p)) s += 5;

  // Свежесть: до 18 баллов за публикации за последние ~45 дней
  const ageDays = (Date.now() - dateTs(p)) / (1000 * 60 * 60 * 24);
  if (dateTs(p) > 0) {
    if (ageDays <= 3) s += 18;
    else if (ageDays <= 14) s += 14;
    else if (ageDays <= 45) s += 9;
    else if (ageDays <= 120) s += 4;
  }

  // Просмотры — мягкий сигнал спроса, с насыщением (не «накрутка позиции»)
  const views = Math.max(0, num(p.views_count));
  s += Math.min(8, Math.log10(views + 1) * 3);

  s += trustBoost(p);
  return s;
}

function topKeys(map: Record<string, number>, n = 5): string[] {
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([k]) => k);
}

/** Соответствие предпочтениям пользователя (0…~40). */
export function scorePreferenceFit(
  p: RecommendableProperty,
  prefs: UserPreferenceSignals,
): number {
  let s = 0;
  if (prefs.viewedIds.includes(p.id)) {
    // Уже смотрели — чуть ниже, чтобы показать новое похожее
    s -= 6;
  }
  if (p.type && prefs.types[p.type]) {
    s += Math.min(12, prefs.types[p.type] * 2);
  }
  if (p.district && prefs.districts[p.district]) {
    s += Math.min(12, prefs.districts[p.district] * 2);
  }
  if (p.deal_type && prefs.dealTypes[p.deal_type]) {
    s += Math.min(6, prefs.dealTypes[p.deal_type] * 1.5);
  }
  if (p.segment && prefs.segments[String(p.segment)]) {
    s += Math.min(5, prefs.segments[String(p.segment)]);
  }

  const medPrice = median(prefs.prices);
  const price = num(p.price);
  if (medPrice && price > 0) {
    const ratio = price / medPrice;
    if (ratio >= 0.7 && ratio <= 1.35) s += 8;
    else if (ratio >= 0.5 && ratio <= 1.7) s += 4;
  }

  const medArea = median(prefs.areas);
  const area = num(p.area);
  if (medArea && area > 0) {
    const ratio = area / medArea;
    if (ratio >= 0.7 && ratio <= 1.35) s += 6;
    else if (ratio >= 0.5 && ratio <= 1.7) s += 3;
  }

  // Похожесть на недавно просмотренные типы/районы (топ)
  const topTypes = new Set(topKeys(prefs.types, 3));
  const topDistricts = new Set(topKeys(prefs.districts, 3));
  if (p.type && topTypes.has(p.type)) s += 3;
  if (p.district && topDistricts.has(p.district)) s += 3;

  return s;
}

function textBlob(p: RecommendableProperty): string {
  return [
    p.address,
    p.district,
    p.type,
    p.title,
    p.description,
    p.deal_type,
    ...(p.features || []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

/** Лёгкая текстовая релевантность без внешней модели. */
export function scoreTextRelevance(
  p: RecommendableProperty,
  query: string,
): number {
  const q = query.trim().toLowerCase();
  if (!q) return 0;
  const blob = textBlob(p);
  const tokens = q.split(/\s+/).filter((t) => t.length >= 2);
  if (!tokens.length) return blob.includes(q) ? 20 : 0;
  let hits = 0;
  for (const t of tokens) {
    if (blob.includes(t)) hits += 1;
  }
  const ratio = hits / tokens.length;
  return ratio * 28 + (blob.includes(q) ? 8 : 0);
}

export type RankOptions = {
  searchQuery?: string;
  prefs?: UserPreferenceSignals;
  /** Доля кандидатов после этапа 1 (по умолчанию ~1/3 как у крупных площадок) */
  candidateRatio?: number;
  /** Минимум кандидатов */
  minCandidates?: number;
};

/**
 * Итоговый скор: качество + предпочтения + поиск.
 * Явно без сигналов оплаты / рекламного приоритета.
 */
export function scoreForRecommendation(
  p: RecommendableProperty,
  opts: RankOptions = {},
): number {
  const prefs = opts.prefs ?? readUserPreferences();
  const quality = scoreListingQuality(p);
  const fit = scorePreferenceFit(p, prefs);
  const text = scoreTextRelevance(p, opts.searchQuery || "");
  // Веса: качество доминирует; деньги агентства не участвуют
  return quality * 1.0 + fit * 1.15 + text * 1.25;
}

/**
 * Двухэтапное ранжирование Quality Match.
 */
export function rankByQualityMatch<T extends RecommendableProperty>(
  items: T[],
  opts: RankOptions = {},
): T[] {
  if (items.length <= 1) return [...items];

  const prefs = opts.prefs ?? readUserPreferences();
  const ratio = opts.candidateRatio ?? 0.34;
  const minCand = opts.minCandidates ?? Math.min(24, items.length);

  // Этап 1: отбор по качеству карточки
  const withQuality = items.map((item) => ({
    item,
    quality: scoreListingQuality(item),
  }));
  withQuality.sort((a, b) => b.quality - a.quality);

  const candidateCount = Math.max(
    minCand,
    Math.ceil(items.length * ratio),
  );
  const candidates = withQuality.slice(
    0,
    Math.min(candidateCount, items.length),
  );

  // Этап 2: переранжирование по предпочтениям + запросу
  const scored = candidates.map(({ item, quality }) => ({
    item,
    score:
      quality * 1.0 +
      scorePreferenceFit(item, prefs) * 1.15 +
      scoreTextRelevance(item, opts.searchQuery || "") * 1.25,
  }));
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return dateTs(b.item) - dateTs(a.item);
  });

  const rankedIds = new Set(scored.map((s) => s.item.id));
  const head = scored.map((s) => s.item);
  // Остаток — по качеству, чтобы каталог не «терял» объекты
  const rest = withQuality
    .filter((x) => !rankedIds.has(x.item.id))
    .map((x) => x.item);

  return [...head, ...rest];
}

/** Название технологии для UI / юридики */
export const RECOMMENDATION_TECH_NAME = "Quality Match";
export const RECOMMENDATION_TECH_NAME_RU = "Качественный подбор";
