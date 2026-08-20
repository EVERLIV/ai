import { SEGMENT_ROUTES, type PropertySegment } from "@/config/propertySegments";

type CatalogLinkParams = {
  segment?: PropertySegment;
  types?: string | string[];
  rooms?: string | string[];
  market?: string | string[];
  buildingType?: string | string[];
  furniture?: string | string[];
  district?: string;
  deal?: "Аренда" | "Продажа" | "Посуточно" | "rent" | "sale" | "Все";
  q?: string;
};

export function normalizeCatalogDeal(value: string | null | undefined): string {
  if (!value) return "Все";
  const lower = value.trim().toLowerCase();
  if (lower === "rent" || lower === "аренда") return "Аренда";
  if (lower === "sale" || lower === "продажа") return "Продажа";
  if (lower === "daily" || lower === "посуточно") return "Посуточно";
  return value;
}

export function parseCatalogTypes(searchParams: URLSearchParams): string[] {
  const types = searchParams.get("types");
  if (types) return types.split(",").map((value) => value.trim()).filter(Boolean);
  const type = searchParams.get("type");
  return type ? [type.trim()].filter(Boolean) : [];
}

export function buildCatalogUrl(params: CatalogLinkParams = {}): string {
  const search = new URLSearchParams();
  const basePath = params.segment === "residential"
    ? SEGMENT_ROUTES.residential.catalog
    : SEGMENT_ROUTES.commercial.catalog;

  if (params.types) {
    const types = (Array.isArray(params.types) ? params.types : [params.types])
      .map((value) => value.trim())
      .filter(Boolean);
    if (types.length > 0) search.set("types", types.join(","));
  }

  if (params.rooms) {
    const rooms = (Array.isArray(params.rooms) ? params.rooms : [params.rooms])
      .map((value) => value.trim())
      .filter(Boolean);
    if (rooms.length > 0) search.set("rooms", rooms.join(","));
  }

  if (params.market) {
    const market = (Array.isArray(params.market) ? params.market : [params.market])
      .map((value) => value.trim())
      .filter(Boolean);
    if (market.length > 0) search.set("market", market.join(","));
  }

  if (params.buildingType) {
    const buildingType = (Array.isArray(params.buildingType) ? params.buildingType : [params.buildingType])
      .map((value) => value.trim())
      .filter(Boolean);
    if (buildingType.length > 0) search.set("bld", buildingType.join(","));
  }

  if (params.furniture) {
    const furniture = (Array.isArray(params.furniture) ? params.furniture : [params.furniture])
      .map((value) => value.trim())
      .filter(Boolean);
    if (furniture.length > 0) search.set("furniture", furniture.join(","));
  }

  if (params.district?.trim()) search.set("district", params.district.trim());

  const deal = normalizeCatalogDeal(params.deal);
  if (deal !== "Все") search.set("deal", deal);

  if (params.q?.trim()) search.set("q", params.q.trim());

  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}

export const footerSectionLinks = [
  { label: "Офисы", href: buildCatalogUrl({ types: "Офис" }) },
  { label: "Торговые площади", href: buildCatalogUrl({ types: "Торговая" }) },
  { label: "Склады", href: buildCatalogUrl({ types: "Склад" }) },
  { label: "Земельные участки", href: buildCatalogUrl({ types: "Земля" }) },
  { label: "Производство", href: buildCatalogUrl({ types: "Производство" }) },
];

export const footerCityLinks = [
  { label: "Иркутск", href: buildCatalogUrl({ q: "Иркутск" }) },
  { label: "Ангарск", href: buildCatalogUrl({ district: "Ангарск" }) },
  { label: "Шелехов", href: buildCatalogUrl({ district: "Шелехов" }) },
  { label: "Усолье-Сибирское", href: buildCatalogUrl({ district: "Усолье-Сибирское" }) },
  { label: "Братск", href: buildCatalogUrl({ district: "Братск" }) },
];

export const footerResidentialLinks = [
  { label: "Каталог жилья", href: buildCatalogUrl({ segment: "residential" }) },
  { label: "Квартиры", href: buildCatalogUrl({ segment: "residential", types: "Квартира" }) },
  { label: "Дома", href: buildCatalogUrl({ segment: "residential", types: "Дом" }) },
  { label: "Комнаты", href: buildCatalogUrl({ segment: "residential", types: "Комната" }) },
  { label: "Таунхаусы", href: buildCatalogUrl({ segment: "residential", types: "Таунхаус" }) },
  { label: "Апартаменты", href: buildCatalogUrl({ segment: "residential", types: "Апартаменты" }) },
  { label: "Участки", href: buildCatalogUrl({ segment: "residential", types: "Участок" }) },
  { label: "Новостройки", href: buildCatalogUrl({ segment: "residential", market: "Новостройка" }) },
];

function parseCsvParam(searchParams: URLSearchParams, key: string): string[] {
  return (searchParams.get(key) || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function parseCatalogRooms(searchParams: URLSearchParams): string[] {
  return parseCsvParam(searchParams, "rooms");
}

export function readCatalogFiltersFromSearchParams(searchParams: URLSearchParams) {
  return {
    dealType: normalizeCatalogDeal(searchParams.get("deal")),
    selectedTypes: parseCatalogTypes(searchParams),
    selectedRooms: parseCatalogRooms(searchParams),
    selectedMarket: parseCsvParam(searchParams, "market"),
    selectedBuildingTypes: parseCsvParam(searchParams, "bld"),
    selectedFurniture: parseCsvParam(searchParams, "furniture"),
    district: searchParams.get("district") || "Все",
    propertyClass: searchParams.get("cls") || "Все",
    condition: searchParams.get("cond") || "Все",
    sort: searchParams.get("sort") || "date",
    searchQuery: searchParams.get("q") || "",
    priceMin: Number(searchParams.get("priceMin") || 0),
    priceMax: Number(searchParams.get("priceMax") || 50000000),
    areaMin: Number(searchParams.get("areaMin") || 0),
    areaMax: Number(searchParams.get("areaMax") || 300000),
    ceilingMin: Number(searchParams.get("ceil") || 0),
    parkingOnly: searchParams.get("parking") === "1",
    selectedLayouts: parseCsvParam(searchParams, "layouts"),
  };
}
