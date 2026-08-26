/** Комплектации и зоны для серий деревянных / модульных домов (не ЖК). */

export const HOUSE_PACKAGE_IDS = [
  "warm_shell",
  "standard",
  "turnkey",
] as const;

export type HousePackageId = (typeof HOUSE_PACKAGE_IDS)[number];

export const HOUSE_PACKAGE_LABELS: Record<HousePackageId, string> = {
  warm_shell: "Тёплый контур",
  standard: "Стандарт",
  turnkey: "Под ключ",
};

/** Категории работ/опций в сравнении комплектаций (как у производителей модульных домов) */
export const HOUSE_PACKAGE_FEATURE_CATEGORIES = [
  {
    id: "site",
    title: "Участок и фундамент",
    items: [
      { id: "site_leveling", label: "Планировка участка" },
      { id: "foundation", label: "Фундамент (сваи / УШП / лента)" },
      { id: "insulation_base", label: "Утепление цоколя / плиты" },
    ],
  },
  {
    id: "shell",
    title: "Коробка и контур",
    items: [
      { id: "frame", label: "Несущий каркас / стены" },
      { id: "insulation_walls", label: "Утепление стен" },
      { id: "windows", label: "Окна энергосберегающие" },
      { id: "roof", label: "Кровля" },
      { id: "facade", label: "Фасад / обшивка" },
      { id: "entrance_door", label: "Входная дверь" },
    ],
  },
  {
    id: "eng",
    title: "Инженерия",
    items: [
      { id: "electrics", label: "Электрика (кабель, щит, точки)" },
      { id: "plumbing", label: "Разводка ХВС/ГВС" },
      { id: "heating", label: "Отопление / тёплый пол" },
      { id: "septic", label: "Септик / канализация (опция)" },
      { id: "well", label: "Скважина (опция)" },
    ],
  },
  {
    id: "finish",
    title: "Отделка",
    items: [
      { id: "flooring", label: "Напольные покрытия" },
      { id: "ceilings", label: "Потолки" },
      { id: "walls_finish", label: "Отделка стен" },
      { id: "bathrooms", label: "Санузлы «под ключ»" },
      { id: "interior_doors", label: "Межкомнатные двери" },
      { id: "lighting", label: "Светильники" },
    ],
  },
] as const;

export type HousePackageFeatureId =
  (typeof HOUSE_PACKAGE_FEATURE_CATEGORIES)[number]["items"][number]["id"];

/** Что входит по умолчанию в каждую комплектацию */
export const DEFAULT_HOUSE_PACKAGE_INCLUDES: Record<
  HousePackageId,
  HousePackageFeatureId[]
> = {
  warm_shell: [
    "site_leveling",
    "foundation",
    "insulation_base",
    "frame",
    "insulation_walls",
    "windows",
    "roof",
    "facade",
    "entrance_door",
  ],
  standard: [
    "site_leveling",
    "foundation",
    "insulation_base",
    "frame",
    "insulation_walls",
    "windows",
    "roof",
    "facade",
    "entrance_door",
    "electrics",
    "plumbing",
    "heating",
  ],
  turnkey: [
    "site_leveling",
    "foundation",
    "insulation_base",
    "frame",
    "insulation_walls",
    "windows",
    "roof",
    "facade",
    "entrance_door",
    "electrics",
    "plumbing",
    "heating",
    "flooring",
    "ceilings",
    "walls_finish",
    "bathrooms",
    "interior_doors",
    "lighting",
  ],
};

export type HouseZoneCounts = {
  bedrooms: number;
  kitchens: number;
  bathrooms: number;
  living: number;
  terrace: boolean;
  garage: boolean;
};

export type HouseFinishPackage = {
  id: HousePackageId | string;
  name: string;
  price_from: number | null;
  /** id опций из HOUSE_PACKAGE_FEATURE_CATEGORIES */
  includes: string[];
};

export type HouseUnitExtras = {
  zones?: Partial<HouseZoneCounts>;
  packages?: HouseFinishPackage[];
};

export function isHouseSeriesProject(kind: string | null | undefined): boolean {
  return kind === "house_series";
}

export function parseHouseUnitExtras(
  extras?: Record<string, unknown> | null,
): HouseUnitExtras {
  if (!extras || typeof extras !== "object") return {};
  const zonesRaw = extras.zones;
  const packagesRaw = extras.packages;
  const zones: Partial<HouseZoneCounts> = {};
  if (zonesRaw && typeof zonesRaw === "object" && !Array.isArray(zonesRaw)) {
    const z = zonesRaw as Record<string, unknown>;
    if (typeof z.bedrooms === "number") zones.bedrooms = z.bedrooms;
    if (typeof z.kitchens === "number") zones.kitchens = z.kitchens;
    if (typeof z.bathrooms === "number") zones.bathrooms = z.bathrooms;
    if (typeof z.living === "number") zones.living = z.living;
    if (typeof z.terrace === "boolean") zones.terrace = z.terrace;
    if (typeof z.garage === "boolean") zones.garage = z.garage;
  }
  const packages: HouseFinishPackage[] = [];
  if (Array.isArray(packagesRaw)) {
    for (const p of packagesRaw) {
      if (!p || typeof p !== "object") continue;
      const o = p as Record<string, unknown>;
      const name = typeof o.name === "string" ? o.name.trim() : "";
      if (!name) continue;
      packages.push({
        id: typeof o.id === "string" ? o.id : name,
        name,
        price_from:
          typeof o.price_from === "number" && Number.isFinite(o.price_from)
            ? o.price_from
            : null,
        includes: Array.isArray(o.includes)
          ? o.includes.filter((x): x is string => typeof x === "string")
          : [],
      });
    }
  }
  return { zones, packages };
}

export function formatHouseZones(zones?: Partial<HouseZoneCounts> | null): string {
  if (!zones) return "";
  const parts: string[] = [];
  if (zones.bedrooms) parts.push(`${zones.bedrooms} спальн.`);
  if (zones.kitchens) parts.push(`${zones.kitchens} кухн.`);
  if (zones.living) parts.push(`${zones.living} гостиная`);
  if (zones.bathrooms) parts.push(`${zones.bathrooms} с/у`);
  if (zones.terrace) parts.push("терраса");
  if (zones.garage) parts.push("гараж");
  return parts.join(" · ");
}

export function buildDefaultPackages(prices: {
  warm_shell?: number | null;
  standard?: number | null;
  turnkey?: number | null;
}): HouseFinishPackage[] {
  return HOUSE_PACKAGE_IDS.map((id) => ({
    id,
    name: HOUSE_PACKAGE_LABELS[id],
    price_from: prices[id] ?? null,
    includes: [...DEFAULT_HOUSE_PACKAGE_INCLUDES[id]],
  }));
}

/** Дополнить WOOD_FINISH опциями комплектаций серий */
export const HOUSE_SERIES_FINISH_OPTIONS = [
  "Тёплый контур",
  "Стандарт",
  "Под ключ",
] as const;
