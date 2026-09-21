import {
  type CatalogCategory,
  type CatalogCategoryId,
  type CatalogDealSlug,
  type CatalogDealValue,
  CATALOG_CATEGORIES,
  DEAL_PATHS,
  DEAL_SLUG_BY_VALUE,
  defaultCategoryForDeal,
  getCategoryBySlug,
  getNestedCategoryBySlug,
  getSubtype,
  inferCategoryFromLegacy,
  isCatalogDealSlug,
  isDealAllowedForCategory,
  resolveCategoryTypes,
} from "@/config/catalogTaxonomy";
import type { PropertySegment } from "@/config/propertySegments";
import {
  type CatalogLinkParams,
  type CatalogUrlFilters,
  normalizeCatalogDeal,
  parseCatalogTypes,
  readCatalogFiltersFromSearchParams,
  serializeCatalogSearchParams,
} from "@/lib/catalogLinks";

export type ParsedCatalogPath = {
  dealSlug: CatalogDealSlug;
  dealValue: CatalogDealValue;
  category: CatalogCategory;
  categoryId: CatalogCategoryId;
  subtypeSlug: string | null;
  segment: PropertySegment;
  types: string[];
  marketPreset: string | null;
};

export type BuildCatalogPathParams = {
  deal: CatalogDealSlug | CatalogDealValue | "rent" | "sale" | "daily";
  category?: CatalogCategoryId | string;
  subtype?: string | null;
  filters?: Partial<CatalogUrlFilters> & {
    rooms?: string | string[];
    market?: string | string[];
    buildingType?: string | string[];
    furniture?: string | string[];
    landUse?: string | string[];
    district?: string;
    q?: string;
    seller?: string;
    agency?: string;
    cls?: string;
    cond?: string;
    sort?: string;
    priceMin?: number;
    priceMax?: number;
    areaMin?: number;
    areaMax?: number;
    ceil?: number;
    parking?: boolean;
    selectedRooms?: string[];
    selectedMarket?: string[];
    selectedBuildingTypes?: string[];
    selectedFurniture?: string[];
    selectedLandUses?: string[];
    searchQuery?: string;
    propertyClass?: string;
    condition?: string;
    parkingOnly?: boolean;
    agencyId?: string;
    ceilingMin?: number;
  };
};

function toDealSlug(
  deal: BuildCatalogPathParams["deal"],
): CatalogDealSlug {
  if (typeof deal === "string" && isCatalogDealSlug(deal)) return deal;
  const normalized = normalizeCatalogDeal(String(deal));
  if (normalized === "Продажа") return "kupit";
  if (normalized === "Посуточно") return "posutochno";
  return "snyat";
}

function csv(value: string | string[] | undefined): string[] {
  if (!value) return [];
  return (Array.isArray(value) ? value : [value])
    .map((v) => String(v).trim())
    .filter(Boolean);
}

export function buildCatalogPath(params: BuildCatalogPathParams): string {
  const dealSlug = toDealSlug(params.deal);
  let category =
    typeof params.category === "string"
      ? getCategoryBySlug(params.category) ||
        CATALOG_CATEGORIES.find((c) => c.id === params.category)
      : undefined;

  if (!category || !isDealAllowedForCategory(dealSlug, category)) {
    category = defaultCategoryForDeal(dealSlug);
  }

  // Вложенные категории (novostroyki, vtorichka) не имеют обычных subtypes
  const parentSlug = category.parentCategorySlug;
  const subtype = !parentSlug && params.subtype && getSubtype(category, params.subtype)
    ? params.subtype
    : null;

  const base = parentSlug
    ? `/${dealSlug}/${parentSlug}/${category.slug}`
    : subtype
      ? `/${dealSlug}/${category.slug}/${subtype}`
      : `/${dealSlug}/${category.slug}`;

  const f = params.filters || {};
  const soft: CatalogUrlFilters = {
    dealType: "Все",
    selectedTypes: [],
    selectedRooms: csv(f.rooms ?? f.selectedRooms),
    selectedMarket: category.marketPreset
      ? []
      : csv(f.market ?? f.selectedMarket),
    selectedBuildingTypes: csv(f.buildingType ?? f.selectedBuildingTypes),
    selectedFurniture: csv(f.furniture ?? f.selectedFurniture),
    district: f.district || "Все",
    propertyClass: f.cls || f.propertyClass || "Все",
    condition: f.cond || f.condition || "Все",
    sort: f.sort || "default",
    searchQuery: f.q || f.searchQuery || "",
    priceMin: f.priceMin ?? 0,
    priceMax: f.priceMax ?? 50_000_000,
    areaMin: f.areaMin ?? 0,
    areaMax: f.areaMax ?? 300_000,
    ceilingMin: f.ceil ?? f.ceilingMin ?? 0,
    parkingOnly: f.parking ?? f.parkingOnly ?? false,
    selectedLayouts: [],
    selectedLandUses: csv(f.landUse ?? f.selectedLandUses),
    seller: (f.seller as CatalogUrlFilters["seller"]) || "Все",
    agencyId: f.agency || f.agencyId || "",
  };

  const query = serializeCatalogSearchParams({
    ...soft,
    dealType: "Все",
    selectedTypes: [],
  });

  return query ? `${base}?${query}` : base;
}

