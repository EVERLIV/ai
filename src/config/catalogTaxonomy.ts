import type { PropertySegment } from "@/config/propertySegments";
import {
  COMMERCIAL_PROPERTY_TYPES,
  LAND_PROPERTY_TYPES,
} from "@/config/propertySegments";

/** Path slug → значение сделки в каталоге */
export type CatalogDealSlug = "kupit" | "snyat" | "posutochno";

export type CatalogDealValue = "Продажа" | "Аренда" | "Посуточно";

export type CatalogCategoryId =
  | "kvartiry"
  | "novostroyki"
  | "vtorichka"
  | "komnaty"
  | "doma"
  | "garazhi"
  | "zemlya"
  | "kommercheskaya";

export type CatalogFilterBlock =
  | "location"
  | "objectTypes"
  | "rooms"
  | "market"
  | "buildingType"
  | "buildingTypeCommercial"
  | "furniture"
  | "landUse"
  | "propertyClass"
  | "condition"
  | "ceilingParking"
  | "price"
  | "area"
  | "sellers"
  | "trustedSeller"
  | "dealTransaction"
  | "layouts"
  | "withPhoto"
  | "query"
  | "sort";

export type CatalogSubtype = {
  slug: string;
  label: string;
  types: readonly string[];
  /** Если задан — market фиксируется и не показывается в фильтрах */
  marketPreset?: string;
  /** Если задан — subtype доступен только для этих сделок */
  allowedDeals?: readonly CatalogDealSlug[];
};

export type CatalogCategory = {
  id: CatalogCategoryId;
  slug: string;
  label: string;
  segment: PropertySegment;
  /** Базовые типы объектов категории (без subtype) */
  types: readonly string[];
  allowedDeals: readonly CatalogDealSlug[];
  /** Рынок зафиксирован path’ом (новостройки / вторичка) */
  marketPreset?: string;
  /**
   * Слаг родительской категории в URL.
   * Если задан, URL категории: /{deal}/{parentCategorySlug}/{slug}
   * Пример: novostroyki.parentCategorySlug = "kvartiry" → /kupit/kvartiry/novostroyki
   */
  parentCategorySlug?: string;
  subtypes?: readonly CatalogSubtype[];
  /** Доп. типы только для определённой сделки */
  typesForDeal?: Partial<Record<CatalogDealSlug, readonly string[]>>;
};

export const DEAL_PATHS: Record<
  CatalogDealSlug,
  { value: CatalogDealValue; label: string }
> = {
  kupit: { value: "Продажа", label: "Купить" },
  snyat: { value: "Аренда", label: "Снять" },
  posutochno: { value: "Посуточно", label: "Посуточно" },
} as const;

export const DEAL_SLUG_BY_VALUE: Record<CatalogDealValue, CatalogDealSlug> = {
  Продажа: "kupit",
  Аренда: "snyat",
  Посуточно: "posutochno",
};

const APARTMENT_TYPES = ["Квартира", "Апартаменты"] as const;
const HOUSE_TYPES_BASE = ["Дом", "Коттедж", "Дача", "Таунхаус"] as const;
const HOUSE_TYPES_BUY = [
  "Дом",
  "Коттедж",
  "Дача",
  "Таунхаус",
  "Дом на заказ",
] as const;
const GARAGE_TYPES = ["Гараж", "Машиноместо"] as const;

export const COMMERCIAL_SUBTYPES: readonly CatalogSubtype[] = [
  { slug: "ofisy", label: "Офисы", types: ["Офис"] },
  { slug: "torgovaya", label: "Торговая", types: ["Торговая"] },
  { slug: "sklady", label: "Склады", types: ["Склад"] },
  { slug: "proizvodstvo", label: "Производство", types: ["Производство"] },
  { slug: "pomescheniya", label: "Помещения", types: ["Помещение"] },
  { slug: "pavilony", label: "Павильоны", types: ["Павильон"] },
  { slug: "kioski", label: "Киоски", types: ["Киоск"] },
  { slug: "psn", label: "ПСН", types: ["ПСН"] },
  { slug: "obschepit", label: "Общепит", types: ["Общепит"] },
  { slug: "avtoservis", label: "Автосервис", types: ["Автосервис"] },
] as const;

export const DOMA_SUBTYPES: readonly CatalogSubtype[] = [
  { slug: "kottedzhi", label: "Коттеджи", types: ["Коттедж"] },
  { slug: "taunhausy", label: "Таунхаусы", types: ["Таунхаус"] },
  { slug: "dachi", label: "Дачи", types: ["Дача"] },
  {
    slug: "na-zakaz",
    label: "На заказ",
    types: ["Дом", "Коттедж", "Дача", "Таунхаус", "Дом на заказ"],
    marketPreset: "На заказ",
    allowedDeals: ["kupit"],
  },
] as const;

