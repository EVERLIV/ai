import type { PropertySegment } from "@/config/propertySegments";
import { isAgencyListing } from "@/lib/listingSource";
import { isBroadLocation, propertyMatchesLocation } from "@/lib/irkutskLocations";
import {
  getPropertySegment,
  getPropertyTypes,
  propertyMatchesSegment,
  propertyMatchesTypes,
} from "@/lib/propertyTypes";
import { getResidentialMarket, getResidentialRooms } from "@/lib/propertyResidential";
import { scoreListingQuality } from "@/lib/recommendationEngine";

export type SmartPickCatalog = "all" | PropertySegment;

export type SmartPickCriteria = {
  catalog: SmartPickCatalog;
  deal: string;
  type: string;
  location: string;
  budgetMin: number | null;
  budgetMax: number | null;
  areaMin: number | null;
  areaMax: number | null;
  rooms: string;
  market: string;
  propertyClass: string;
  condition: string;
  features: string[];
  activity: string;
  notes: string;
};

export type SmartPickProperty = {
  id: string;
  type?: string | null;
  deal_type?: string | null;
  district?: string | null;
  address?: string | null;
  price?: number | string | null;
  price_per_m2?: number | string | null;
  area?: number | string | null;
  class?: string | null;
  condition?: string | null;
  features?: string[] | null;
  floor?: string | null;
  total_floors?: string | null;
  ceiling_height?: number | string | null;
  description?: string | null;
  segment?: string | null;
  extras?: Record<string, unknown> | null;
  cover_photo?: string | null;
  agency_id?: string | null;
};

export type SmartPickScored = {
  property: SmartPickProperty;
  fit_score: number;
  reason: string;
  highlights: string[];
};

export type SmartPickLite = {
  id: string;
  type: string;
  types: string[];
  deal_type: string;
  segment: string;
  district: string;
  address: string;
  price: number;
  area: number;
  class: string;
  condition: string | null;
  features: string[] | null;
  rooms: string;
  market: string;
  seller: "agency" | "owner";
  floor: string | null;
  ceiling_height: number | null;
};

const ROOMS_TYPES = new Set([
  "Квартира",
  "Комната",
  "Апартаменты",
  "Таунхаус",
]);

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function isAny(value: string | null | undefined): boolean {
  const v = (value || "").trim();
  return !v || v === "Любое" || v === "Любой" || v === "Все";
}

export function typeUsesRooms(type: string): boolean {
  return ROOMS_TYPES.has(type);
}

function roomsMatch(property: SmartPickProperty, rooms: string): boolean {
  if (!rooms) return true;
  const actual = getResidentialRooms(property);
  if (!actual) return false;
  if (rooms === "4+") {
    const n = Number.parseInt(actual, 10);
    return actual === "4+" || (Number.isFinite(n) && n >= 4);
  }
  return actual === rooms || actual.startsWith(rooms);
}

function catalogMatch(
  property: SmartPickProperty,
  catalog: SmartPickCatalog,
): boolean {
  if (catalog === "all") return true;
  return propertyMatchesSegment(property, catalog);
}

export function matchesSmartPickFilters(
  property: SmartPickProperty,
  criteria: SmartPickCriteria,
  mode: "strict" | "soft" = "strict",
): boolean {
  if (!catalogMatch(property, criteria.catalog)) return false;
  if (!isAny(criteria.deal) && property.deal_type !== criteria.deal) return false;
  if (criteria.type && !propertyMatchesTypes(property, [criteria.type])) {
    return false;
  }
  if (
    mode === "strict" &&
    !propertyMatchesLocation(property, criteria.location)
  ) {
    return false;
  }
  const price = num(property.price);
  if (mode === "strict" && criteria.budgetMin && price > 0 && price < criteria.budgetMin) {
    return false;
  }
  if (mode === "strict" && criteria.budgetMax && price > criteria.budgetMax) {
    return false;
  }
  const area = num(property.area);
  if (mode === "strict" && criteria.areaMin && area > 0 && area < criteria.areaMin) {
    return false;
  }
  if (mode === "strict" && criteria.areaMax && area > criteria.areaMax) {
    return false;
  }
  if (criteria.rooms) {
    const types = getPropertyTypes(property);
    const usesRooms =
      typeUsesRooms(criteria.type) || types.some((t) => typeUsesRooms(t));
    if (usesRooms && !roomsMatch(property, criteria.rooms)) return false;
  }
  if (criteria.market && getResidentialMarket(property) !== criteria.market) {
    if (mode === "strict") return false;
  }
  return true;
}

function scenarioHaystack(property: SmartPickProperty): string {
  return [
    property.address,
    property.district,
    property.description || "",
    ...(property.features || []),
    ...getPropertyTypes(property),
    property.deal_type,
  ]
    .join(" ")
    .toLowerCase();
}

