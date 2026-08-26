/** Коммерческая земля и жилой участок (без импорта propertyLand — без циклов). */
export const LAND_PROPERTY_TYPE = "Земля";
export const RESIDENTIAL_LAND_TYPE = "Участок";

export const FLAT_LIKE_TYPES = [
  "Квартира",
  "Комната",
  "Апартаменты",
  "Доля",
] as const;
export const HOUSE_LIKE_TYPES = [
  "Дом",
  "Дом на заказ",
  "Коттедж",
  "Дача",
  "Таунхаус",
] as const;
export const PARKING_LIKE_TYPES = ["Гараж", "Машиноместо"] as const;

export type PropertyTypesSource =
  | string
  | string[]
  | {
      type?: string | null;
      extras?: { property_types?: unknown; [key: string]: unknown } | null;
    }
  | null
  | undefined;

function collectTypes(source: PropertyTypesSource): string[] {
  if (!source) return [];
  if (typeof source === "string") return source.trim() ? [source.trim()] : [];
  if (Array.isArray(source)) {
    return source.map((t) => String(t).trim()).filter(Boolean);
  }
  const fromExtras = source.extras?.property_types;
  if (Array.isArray(fromExtras) && fromExtras.length > 0) {
    return fromExtras.filter(
      (t): t is string => typeof t === "string" && t.trim().length > 0,
    );
  }
  if (source.type?.trim()) return [source.type.trim()];
  return [];
}

function hasAny(types: string[], set: readonly string[]): boolean {
  return types.some((t) => set.includes(t));
}

export function isCommercialLand(source: PropertyTypesSource): boolean {
  return collectTypes(source).includes(LAND_PROPERTY_TYPE);
}

export function isResidentialLand(source: PropertyTypesSource): boolean {
  return collectTypes(source).includes(RESIDENTIAL_LAND_TYPE);
}

/** Коммерческая «Земля» или жилой «Участок» */
export function isAnyLand(source: PropertyTypesSource): boolean {
  const types = collectTypes(source);
  return (
    types.includes(LAND_PROPERTY_TYPE) || types.includes(RESIDENTIAL_LAND_TYPE)
  );
}

/**
 * В фильтрах каталога «Участок» и «Земля» считаем одним пулом:
 * коммерческая земля видна в жилом разделе участков и наоборот.
 */
export function expandLandFilterTypes(selectedTypes: string[]): string[] {
  const set = new Set(selectedTypes.map((t) => t.trim()).filter(Boolean));
  if (set.has(LAND_PROPERTY_TYPE) || set.has(RESIDENTIAL_LAND_TYPE)) {
    set.add(LAND_PROPERTY_TYPE);
    set.add(RESIDENTIAL_LAND_TYPE);
  }
  return [...set];
}

export function isFlatLike(source: PropertyTypesSource): boolean {
  return hasAny(collectTypes(source), FLAT_LIKE_TYPES);
}

export function isHouseLike(source: PropertyTypesSource): boolean {
  return hasAny(collectTypes(source), HOUSE_LIKE_TYPES);
}

export function isParkingLike(source: PropertyTypesSource): boolean {
  return hasAny(collectTypes(source), PARKING_LIKE_TYPES);
}

/** Квартира/дом — поля комнат, этажей и т.п. */
export function isDwellingLike(source: PropertyTypesSource): boolean {
  return isFlatLike(source) || isHouseLike(source);
}
