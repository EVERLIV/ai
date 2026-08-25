import {
  COMMERCIAL_PROPERTY_TYPES,
  LAND_PROPERTY_TYPES,
  type PropertySegment,
  RESIDENTIAL_PROPERTY_TYPES,
} from "@/config/propertySegments";
import {
  expandLandFilterTypes,
  isAnyLand,
  LAND_PROPERTY_TYPE,
  RESIDENTIAL_LAND_TYPE,
} from "@/lib/propertyTypeFamilies";

export const PROPERTY_TYPES_EXTRA_KEY = "property_types";

type PropertyLike = {
  segment?: PropertySegment | null;
  type?: string | null;
  extras?: Record<string, unknown> | null;
};

export function getPropertyTypes(property: PropertyLike): string[] {
  const extras = property.extras;
  const fromExtras = extras?.[PROPERTY_TYPES_EXTRA_KEY];
  if (Array.isArray(fromExtras) && fromExtras.length > 0) {
    return fromExtras.filter(
      (t): t is string => typeof t === "string" && t.trim().length > 0,
    );
  }
  if (property.type?.trim()) return [property.type.trim()];
  return [];
}

const EXCLUSIVE_LAND_TYPES = new Set([
  LAND_PROPERTY_TYPE,
  RESIDENTIAL_LAND_TYPE,
]);

export function normalizePropertyTypes(types: string[]): string[] {
  const unique = [...new Set(types.map((t) => t.trim()).filter(Boolean))];
  const land = unique.find((t) => EXCLUSIVE_LAND_TYPES.has(t));
  if (land) return [land];
  return unique;
}

export function togglePropertyType(
  current: string[],
  type: string,
  checked: boolean,
): string[] {
  if (EXCLUSIVE_LAND_TYPES.has(type)) {
    return checked ? [type] : [];
  }
  const withoutLand = current.filter((t) => !EXCLUSIVE_LAND_TYPES.has(t));
  if (checked) return normalizePropertyTypes([...withoutLand, type]);
  return withoutLand.filter((t) => t !== type);
}

export function formatPropertyTypesLabel(types: string[]): string {
  return types.join(", ");
}

export function getPropertySegment(property: PropertyLike): PropertySegment {
  if (property.segment === "land" || isAnyLand(property)) return "land";
  if (property.segment === "residential" || property.type === "Новостройка") {
    return "residential";
  }
  return "commercial";
}

export function getPrimaryPropertyType(property: PropertyLike): string {
  return getPropertyTypes(property)[0] || property.type?.trim() || "";
}

export function propertyMatchesTypes(
  property: PropertyLike,
  selectedTypes: string[],
): boolean {
  if (selectedTypes.length === 0) return true;
  const wanted = expandLandFilterTypes(selectedTypes);
  const types = getPropertyTypes(property);
  return wanted.some((t) => types.includes(t));
}

export function propertyMatchesSegment(
  property: PropertyLike,
  segment: PropertySegment,
): boolean {
  return getPropertySegment(property) === segment;
}

export function getSegmentPropertyTypes(
  segment: PropertySegment,
): readonly string[] {
  if (segment === "residential") return RESIDENTIAL_PROPERTY_TYPES;
  if (segment === "land") return LAND_PROPERTY_TYPES;
  return COMMERCIAL_PROPERTY_TYPES;
}

export function syncPropertyTypesPayload(
  types: string[],
  extras: Record<string, unknown> | undefined,
  segment: PropertySegment = "commercial",
): { type: string; extras: Record<string, unknown> } {
  const normalized = normalizePropertyTypes(types);
  const primaryType =
    normalized[0] ||
    (segment === "residential"
      ? "Квартира"
      : segment === "land"
        ? "Земля"
        : "Офис");
  return {
    type: primaryType,
    extras: {
      ...(extras || {}),
      segment,
      [PROPERTY_TYPES_EXTRA_KEY]: normalized,
    },
  };
}
