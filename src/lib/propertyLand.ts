export const LAND_PROPERTY_TYPE = "Земля";

export const LAND_TYPE_LABEL = "Тип";

export const LAND_USE_OPTIONS = [
  "ИЖС",
  "Жилая",
  "Коммерческая",
  "Гаражи",
  "Сельскохозяйственная",
] as const;

export type PropertyExtrasLike = {
  cadastral_number?: string;
  land_use?: string;
  [key: string]: unknown;
};

export function isLandProperty(
  typeOrProperty: string | { type?: string | null; extras?: PropertyExtrasLike | null } | null | undefined,
): boolean {
  if (!typeOrProperty) return false;
  if (typeof typeOrProperty === "string") return typeOrProperty === LAND_PROPERTY_TYPE;

  const extras = typeOrProperty.extras;
  const fromExtras = extras?.property_types;
  if (Array.isArray(fromExtras) && fromExtras.includes(LAND_PROPERTY_TYPE)) return true;
  return typeOrProperty.type === LAND_PROPERTY_TYPE;
}

export function getLandCadastral(extras: PropertyExtrasLike | null | undefined): string | null {
  const value = extras?.cadastral_number?.trim();
  return value || null;
}

/** Тип земельного участка: extras.land_use, с fallback на старые поля layout/condition */
export function getLandUse(property: {
  type?: string | null;
  layout?: string | null;
  condition?: string | null;
  extras?: PropertyExtrasLike | null;
}): string | null {
  if (!isLandProperty(property)) return null;

  const extras = property.extras as PropertyExtrasLike | null;
  if (extras?.land_use?.trim()) return extras.land_use.trim();

  const layout = property.layout?.trim();
  if (layout && layout !== "-") return layout;

  const condition = property.condition?.trim();
  if (condition && condition !== "-" && condition !== "Новое") return condition;

  return null;
}

export const LAND_BUILDING_FIELD_DEFAULTS = {
  floor: "-",
  total_floors: 0,
  ceiling_height: 0,
  parking: "-",
  condition: "",
  layout: "",
} as const;