export function buildCatalogUrl(params: CatalogLinkParams = {}): string {
  const dealNorm = normalizeCatalogDeal(params.deal);
  const dealValue =
    dealNorm === "Продажа" || dealNorm === "Аренда" || dealNorm === "Посуточно"
      ? dealNorm
      : "Аренда";

  const types = params.types
    ? (Array.isArray(params.types) ? params.types : [params.types]).map((v) =>
        String(v).trim(),
      )
    : [];
  const market = params.market
    ? (Array.isArray(params.market) ? params.market : [params.market]).map(
        (v) => String(v).trim(),
      )
    : [];

  const inferred = inferCategoryFromLegacy({
    segment: params.segment,
    types,
    market,
    deal: dealValue,
  });

  const dealSlug =
    dealNorm === "Продажа"
      ? DEAL_SLUG_BY_VALUE.Продажа
      : dealNorm === "Посуточно"
        ? DEAL_SLUG_BY_VALUE.Посуточно
        : DEAL_SLUG_BY_VALUE.Аренда;

  return buildCatalogPath({
    deal: dealSlug,
    category: inferred.category.id,
    subtype: inferred.subtypeSlug,
    filters: {
      rooms: params.rooms,
      market: inferred.category.marketPreset ? undefined : params.market,
      buildingType: params.buildingType,
      furniture: params.furniture,
      landUse: params.landUse,
      district: params.district,
      q: params.q,
      seller: params.seller,
      agency: params.agency,
    },
  });
}

export function parseCatalogPath(pathname: string): ParsedCatalogPath | null {
  const parts = pathname.replace(/\/+$/, "").split("/").filter(Boolean);
  if (parts.length < 2) return null;

  const [dealPart, categoryPart, thirdPart] = parts;
  if (!dealPart || !categoryPart || !isCatalogDealSlug(dealPart)) return null;

  const topCategory = getCategoryBySlug(categoryPart);
  if (!topCategory) return null;
  if (!isDealAllowedForCategory(dealPart, topCategory)) return null;

  if (thirdPart) {
    // Сначала проверяем вложенную категорию (novostroyki/vtorichka под kvartiry)
    const nestedCat = getNestedCategoryBySlug(categoryPart, thirdPart);
    if (nestedCat) {
      if (!isDealAllowedForCategory(dealPart, nestedCat)) return null;
      return {
        dealSlug: dealPart,
        dealValue: DEAL_PATHS[dealPart].value,
        category: nestedCat,
        categoryId: nestedCat.id,
        subtypeSlug: null,
        segment: nestedCat.segment,
        types: resolveCategoryTypes(nestedCat, dealPart, null),
        marketPreset: nestedCat.marketPreset ?? null,
      };
    }
    // Затем проверяем subtype (kottedzhi/taunhausy под doma, ofisy под kommercheskaya)
    const subtypeObj = getSubtype(topCategory, thirdPart);
    if (!subtypeObj) return null;
    // Проверяем allowedDeals subtype
    if (subtypeObj.allowedDeals && !subtypeObj.allowedDeals.includes(dealPart)) return null;
    return {
      dealSlug: dealPart,
      dealValue: DEAL_PATHS[dealPart].value,
      category: topCategory,
      categoryId: topCategory.id,
      subtypeSlug: thirdPart,
      segment: topCategory.segment,
      types: resolveCategoryTypes(topCategory, dealPart, thirdPart),
      marketPreset: subtypeObj.marketPreset ?? topCategory.marketPreset ?? null,
    };
  }

  return {
    dealSlug: dealPart,
    dealValue: DEAL_PATHS[dealPart].value,
    category: topCategory,
    categoryId: topCategory.id,
    subtypeSlug: null,
    segment: topCategory.segment,
    types: resolveCategoryTypes(topCategory, dealPart, null),
    marketPreset: topCategory.marketPreset ?? null,
  };
}