export const CATALOG_CATEGORIES: readonly CatalogCategory[] = [
  {
    id: "kvartiry",
    slug: "kvartiry",
    label: "Квартиры",
    segment: "residential",
    types: APARTMENT_TYPES,
    allowedDeals: ["kupit", "snyat", "posutochno"],
  },
  {
    id: "novostroyki",
    slug: "novostroyki",
    label: "Новостройки",
    segment: "residential",
    types: APARTMENT_TYPES,
    allowedDeals: ["kupit"],
    marketPreset: "Новостройка",
    parentCategorySlug: "kvartiry",
  },
  {
    id: "vtorichka",
    slug: "vtorichka",
    label: "Вторичка",
    segment: "residential",
    types: APARTMENT_TYPES,
    allowedDeals: ["kupit"],
    marketPreset: "Вторичка",
    parentCategorySlug: "kvartiry",
  },
  {
    id: "komnaty",
    slug: "komnaty",
    label: "Комнаты",
    segment: "residential",
    types: ["Комната"],
    allowedDeals: ["kupit", "snyat", "posutochno"],
  },
  {
    id: "doma",
    slug: "doma",
    label: "Дома",
    segment: "residential",
    types: HOUSE_TYPES_BASE,
    allowedDeals: ["kupit", "snyat", "posutochno"],
    typesForDeal: {
      kupit: HOUSE_TYPES_BUY,
      snyat: HOUSE_TYPES_BASE,
      posutochno: HOUSE_TYPES_BASE,
    },
    subtypes: DOMA_SUBTYPES,
  },
  {
    id: "garazhi",
    slug: "garazhi",
    label: "Гаражи",
    segment: "residential",
    types: GARAGE_TYPES,
    allowedDeals: ["kupit", "snyat"],
  },
  {
    id: "zemlya",
    slug: "zemlya",
    label: "Земля",
    segment: "land",
    types: LAND_PROPERTY_TYPES,
    allowedDeals: ["kupit", "snyat"],
  },
  {
    id: "kommercheskaya",
    slug: "kommercheskaya",
    label: "Коммерческая",
    segment: "commercial",
    types: COMMERCIAL_PROPERTY_TYPES,
    allowedDeals: ["kupit", "snyat"],
    subtypes: COMMERCIAL_SUBTYPES,
  },
] as const;

/** Какие блоки фильтров показывать для категории */
export const FILTER_SCHEMA_BY_CATEGORY: Record<
  CatalogCategoryId,
  readonly CatalogFilterBlock[]
> = {
  kvartiry: [
    "trustedSeller",
    "location",
    "rooms",
    "layouts",
    "market",
    "buildingType",
    "furniture",
    "price",
    "area",
    "sellers",
    "condition",
    "withPhoto",
    "query",
    "sort",
  ],
  novostroyki: [
    "trustedSeller",
    "location",
    "rooms",
    "layouts",
    "dealTransaction",
    "buildingType",
    "furniture",
    "price",
    "area",
    "sellers",
    "condition",
    "withPhoto",
    "query",
    "sort",
  ],
  vtorichka: [
    "trustedSeller",
    "location",
    "rooms",
    "layouts",
    "dealTransaction",
    "buildingType",
    "furniture",
    "price",
    "area",
    "sellers",
    "condition",
    "withPhoto",
    "query",
    "sort",
  ],
  komnaty: [
    "trustedSeller",
    "location",
    "furniture",
    "price",
    "area",
    "sellers",
    "withPhoto",
    "query",
    "sort",
  ],
  doma: [
    "trustedSeller",
    "location",
    "market",
    "price",
    "area",
    "sellers",
    "withPhoto",
    "query",
    "sort",
  ],
  garazhi: [
    "trustedSeller",
    "location",
    "price",
    "area",
    "sellers",
    "withPhoto",
    "query",
    "sort",
  ],
  zemlya: [
    "trustedSeller",
    "location",
    "landUse",
    "price",
    "area",
    "sellers",
    "withPhoto",
    "query",
    "sort",
  ],
  kommercheskaya: [
    "trustedSeller",
    "location",
    "objectTypes",
    "buildingTypeCommercial",
    "propertyClass",
    "condition",
    "ceilingParking",
    "price",
    "area",
    "sellers",
    "withPhoto",
    "query",
    "sort",
  ],
};

export const CATALOG_DEAL_SLUGS = Object.keys(DEAL_PATHS) as CatalogDealSlug[];

export function isCatalogDealSlug(value: string): value is CatalogDealSlug {
  return value in DEAL_PATHS;
}

/** Возвращает только top-level категории (без parentCategorySlug). */
export function getCategoryBySlug(
  slug: string | null | undefined,
): CatalogCategory | undefined {
  if (!slug) return undefined;
  return CATALOG_CATEGORIES.find((c) => c.slug === slug && !c.parentCategorySlug);
}

