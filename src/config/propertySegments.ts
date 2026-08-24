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

export const RESIDENTIAL_MARKET_TYPES = ["Вторичка", "Новостройка"] as const;

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

/** Быстрые ссылки для ориентации на главной / в меню */
export const SEGMENT_QUICK_LINKS = {
  commercial: {
    title: "Коммерческая",
    subtitle: "Помещения для бизнеса: аренда и продажа",
    href: SEGMENT_ROUTES.commercial.catalog,
    categories: [
      {
        label: "Офисы",
        desc: "Кабинеты и open space для работы",
        href: "/offices",
      },
      {
        label: "Торговая",
        desc: "Магазины, павильоны, стрит-ритейл",
        href: "/retail",
      },
      {
        label: "Склады",
        desc: "Складские и производственные площади",
        href: "/warehouses",
      },
      { label: "Земля", desc: "Участки под бизнес и застройку", href: "/land" },
      {
        label: "Производство",
        desc: "Цехи и промышленные базы",
        href: "/catalog?types=%D0%9F%D1%80%D0%BE%D0%B8%D0%B7%D0%B2%D0%BE%D0%B4%D1%81%D1%82%D0%B2%D0%BE",
      },
    ],
  },
  residential: {
    title: "Жилая",
    subtitle: "Квартиры, дома и комнаты в одном каталоге",
    href: SEGMENT_ROUTES.residential.home,
    categories: [
      {
        label: "Квартиры",
        desc: "Студии, 1–4 комнаты, новостройки",
        href: "/zhilaya/kvartiry",
      },
      {
        label: "Дома",
        desc: "Дома, коттеджи и таунхаусы",
        href: "/zhilaya/doma",
      },
      {
        label: "Комнаты",
        desc: "Комнаты в квартирах и общежитиях",
        href: "/zhilaya/komnaty",
      },
      {
        label: "Участки",
        desc: "Жилые участки и коммерческая земля",
        href: "/zhilaya/uchastki",
      },
      {
        label: "Весь каталог жилья",
        desc: "Также апартаменты, дачи, гаражи",
        href: SEGMENT_ROUTES.residential.catalog,
      },
    ],
  },
} as const;

/** @deprecated используйте SEGMENT_QUICK_LINKS */
export const SEGMENT_CHOOSER = SEGMENT_QUICK_LINKS;

export function segmentHomePath(segment: PropertySegment): string {
  return SEGMENT_ROUTES[segment].home;
}

export function isResidentialSegment(
  segment: string | null | undefined,
): segment is "residential" {
  return segment === "residential";
}

export function isCommercialSegment(
  segment: string | null | undefined,
): segment is "commercial" {
  return !segment || segment === "commercial";
}
