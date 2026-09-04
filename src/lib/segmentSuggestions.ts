import type { PropertySegment } from "@/config/propertySegments";
import { SEGMENT_ROUTES } from "@/config/propertySegments";
import { buildCatalogUrl } from "@/lib/catalogLinks";
import { commercialTypeMenuLabel } from "@/lib/catalogMegaMenu";

export type SuggestionIconKey =
  | "apartment"
  | "house"
  | "room"
  | "newbuild"
  | "daily"
  | "garage"
  | "office"
  | "retail"
  | "warehouse"
  | "pavilion"
  | "production"
  | "land"
  | "psn"
  | "food"
  | "auto"
  | "all";

/** Патч фильтров каталога при клике по плитке */
export type SuggestionFilterPatch = {
  types?: string[];
  deal?: string;
  market?: string[];
  /** commercial SearchFilters.type */
  homeType?: string;
};

export type SegmentSuggestion = {
  id: string;
  label: string;
  href: string;
  icon: SuggestionIconKey;
  filter?: SuggestionFilterPatch;
};

function r(params: Parameters<typeof buildCatalogUrl>[0]) {
  return buildCatalogUrl({ segment: "residential", ...params });
}

function c(params: Parameters<typeof buildCatalogUrl>[0]) {
  return buildCatalogUrl({ segment: "commercial", ...params });
}

const COMMERCIAL_ICON: Record<string, SuggestionIconKey> = {
  Офис: "office",
  Торговая: "retail",
  Склад: "warehouse",
  Павильон: "pavilion",
  Производство: "production",
  ПСН: "psn",
  Общепит: "food",
  Автосервис: "auto",
};

const DEFAULT_COMMERCIAL_TYPES = [
  "Офис",
  "Торговая",
  "Склад",
  "Производство",
  "Павильон",
  "ПСН",
  "Общепит",
  "Автосервис",
];

export function getResidentialSuggestions(): SegmentSuggestion[] {
  return [
    {
      id: "newbuilds",
      label: "Новостройки",
      href: r({ market: "Новостройка" }),
      icon: "newbuild",
      filter: { types: ["Квартира"], market: ["Новостройка"], deal: "Все" },
    },
    {
      id: "buy-apt",
      label: "Купить квартиру",
      href: r({ types: "Квартира", deal: "Продажа" }),
      icon: "apartment",
      filter: { types: ["Квартира"], deal: "Продажа", market: [] },
    },
    {
      id: "rent-apt",
      label: "Снять квартиру",
      href: r({ types: "Квартира", deal: "Аренда" }),
      icon: "apartment",
      filter: { types: ["Квартира"], deal: "Аренда", market: [] },
    },
    {
      id: "daily",
      label: "Жильё посуточно",
      href: r({ deal: "Посуточно" }),
      icon: "daily",
      filter: { types: [], deal: "Посуточно", market: [] },
    },
    {
      id: "buy-house",
      label: "Купить дом",
      href: r({ types: ["Дом", "Коттедж", "Дача"], deal: "Продажа" }),
      icon: "house",
      filter: {
        types: ["Дом", "Коттедж", "Дача"],
        deal: "Продажа",
        market: [],
      },
    },
    {
      id: "rooms",
      label: "Комнаты",
      href: r({ types: "Комната", deal: "Аренда" }),
      icon: "room",
      filter: { types: ["Комната"], deal: "Аренда", market: [] },
    },
    {
      id: "garage",
      label: "Гаражи",
      href: r({ types: ["Гараж", "Машиноместо"] }),
      icon: "garage",
      filter: { types: ["Гараж", "Машиноместо"], deal: "Все", market: [] },
    },
    {
      id: "plots",
      label: "Участки",
      href: buildCatalogUrl({ segment: "land" }),
      icon: "land",
    },
    {
      id: "all",
      label: "Весь каталог",
      href: SEGMENT_ROUTES.residential.catalog,
      icon: "all",
      filter: { types: [], deal: "Все", market: [] },
    },
  ];
}

export function getCommercialSuggestions(
  types: string[] = DEFAULT_COMMERCIAL_TYPES,
): SegmentSuggestion[] {
  const list = (types.length ? types : DEFAULT_COMMERCIAL_TYPES).filter(
    (t) => t !== "Земля" && t !== "Участок",
  );

  return [
    {
      id: "all",
      label: "Все объекты",
      href: SEGMENT_ROUTES.commercial.catalog,
      icon: "all",
      filter: { types: [], deal: "Все", homeType: "Все" },
    },
    ...list.map((type) => ({
      id: `c-${type}`,
      label: commercialTypeMenuLabel(type),
      href: c({ types: type }),
      icon: COMMERCIAL_ICON[type] || ("office" as SuggestionIconKey),
      filter: { types: [type], deal: "Все", homeType: type },
    })),
  ];
}

export function getSegmentSuggestions(
  segment: PropertySegment,
  commercialTypes?: string[],
): SegmentSuggestion[] {
  if (segment === "residential") return getResidentialSuggestions();
  if (segment === "commercial")
    return getCommercialSuggestions(commercialTypes);
  return [];
}

export function suggestionIsActive(
  item: SegmentSuggestion,
  state: { types: string[]; deal: string; market: string[] },
): boolean {
  const f = item.filter;
  if (!f) return false;
  const typesOk =
    (f.types?.length ?? 0) === 0
      ? state.types.length === 0
      : f.types!.length === state.types.length &&
        f.types!.every((t) => state.types.includes(t));
  const dealOk = !f.deal || f.deal === state.deal;
  const marketOk =
    f.market === undefined
      ? true
      : f.market.length === 0
        ? state.market.length === 0
        : f.market.length === state.market.length &&
          f.market.every((m) => state.market.includes(m));
  return typesOk && dealOk && marketOk;
}