export function isCatalogPathname(pathname: string): boolean {
  return parseCatalogPath(pathname) != null;
}

export const PATH_OWNED_QUERY_KEYS = ["deal", "types", "type"] as const;

function stripPathOwned(filters: CatalogUrlFilters): CatalogUrlFilters {
  return { ...filters, dealType: "Все", selectedTypes: [] };
}

export function legacyCatalogRedirect(
  pathname: string,
  search: string | URLSearchParams = "",
): string | null {
  const path = pathname.replace(/\/+$/, "") || "/";
  const params =
    typeof search === "string"
      ? new URLSearchParams(search.startsWith("?") ? search.slice(1) : search)
      : new URLSearchParams(search);

  const filters = readCatalogFiltersFromSearchParams(params);
  const dealNormalized = normalizeCatalogDeal(params.get("deal"));
  const dealValue =
    dealNormalized === "Продажа" ||
    dealNormalized === "Аренда" ||
    dealNormalized === "Посуточно"
      ? dealNormalized
      : null;

  // Старые URL вложенных категорий → новые пути с родителем
  if (path === "/kupit/novostroyki") {
    return "/kupit/kvartiry/novostroyki";
  }
  if (path === "/kupit/vtorichka") {
    return "/kupit/kvartiry/vtorichka";
  }

  if (path === "/offices") {
    return buildCatalogPath({
      deal: dealValue || "Аренда",
      category: "kommercheskaya",
      subtype: "ofisy",
      filters: stripPathOwned(filters),
    });
  }
  if (path === "/retail") {
    return buildCatalogPath({
      deal: dealValue || "Аренда",
      category: "kommercheskaya",
      subtype: "torgovaya",
      filters: stripPathOwned(filters),
    });
  }
  if (path === "/warehouses") {
    return buildCatalogPath({
      deal: dealValue || "Аренда",
      category: "kommercheskaya",
      subtype: "sklady",
      filters: stripPathOwned(filters),
    });
  }
  if (path === "/land") {
    return buildCatalogPath({
      deal: dealValue || "Аренда",
      category: "zemlya",
      filters: stripPathOwned(filters),
    });
  }

  let segment: PropertySegment | undefined;
  let forcedTypes = parseCatalogTypes(params);
  let isLegacyCatalog = false;

  if (path === "/catalog") {
    segment = "commercial";
    isLegacyCatalog = true;
  } else if (path === "/zhilaya/catalog") {
    segment = "residential";
    isLegacyCatalog = true;
  } else if (path === "/zhilaya/kvartiry") {
    segment = "residential";
    forcedTypes = forcedTypes.length ? forcedTypes : ["Квартира"];
    isLegacyCatalog = true;
  } else if (path === "/zhilaya/doma") {
    segment = "residential";
    forcedTypes = forcedTypes.length
      ? forcedTypes
      : ["Дом", "Коттедж", "Дача", "Таунхаус"];
    isLegacyCatalog = true;
  } else if (path === "/zhilaya/komnaty") {
    segment = "residential";
    forcedTypes = forcedTypes.length ? forcedTypes : ["Комната"];
    isLegacyCatalog = true;
  } else if (path === "/zhilaya/uchastki") {
    segment = "land";
    forcedTypes = forcedTypes.length ? forcedTypes : ["Участок"];
    isLegacyCatalog = true;
  } else if (path === "/zemlya/catalog") {
    segment = "land";
    isLegacyCatalog = true;
  }

  if (!isLegacyCatalog) return null;

  const inferred = inferCategoryFromLegacy({
    segment,
    types: forcedTypes,
    market: filters.selectedMarket,
    deal: dealValue || "Аренда",
  });

  let dealSlug: CatalogDealSlug =
    dealValue === "Продажа"
      ? "kupit"
      : dealValue === "Посуточно"
        ? "posutochno"
        : "snyat";

  if (!isDealAllowedForCategory(dealSlug, inferred.category)) {
    dealSlug = inferred.category.allowedDeals[0]!;
  }

  return buildCatalogPath({
    deal: dealSlug,
    category: inferred.category.id,
    subtype: inferred.subtypeSlug,
    filters: {
      ...stripPathOwned(filters),
      selectedMarket: inferred.category.marketPreset
        ? []
        : filters.selectedMarket,
    },
  });
}

