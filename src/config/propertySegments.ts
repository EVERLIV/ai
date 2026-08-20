export type PropertySegment = "commercial" | "residential";

export const COMMERCIAL_PROPERTY_TYPES = [
  "Офис",
  "Торговая",
  "Склад",
  "Земля",
  "Производство",
] as const;

export const RESIDENTIAL_PROPERTY_TYPES = [
  "Квартира",
  "Дом",
  "Комната",
  "Таунхаус",
  "Апартаменты",
  "Дача",
  "Коттедж",
  "Участок",
  "Гараж",
  "Машиноместо",
  "Доля",
] as const;

export const RESIDENTIAL_MARKET_TYPES = [
  "Вторичка",
  "Новостройка",
] as const;

export const RESIDENTIAL_DEAL_TYPES = [
  "Аренда",
  "Продажа",
  "Посуточно",
] as const;

export const SEGMENT_ROUTES = {
  commercial: {
    home: "/",
    catalog: "/catalog",
    listProperty: "/list-property",
  },
  residential: {
    home: "/zhilaya",
    catalog: "/zhilaya/catalog",
    listProperty: "/zhilaya/list-property",
  },
} as const;

export function isResidentialSegment(segment: string | null | undefined): segment is "residential" {
  return segment === "residential";
}

export function isCommercialSegment(segment: string | null | undefined): segment is "commercial" {
  return !segment || segment === "commercial";
}
