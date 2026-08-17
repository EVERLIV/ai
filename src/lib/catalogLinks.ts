type CatalogLinkParams = {
  types?: string | string[];
  district?: string;
  deal?: "Аренда" | "Продажа" | "rent" | "sale" | "Все";
  q?: string;
};

export function normalizeCatalogDeal(value: string | null | undefined): string {
  if (!value) return "Все";
  const lower = value.trim().toLowerCase();
  if (lower === "rent" || lower === "аренда") return "Аренда";
  if (lower === "sale" || lower === "продажа") return "Продажа";
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

  if (params.types) {
    const types = (Array.isArray(params.types) ? params.types : [params.types])
      .map((value) => value.trim())
      .filter(Boolean);
    if (types.length > 0) search.set("types", types.join(","));
  }

  if (params.district?.trim()) search.set("district", params.district.trim());

  const deal = normalizeCatalogDeal(params.deal);
  if (deal !== "Все") search.set("deal", deal);

  if (params.q?.trim()) search.set("q", params.q.trim());

  const query = search.toString();
  return query ? `/catalog?${query}` : "/catalog";
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

export function readCatalogFiltersFromSearchParams(searchParams: URLSearchParams) {
  return {
    dealType: normalizeCatalogDeal(searchParams.get("deal")),
    selectedTypes: parseCatalogTypes(searchParams),
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
    selectedLayouts: (searchParams.get("layouts") || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  };
}
