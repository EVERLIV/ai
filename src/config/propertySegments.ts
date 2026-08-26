export type PropertySegment = "commercial" | "residential" | "land";

export const COMMERCIAL_PROPERTY_TYPES = [
  "Офис",
  "Торговая",
  "Склад",
  "Производство",
  "Павильон",
  "ПСН",
  "Общепит",
  "Автосервис",
] as const;

export const RESIDENTIAL_PROPERTY_TYPES = [
  "Квартира",
  "Дом",
  "Дом на заказ",
  "Комната",
  "Таунхаус",
  "Апартаменты",
  "Дача",
  "Коттедж",
  "Гараж",
  "Машиноместо",
  "Доля",
] as const;

export const LAND_PROPERTY_TYPES = ["Земля", "Участок"] as const;

export const LAND_DEAL_TYPES = ["Аренда", "Продажа"] as const;

export const RESIDENTIAL_MARKET_TYPES = [
  "Вторичка",
  "Новостройка",
  "На заказ",
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
  land: {
    home: "/zemlya",
    catalog: "/zemlya/catalog",
    listProperty: "/zemlya/list-property",
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
        desc: "Магазины и стрит-ритейл",
        href: "/retail",
      },
      {
        label: "Павильоны",
        desc: "Торговые павильоны и киоски",
        href: "/catalog?types=%D0%9F%D0%B0%D0%B2%D0%B8%D0%BB%D1%8C%D0%BE%D0%BD",
      },
      {
        label: "Склады",
        desc: "Складские площади",
        href: "/warehouses",
      },
      {
        label: "Производство",
        desc: "Цехи и промышленные базы",
        href: "/catalog?types=%D0%9F%D1%80%D0%BE%D0%B8%D0%B7%D0%B2%D0%BE%D0%B4%D1%81%D1%82%D0%B2%D0%BE",
      },
      {
        label: "ПСН",
        desc: "Помещения свободного назначения",
        href: "/catalog?types=%D0%9F%D0%A1%D0%9D",
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
        label: "Дом на заказ",
        desc: "Индивидуальная сборка — дома ещё нет, строят под вас",
        href: "/zhilaya/catalog?types=%D0%94%D0%BE%D0%BC%2C%D0%9A%D0%BE%D1%82%D1%82%D0%B5%D0%B4%D0%B6%2C%D0%94%D0%B0%D1%87%D0%B0&market=%D0%9D%D0%B0+%D0%B7%D0%B0%D0%BA%D0%B0%D0%B7&deal=%D0%9F%D1%80%D0%BE%D0%B4%D0%B0%D0%B6%D0%B0",
      },
      {
        label: "Комнаты",
        desc: "Комнаты в квартирах и общежитиях",
        href: "/zhilaya/komnaty",
      },
      {
        label: "Весь каталог жилья",
        desc: "Также апартаменты, дачи, гаражи",
        href: SEGMENT_ROUTES.residential.catalog,
      },
    ],
  },
  land: {
    title: "Земля",
    subtitle: "Участки: ИЖС, жилая и коммерческая земля",
    href: SEGMENT_ROUTES.land.catalog,
    categories: [
      {
        label: "Весь каталог",
        desc: "Земля и участки в одном разделе",
        href: SEGMENT_ROUTES.land.catalog,
      },
      {
        label: "ИЖС",
        desc: "Участки под индивидуальное строительство",
        href: `${SEGMENT_ROUTES.land.catalog}?land_use=${encodeURIComponent("ИЖС")}`,
      },
      {
        label: "Жилая",
        desc: "Земля под жилую застройку",
        href: `${SEGMENT_ROUTES.land.catalog}?land_use=${encodeURIComponent("Жилая")}`,
      },
      {
        label: "Коммерческая",
        desc: "Участки под бизнес и застройку",
        href: `${SEGMENT_ROUTES.land.catalog}?land_use=${encodeURIComponent("Коммерческая")}`,
      },
      {
        label: "Разместить участок",
        desc: "Бесплатно для собственников и риелторов",
        href: SEGMENT_ROUTES.land.listProperty,
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

export function isLandSegment(
  segment: string | null | undefined,
): segment is "land" {
  return segment === "land";
}

export function isCommercialSegment(
  segment: string | null | undefined,
): segment is "commercial" {
  return !segment || segment === "commercial";
}

export function parsePropertySegment(
  value: string | null | undefined,
): PropertySegment {
  if (value === "residential" || value === "land") return value;
  return "commercial";
}

export function defaultTypeForSegment(segment: PropertySegment): string {
  if (segment === "residential") return "Квартира";
  if (segment === "land") return "Земля";
  return "Офис";
}