export function scoreSmartPick(
  property: SmartPickProperty,
  criteria: SmartPickCriteria,
): SmartPickScored {
  let score = 28;
  const highlights: string[] = [];
  const reasons: string[] = [];

  if (!isAny(criteria.deal) && property.deal_type === criteria.deal) {
    score += 10;
    highlights.push(property.deal_type || "");
  }
  if (criteria.type && propertyMatchesTypes(property, [criteria.type])) {
    score += 16;
    highlights.push(criteria.type);
    reasons.push(`тип ${criteria.type}`);
  }

  if (propertyMatchesLocation(property, criteria.location)) {
    score += 14;
    if (!isBroadLocation(criteria.location)) {
      highlights.push(criteria.location);
      reasons.push(`локация ${property.district || criteria.location}`);
    }
  } else if (!isBroadLocation(criteria.location)) {
    score -= 8;
  }

  const price = num(property.price);
  if (criteria.budgetMin || criteria.budgetMax) {
    const min = criteria.budgetMin ?? 0;
    const max = criteria.budgetMax ?? Number.POSITIVE_INFINITY;
    if (price > 0 && price >= min && price <= max) {
      score += 14;
      highlights.push("в бюджете");
      reasons.push(`цена ${price.toLocaleString("ru-RU")} ₽`);
    } else if (price > 0) {
      score -= 6;
    }
  }

  const area = num(property.area);
  if (criteria.areaMin || criteria.areaMax) {
    const min = criteria.areaMin ?? 0;
    const max = criteria.areaMax ?? Number.POSITIVE_INFINITY;
    if (area > 0 && area >= min && area <= max) {
      score += 10;
      highlights.push(`${area} м²`);
      reasons.push(`площадь ${area} м²`);
    } else if (area > 0) {
      score -= 4;
    }
  }

  if (criteria.rooms && roomsMatch(property, criteria.rooms)) {
    score += 10;
    highlights.push(
      criteria.rooms === "Студия" ? "студия" : `${criteria.rooms} комн.`,
    );
  }

  if (criteria.market && getResidentialMarket(property) === criteria.market) {
    score += 8;
    highlights.push(criteria.market);
  }

  if (
    !isAny(criteria.propertyClass) &&
    property.class === criteria.propertyClass
  ) {
    score += 7;
    highlights.push(`класс ${property.class}`);
  }

  if (!isAny(criteria.condition) && property.condition === criteria.condition) {
    score += 6;
    highlights.push(criteria.condition);
  }

  const propertyFeatures = (property.features || []).map((f) =>
    f.toLowerCase().trim(),
  );
  const matchedFeatures = criteria.features.filter((feature) =>
    propertyFeatures.some(
      (value) =>
        value.includes(feature.toLowerCase()) ||
        feature.toLowerCase().includes(value),
    ),
  );
  if (matchedFeatures.length > 0) {
    score += matchedFeatures.length * 4;
    highlights.push(...matchedFeatures.slice(0, 2));
  }

  const scenario = [criteria.activity, criteria.notes].join(" ").toLowerCase().trim();
  if (scenario) {
    const tokens = scenario
      .split(/[\s,.;:()/-]+/)
      .filter((token) => token.length > 3);
    const hay = scenarioHaystack(property);
    const hits = tokens.filter((token) => hay.includes(token));
    if (hits.length > 0) {
      score += Math.min(14, hits.length * 4);
      highlights.push("по задаче");
    }
  }

  score += Math.min(12, Math.round(scoreListingQuality(property) * 0.08));

  const fit = Math.max(42, Math.min(99, Math.round(score)));
  return {
    property,
    fit_score: fit,
    reason:
      reasons.slice(0, 2).join(", ") ||
      "Совпадает с параметрами запроса по каталогу.",
    highlights: [...new Set(highlights.filter(Boolean))].slice(0, 4),
  };
}

export function rankSmartPicks(
  properties: SmartPickProperty[],
  criteria: SmartPickCriteria,
  limit = 8,
): SmartPickScored[] {
  let pool = properties.filter((p) => matchesSmartPickFilters(p, criteria, "strict"));
  if (pool.length === 0) {
    pool = properties.filter((p) => matchesSmartPickFilters(p, criteria, "soft"));
  }
  if (pool.length === 0) pool = properties;

  return pool
    .map((property) => scoreSmartPick(property, criteria))
    .sort((a, b) => b.fit_score - a.fit_score)
    .slice(0, limit);
}

export function toSmartPickLite(property: SmartPickProperty): SmartPickLite {
  return {
    id: property.id,
    type: property.type || "",
    types: getPropertyTypes(property),
    deal_type: property.deal_type || "",
    segment: getPropertySegment(property),
    district: property.district || "",
    address: property.address || "",
    price: num(property.price),
    area: num(property.area),
    class: property.class || "",
    condition: property.condition ?? null,
    features: (property.features || []).slice(0, 8),
    rooms: getResidentialRooms(property),
    market: getResidentialMarket(property),
    seller: isAgencyListing(property) ? "agency" : "owner",
    floor: property.floor ?? null,
    ceiling_height: property.ceiling_height
      ? num(property.ceiling_height)
      : null,
  };
}

export function buildSmartPickSummary(
  count: number,
  criteria: SmartPickCriteria,
): string {
  const parts: string[] = [];
  if (!isAny(criteria.deal)) parts.push(criteria.deal.toLowerCase());
  if (criteria.type) parts.push(criteria.type.toLowerCase());
  if (!isBroadLocation(criteria.location)) parts.push(`в ${criteria.location}`);
  const catalog =
    criteria.catalog === "all"
      ? "по всей базе агентств и риелторов"
      : criteria.catalog === "residential"
        ? "в жилом каталоге"
        : "в коммерческом каталоге";
  const noun = count === 1 ? "вариант" : count < 5 ? "варианта" : "вариантов";
  const extra = parts.length > 0 ? `: ${parts.join(", ")}` : "";
  return `Подобрали ${count} ${noun} ${catalog}${extra}.`;
}
