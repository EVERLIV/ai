import type { PropertySegment } from "@/config/propertySegments";
import {
  type ListingSellerFilter,
  normalizeListingSeller,
} from "@/lib/listingSource";

export type CatalogLinkParams = {
  segment?: PropertySegment;
  types?: string | string[];
  rooms?: string | string[];
  market?: string | string[];
  buildingType?: string | string[];
  furniture?: string | string[];
  landUse?: string | string[];
  district?: string;
  deal?: "Аренда" | "Продажа" | "Посуточно" | "rent" | "sale" | "Все";
  q?: string;
  seller?: ListingSellerFilter | "owner" | "agency" | "developer";
  agency?: string;
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
  if (types)
    return types
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);
  const type = searchParams.get("type");
  return type ? [type.trim()].filter(Boolean) : [];
}

function parseCsvParam(searchParams: URLSearchParams, key: string): string[] {
  return (searchParams.get(key) || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}

function parseCatalogRooms(searchParams: URLSearchParams): string[] {
  return parseCsvParam(searchParams, "rooms");
}

export function readCatalogFiltersFromSearchParams(
  searchParams: URLSearchParams,
) {
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
    sort: searchParams.get("sort") || "default",
    searchQuery: searchParams.get("q") || "",
    priceMin: Number(searchParams.get("priceMin") || 0),
    priceMax: Number(searchParams.get("priceMax") || 50000000),
    areaMin: Number(searchParams.get("areaMin") || 0),
    areaMax: Number(searchParams.get("areaMax") || 300000),
    ceilingMin: Number(searchParams.get("ceil") || 0),
    parkingOnly: searchParams.get("parking") === "1",
    selectedLayouts: parseCsvParam(searchParams, "layouts"),
    selectedLandUses: parseCsvParam(searchParams, "land_use"),
    seller: normalizeListingSeller(searchParams.get("seller")),
    agencyId: searchParams.get("agency") || "",
    trustedSeller: searchParams.get("trusted") === "1",
    dealTransaction: parseCsvParam(searchParams, "tx"),
    withPhoto: searchParams.get("photo") === "1",
  };
}

export type CatalogUrlFilters = ReturnType<
  typeof readCatalogFiltersFromSearchParams
>;

const PRICE_MAX_URL = 50_000_000;
const AREA_MAX_URL = 300_000;

/** Стабильная строка query для сравнения, без лишнего setSearchParams. */
export function serializeCatalogSearchParams(
  filters: CatalogUrlFilters,
): string {
  const p = new URLSearchParams();
  if (filters.dealType !== "Все") p.set("deal", filters.dealType);
  if (filters.selectedTypes.length > 0) {
    p.set("types", filters.selectedTypes.join(","));
  }
  if (filters.district !== "Все") p.set("district", filters.district);
  if (filters.propertyClass !== "Все") p.set("cls", filters.propertyClass);
  if (filters.condition !== "Все") p.set("cond", filters.condition);
  if (filters.sort && filters.sort !== "default") p.set("sort", filters.sort);
  if (filters.searchQuery.trim()) p.set("q", filters.searchQuery.trim());
  if (filters.priceMin > 0) p.set("priceMin", String(filters.priceMin));
  if (filters.priceMax < PRICE_MAX_URL) {
    p.set("priceMax", String(filters.priceMax));
  }
  if (filters.areaMin > 0) p.set("areaMin", String(filters.areaMin));
  if (filters.areaMax < AREA_MAX_URL) {
    p.set("areaMax", String(filters.areaMax));
  }
  if (filters.ceilingMin > 0) p.set("ceil", String(filters.ceilingMin));
  if (filters.parkingOnly) p.set("parking", "1");
  if (filters.selectedLayouts.length > 0) {
    p.set("layouts", filters.selectedLayouts.join(","));
  }
  if (filters.selectedLandUses.length > 0) {
    p.set("land_use", filters.selectedLandUses.join(","));
  }
  if (filters.selectedRooms.length > 0) {
    p.set("rooms", filters.selectedRooms.join(","));
  }
  if (filters.selectedMarket.length > 0) {
    p.set("market", filters.selectedMarket.join(","));
  }
  if (filters.selectedBuildingTypes.length > 0) {
    p.set("bld", filters.selectedBuildingTypes.join(","));
  }
  if (filters.selectedFurniture.length > 0) {
    p.set("furniture", filters.selectedFurniture.join(","));
  }
  if (filters.seller !== "Все") p.set("seller", String(filters.seller));
  if (filters.agencyId) p.set("agency", filters.agencyId);
  if (filters.trustedSeller) p.set("trusted", "1");
  if ((filters.dealTransaction ?? []).length > 0) {
    p.set("tx", filters.dealTransaction!.join(","));
  }
  if (filters.withPhoto) p.set("photo", "1");
  return p.toString();
}
