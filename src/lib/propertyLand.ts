export const LAND_PROPERTY_TYPE = "Земля";

export const LAND_USE_OPTIONS = [
  "Склад",
  "Торговля",
  "Производство",
  "Автосервис",
  "Офис",
  "Сельхоз",
  "Жилая застройка",
  "Смешанное",
  "Другое",
] as const;

export type PropertyExtrasLike = {
  cadastral_number?: string;
  land_use?: string;
  [key: string]: unknown;
};

export function isLandProperty(type: string | null | undefined): boolean {
  return type === LAND_PROPERTY_TYPE;
}

export function getLandCadastral(extras: PropertyExtrasLike | null | undefined): string | null {
  const value = extras?.cadastral_number?.trim();
  return value || null;
}

/** Назначение участка: extras.land_use, с fallback на старые поля layout/condition */
export function getLandUse(property: {
  type?: string | null;
  layout?: string | null;
  condition?: string | null;
  extras?: PropertyExtrasLike | null;
}): string | null {
  if (!isLandProperty(property.type)) return null;

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
