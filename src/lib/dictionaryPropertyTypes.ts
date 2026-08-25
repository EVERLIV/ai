import {
  COMMERCIAL_PROPERTY_TYPES,
  LAND_PROPERTY_TYPES,
  type PropertySegment,
  RESIDENTIAL_PROPERTY_TYPES,
} from "@/config/propertySegments";

export type DictionaryPropertyTypeItem = {
  category: string;
  value: string;
  parent: string | null;
  sort_order?: number;
  is_active?: boolean;
};

export function dictionaryParentForSegment(
  parent: string | null | undefined,
): PropertySegment {
  const key = (parent || "").trim().toLowerCase();
  if (key === "residential") return "residential";
  if (key === "land" || key === "земля") return "land";
  return "commercial";
}

/** @deprecated use dictionaryParentForSegment */
export function isResidentialPropertyTypeParent(
  parent: string | null | undefined,
): boolean {
  return dictionaryParentForSegment(parent) === "residential";
}

export function propertyTypesForSegment(
  items: DictionaryPropertyTypeItem[],
  segment: PropertySegment,
): string[] {
  const fromDict = items
    .filter((i) => i.category === "property_type")
    .filter((i) => i.is_active !== false)
    .filter((i) => dictionaryParentForSegment(i.parent) === segment)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((i) => i.value)
    .filter(Boolean);

  if (fromDict.length > 0) return [...new Set(fromDict)];

  if (segment === "residential") return [...RESIDENTIAL_PROPERTY_TYPES];
  if (segment === "land") return [...LAND_PROPERTY_TYPES];
  return [...COMMERCIAL_PROPERTY_TYPES];
}