/** Возвращает вложенную категорию по слагу родителя и собственному слагу. */
export function getNestedCategoryBySlug(
  parentSlug: string,
  slug: string,
): CatalogCategory | undefined {
  return CATALOG_CATEGORIES.find(
    (c) => c.slug === slug && c.parentCategorySlug === parentSlug,
  );
}

export function getCategoryById(
  id: CatalogCategoryId | null | undefined,
): CatalogCategory | undefined {
  if (!id) return undefined;
  return CATALOG_CATEGORIES.find((c) => c.id === id);
}

/** Возвращает только top-level категории для данной сделки (без вложенных subcategories). */
export function categoriesForDeal(
  deal: CatalogDealSlug,
): CatalogCategory[] {
  return CATALOG_CATEGORIES.filter(
    (c) => c.allowedDeals.includes(deal) && !c.parentCategorySlug,
  );
}

export function isDealAllowedForCategory(
  deal: CatalogDealSlug,
  category: CatalogCategory,
): boolean {
  return category.allowedDeals.includes(deal);
}

export function getSubtype(
  category: CatalogCategory,
  subtypeSlug: string | null | undefined,
): CatalogSubtype | undefined {
  if (!subtypeSlug || !category.subtypes) return undefined;
  return category.subtypes.find((s) => s.slug === subtypeSlug);
}

export function resolveCategoryTypes(
  category: CatalogCategory,
  deal: CatalogDealSlug,
  subtypeSlug?: string | null,
): string[] {
  const subtype = getSubtype(category, subtypeSlug);
  if (subtype) return [...subtype.types];
  const forDeal = category.typesForDeal?.[deal];
  if (forDeal) return [...forDeal];
  return [...category.types];
}

export function filterSchemaHas(
  categoryId: CatalogCategoryId,
  block: CatalogFilterBlock,
): boolean {
  return FILTER_SCHEMA_BY_CATEGORY[categoryId].includes(block);
}

/** Подобрать категорию по сегменту + types + market (для legacy URL). */
export function inferCategoryFromLegacy(input: {
  segment?: PropertySegment;
  types?: string[];
  market?: string[];
  deal?: CatalogDealValue | string;
}): { category: CatalogCategory; subtypeSlug?: string } {
  const types = input.types || [];
  const market = input.market || [];
  const dealSlug =
    input.deal === "Продажа" || input.deal === "sale"
      ? "kupit"
      : input.deal === "Посуточно" || input.deal === "daily"
        ? "posutochno"
        : "snyat";

  if (market.includes("Новостройка") && dealSlug === "kupit") {
    return { category: getCategoryById("novostroyki")! };
  }
  if (market.includes("Вторичка") && types.length === 0 && dealSlug === "kupit") {
    return { category: getCategoryById("vtorichka")! };
  }

  if (input.segment === "land" || types.some((t) => (LAND_PROPERTY_TYPES as readonly string[]).includes(t))) {
    return { category: getCategoryById("zemlya")! };
  }

  if (
    input.segment === "commercial" ||
    types.some((t) => (COMMERCIAL_PROPERTY_TYPES as readonly string[]).includes(t))
  ) {
    const cat = getCategoryById("kommercheskaya")!;
    if (types.length === 1) {
      const sub = cat.subtypes?.find((s) => s.types.includes(types[0]!));
      if (sub) return { category: cat, subtypeSlug: sub.slug };
    }
    return { category: cat };
  }

  if (types.includes("Комната")) {
    return { category: getCategoryById("komnaty")! };
  }
  if (types.some((t) => (GARAGE_TYPES as readonly string[]).includes(t))) {
    return { category: getCategoryById("garazhi")! };
  }
  if (
    types.some((t) =>
      ([...HOUSE_TYPES_BUY] as string[]).includes(t),
    )
  ) {
    return { category: getCategoryById("doma")! };
  }
  if (types.some((t) => (APARTMENT_TYPES as readonly string[]).includes(t))) {
    if (market.includes("Вторичка")) {
      return { category: getCategoryById("vtorichka")! };
    }
    return { category: getCategoryById("kvartiry")! };
  }

  // Defaults by segment / deal
  if (input.segment === "residential") {
    return { category: getCategoryById("kvartiry")! };
  }
  if (input.segment === "land") {
    return { category: getCategoryById("zemlya")! };
  }
  if (dealSlug === "posutochno") {
    return { category: getCategoryById("kvartiry")! };
  }
  return { category: getCategoryById("kommercheskaya")! };
}

export function defaultCategoryForDeal(
  deal: CatalogDealSlug,
): CatalogCategory {
  const list = categoriesForDeal(deal).filter((c) => !c.parentCategorySlug);
  return list.find((c) => c.id === "kvartiry") ?? list[0]!;
}
