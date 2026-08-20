import { LAND_PROPERTY_TYPE } from "@/lib/propertyLand";
import {
  COMMERCIAL_PROPERTY_TYPES,
  RESIDENTIAL_PROPERTY_TYPES,
  type PropertySegment,
} from "@/config/propertySegments";

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
    return fromExtras.filter((t): t is string => typeof t === "string" && t.trim().length > 0);
  }
  if (property.type?.trim()) return [property.type.trim()];
  return [];
}

export function normalizePropertyTypes(types: string[]): string[] {
  const unique = [...new Set(types.map((t) => t.trim()).filter(Boolean))];
  if (unique.includes(LAND_PROPERTY_TYPE)) return [LAND_PROPERTY_TYPE];
  return unique;
}

export function togglePropertyType(current: string[], type: string, checked: boolean): string[] {
  if (type === LAND_PROPERTY_TYPE) {
    return checked ? [LAND_PROPERTY_TYPE] : [];
  }
  const withoutLand = current.filter((t) => t !== LAND_PROPERTY_TYPE);
  if (checked) return normalizePropertyTypes([...withoutLand, type]);
  return withoutLand.filter((t) => t !== type);
}

export function formatPropertyTypesLabel(types: string[]): string {
  return types.join(", ");
}

export function getPropertySegment(property: PropertyLike): PropertySegment {
  if (property.segment === "residential" || property.type === "Новостройка") return "residential";
  return "commercial";
}

export function getPrimaryPropertyType(property: PropertyLike): string {
  return getPropertyTypes(property)[0] || property.type?.trim() || "";
}

export function propertyMatchesTypes(property: PropertyLike, selectedTypes: string[]): boolean {
  if (selectedTypes.length === 0) return true;
  const types = getPropertyTypes(property);
  return selectedTypes.some((t) => types.includes(t));
}

export function propertyMatchesSegment(property: PropertyLike, segment: PropertySegment): boolean {
  return getPropertySegment(property) === segment;
}

export function getSegmentPropertyTypes(segment: PropertySegment): readonly string[] {
  return segment === "residential" ? RESIDENTIAL_PROPERTY_TYPES : COMMERCIAL_PROPERTY_TYPES;
}

export function syncPropertyTypesPayload(
  types: string[],
  extras: Record<string, unknown> | undefined,
  segment: PropertySegment = "commercial",
): { type: string; extras: Record<string, unknown> } {
  const normalized = normalizePropertyTypes(types);
  const primaryType = normalized[0] || (segment === "residential" ? "Квартира" : "Офис");
  return {
    type: primaryType,
    extras: {
      ...(extras || {}),
      segment,
      [PROPERTY_TYPES_EXTRA_KEY]: normalized,
    },
  };
}
