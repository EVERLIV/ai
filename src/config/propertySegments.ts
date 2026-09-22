export type PropertySegment = "commercial" | "residential" | "land";

export const COMMERCIAL_PROPERTY_TYPES = [
  "Офис",
  "Торговая",
  "Склад",
  "Производство",
  "Помещение",
  "Павильон",
  "Киоск",
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
    catalog: "/snyat/kommercheskaya",
    listProperty: "/list-property",
  },
  residential: {
    home: "/zhilaya",
    catalog: "/snyat/kvartiry",
    listProperty: "/zhilaya/list-property",
  },
  land: {
    home: "/zemlya",
    catalog: "/snyat/zemlya",
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
        href: "/snyat/kommercheskaya/ofisy",
      },
      {
        label: "Торговая",
        desc: "Магазины и стрит-ритейл",
        href: "/snyat/kommercheskaya/torgovaya",
      },
      {
        label: "Павильоны",
        desc: "Торговые павильоны и киоски",
        href: "/snyat/kommercheskaya/pavilony",
      },
      {
        label: "Склады",
        desc: "Складские площади",
        href: "/snyat/kommercheskaya/sklady",
      },
      {
        label: "Производство",
        desc: "Цехи и промышленные базы",
        href: "/snyat/kommercheskaya/proizvodstvo",
      },
      {
        label: "ПСН",
        desc: "Помещения свободного назначения",
        href: "/snyat/kommercheskaya/psn",
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
        href: "/snyat/kvartiry",
      },
      {
        label: "Дома",
        desc: "Дома, коттеджи и таунхаусы",
        href: "/snyat/doma",
      },
      {
        label: "Дом на заказ",
        desc: "Индивидуальная сборка — дома ещё нет, строят под вас",
        href: "/kupit/doma?market=%D0%9D%D0%B0+%D0%B7%D0%B0%D0%BA%D0%B0%D0%B7",
      },
      {
        label: "Комнаты",
        desc: "Комнаты в квартирах и общежитиях",
        href: "/snyat/komnaty",
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