export function serializeSoftCatalogSearchParams(
  filters: CatalogUrlFilters,
  options?: { omitMarket?: boolean },
): string {
  return serializeCatalogSearchParams({
    ...filters,
    dealType: "Все",
    selectedTypes: [],
    selectedMarket: options?.omitMarket ? [] : filters.selectedMarket,
  });
}

export function dealSlugFromValue(
  value: string | null | undefined,
): CatalogDealSlug {
  const n = normalizeCatalogDeal(value);
  if (n === "Продажа") return DEAL_SLUG_BY_VALUE.Продажа;
  if (n === "Посуточно") return DEAL_SLUG_BY_VALUE.Посуточно;
  return DEAL_SLUG_BY_VALUE.Аренда;
}

export const footerSectionLinks = [
  { label: "Офисы", href: "/snyat/kommercheskaya/ofisy" },
  { label: "Торговые площади", href: "/snyat/kommercheskaya/torgovaya" },
  { label: "Склады", href: "/snyat/kommercheskaya/sklady" },
  { label: "Земельные участки", href: "/snyat/zemlya" },
  { label: "Производство", href: "/snyat/kommercheskaya/proizvodstvo" },
];

export const footerCityLinks = [
  { label: "Иркутск", href: "/snyat/kommercheskaya?q=%D0%98%D1%80%D0%BA%D1%83%D1%82%D1%81%D0%BA" },
  { label: "Ангарск", href: "/snyat/kommercheskaya?district=%D0%90%D0%BD%D0%B3%D0%B0%D1%80%D1%81%D0%BA" },
  { label: "Шелехов", href: "/snyat/kommercheskaya?district=%D0%A8%D0%B5%D0%BB%D0%B5%D1%85%D0%BE%D0%B2" },
  {
    label: "Усолье-Сибирское",
    href: "/snyat/kommercheskaya?district=%D0%A3%D1%81%D0%BE%D0%BB%D1%8C%D0%B5-%D0%A1%D0%B8%D0%B1%D0%B8%D1%80%D1%81%D0%BA%D0%BE%D0%B5",
  },
  { label: "Братск", href: "/snyat/kommercheskaya?district=%D0%91%D1%80%D0%B0%D1%82%D1%81%D0%BA" },
];

export const footerResidentialLinks = [
  { label: "Каталог жилья", href: "/snyat/kvartiry" },
  { label: "Квартиры", href: "/snyat/kvartiry" },
  { label: "Дома", href: "/snyat/doma" },
  { label: "Комнаты", href: "/snyat/komnaty" },
  { label: "Таунхаусы", href: "/kupit/doma/taunhausy" },
  { label: "Апартаменты", href: "/snyat/kvartiry" },
  { label: "Участки", href: "/snyat/zemlya" },
  { label: "Новостройки", href: "/kupit/kvartiry/novostroyki" },
  { label: "Дом на заказ", href: "/kupit/doma/na-zakaz" },
];
