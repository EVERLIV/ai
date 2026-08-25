import type { DbProperty } from "@/hooks/useProperties";
import {
  formatPropertyAddressShort,
  formatPropertyPrice,
} from "@/lib/propertyCard";
import { getLandUse, isAnyLand } from "@/lib/propertyLand";
import {
  getResidentialRooms,
  RESIDENTIAL_EXTRAS_KEYS,
} from "@/lib/propertyResidential";
import { getPrimaryPropertyType } from "@/lib/propertyTypes";

export type ComparePropertyInput = {
  id: string;
  type: string;
  deal_type: string;
  segment?: DbProperty["segment"] | null;
  extras?: unknown;
};

/** Json extras → plain object for helper libs */
function withExtras<T extends { extras?: unknown }>(
  p: T,
): T & { extras: Record<string, unknown> } {
  const extras =
    p.extras && typeof p.extras === "object" && !Array.isArray(p.extras)
      ? (p.extras as Record<string, unknown>)
      : {};
  return { ...p, extras };
}

function extrasOf(p: { extras?: unknown }): Record<string, unknown> {
  return withExtras(p).extras;
}

function extraStr(p: { extras?: unknown }, key: string): string {
  const v = extrasOf(p)[key];
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (typeof v === "string" && v.trim()) return v.trim();
  if (typeof v === "boolean") return v ? "Да" : "Нет";
  return "";
}

export const COMPARE_STORAGE_KEY = "compare_properties";
export const COMPARE_CHANGED_EVENT = "compare-properties-changed";
export const COMPARE_MAX = 4;

export type CompareStoredState = {
  categoryKey: string;
  categoryLabel: string;
  ids: string[];
};

export function getCompareCategoryKey(p: ComparePropertyInput): string {
  const typed = withExtras(p);
  const type = getPrimaryPropertyType(typed) || p.type?.trim() || "Объект";
  const deal = (p.deal_type || "").trim() || "Сделка";
  return `${type}|${deal}`;
}

export function getCompareCategoryLabel(p: ComparePropertyInput): string {
  const typed = withExtras(p);
  const type = getPrimaryPropertyType(typed) || p.type?.trim() || "Объект";
  const deal = (p.deal_type || "").trim();
  return deal ? `${type} · ${deal}` : type;
}

export function emptyCompareState(): CompareStoredState {
  return { categoryKey: "", categoryLabel: "", ids: [] };
}

export function readCompareState(): CompareStoredState {
  try {
    const raw = localStorage.getItem(COMPARE_STORAGE_KEY);
    if (!raw) return emptyCompareState();
    const parsed = JSON.parse(raw) as Partial<CompareStoredState>;
    const ids = Array.isArray(parsed.ids)
      ? parsed.ids.filter((id): id is string => typeof id === "string")
      : [];
    return {
      categoryKey:
        typeof parsed.categoryKey === "string" ? parsed.categoryKey : "",
      categoryLabel:
        typeof parsed.categoryLabel === "string" ? parsed.categoryLabel : "",
      ids,
    };
  } catch {
    return emptyCompareState();
  }
}

export function writeCompareState(state: CompareStoredState) {
  if (state.ids.length === 0) {
    localStorage.removeItem(COMPARE_STORAGE_KEY);
  } else {
    localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(state));
  }
  window.dispatchEvent(new CustomEvent(COMPARE_CHANGED_EVENT));
}

function fmtNum(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(Number(n)) || Number(n) <= 0) return "—";
  return Number(n).toLocaleString("ru-RU");
}

function pricePerM2(p: DbProperty): number | null {
  const direct = Number(p.price_per_m2);
  if (direct > 0) return direct;
  const area = Number(p.area);
  const price = Number(p.price);
  if (area > 0 && price > 0) return Math.round(price / area);
  return null;
}

export type CompareRow = {
  key: string;
  label: string;
  values: string[];
  /** Numeric values for highlighting best (lower/higher). */
  numeric?: (number | null)[];
  prefer?: "lower" | "higher";
};

/** Строки сравнения: площадь, цена, ₽/м² и характеристики. */
export function buildCompareRows(properties: DbProperty[]): CompareRow[] {
  if (properties.length === 0) return [];

  const list = properties.map((p) => withExtras(p));
  const col = <T>(fn: (p: (typeof list)[number]) => T): T[] => list.map(fn);

  const isRent = list.some((p) => p.deal_type === "Аренда");
  const anyLand = list.some((p) => isAnyLand(p));
  const anyRooms = list.some((p) => Boolean(getResidentialRooms(p)));

  const rows: CompareRow[] = [
    {
      key: "price",
      label: isRent ? "Цена" : "Цена",
      values: col((p) => formatPropertyPrice(p) ?? "По запросу"),
      numeric: col((p) => {
        const n = Number(p.price);
        return n > 0 ? n : null;
      }),
      prefer: "lower",
    },
    {
      key: "price_m2",
      label: isRent ? "Цена за м²" : "Цена за м²",
      values: col((p) => {
        const n = pricePerM2(p);
        if (n == null) return "—";
        return `${fmtNum(n)} ₽/м²${p.deal_type === "Аренда" ? "/мес" : ""}`;
      }),
      numeric: col((p) => pricePerM2(p)),
      prefer: "lower",
    },
    {
      key: "area",
      label: "Площадь",
      values: col((p) => (p.area ? `${fmtNum(p.area)} м²` : "—")),
      numeric: col((p) => (Number(p.area) > 0 ? Number(p.area) : null)),
      prefer: "higher",
    },
    {
      key: "type",
      label: "Тип объекта",
      values: col((p) => getPrimaryPropertyType(p) || p.type || "—"),
    },
    {
      key: "deal",
      label: "Тип сделки",
      values: col((p) => p.deal_type || "—"),
    },
    {
      key: "district",
      label: "Район",
      values: col((p) => p.district || "—"),
    },
    {
      key: "address",
      label: "Адрес",
      values: col((p) => formatPropertyAddressShort(p.address) || p.address || "—"),
    },
  ];

  if (anyRooms) {
    rows.push({
      key: "rooms",
      label: "Комнат",
      values: col((p) => getResidentialRooms(p) || "—"),
      numeric: col((p) => {
        const r = getResidentialRooms(p);
        const n = Number(r);
        return Number.isFinite(n) && n > 0 ? n : null;
      }),
      prefer: "higher",
    });
  }

  const livingKeys: { key: string; label: string; extrasKey: string }[] = [
    {
      key: "living_area",
      label: "Жилая площадь",
      extrasKey: RESIDENTIAL_EXTRAS_KEYS.livingArea,
    },
    {
      key: "kitchen_area",
      label: "Кухня",
      extrasKey: RESIDENTIAL_EXTRAS_KEYS.kitchenArea,
    },
    {
      key: "building",
      label: "Тип дома",
      extrasKey: RESIDENTIAL_EXTRAS_KEYS.buildingType,
    },
    {
      key: "wood_wall",
      label: "Стены",
      extrasKey: RESIDENTIAL_EXTRAS_KEYS.woodWall,
    },
    {
      key: "wood_floors",
      label: "Этажность",
      extrasKey: RESIDENTIAL_EXTRAS_KEYS.woodFloors,
    },
    {
      key: "wood_foundation",
      label: "Фундамент",
      extrasKey: RESIDENTIAL_EXTRAS_KEYS.woodFoundation,
    },
    {
      key: "wood_roof",
      label: "Кровля",
      extrasKey: RESIDENTIAL_EXTRAS_KEYS.woodRoof,
    },
    {
      key: "wood_finish",
      label: "Готовность",
      extrasKey: RESIDENTIAL_EXTRAS_KEYS.woodFinish,
    },
    {
      key: "year",
      label: "Год постройки",
      extrasKey: RESIDENTIAL_EXTRAS_KEYS.yearBuilt,
    },
    {
      key: "furniture",
      label: "Мебель",
      extrasKey: RESIDENTIAL_EXTRAS_KEYS.furniture,
    },
    {
      key: "bathroom",
      label: "Санузел",
      extrasKey: RESIDENTIAL_EXTRAS_KEYS.bathroom,
    },
    {
      key: "balcony",
      label: "Балкон",
      extrasKey: RESIDENTIAL_EXTRAS_KEYS.balcony,
    },
  ];

  for (const item of livingKeys) {
    if (!list.some((p) => extraStr(p, item.extrasKey))) continue;
    rows.push({
      key: item.key,
      label: item.label,
      values: col((p) => {
        const v = extraStr(p, item.extrasKey);
        if (!v) return "—";
        if (
          item.extrasKey === RESIDENTIAL_EXTRAS_KEYS.livingArea ||
          item.extrasKey === RESIDENTIAL_EXTRAS_KEYS.kitchenArea
        ) {
          return `${v} м²`;
        }
        return v;
      }),
    });
  }

  if (!anyLand) {
    rows.push(
      {
        key: "floor",
        label: "Этаж",
        values: col((p) =>
          p.floor && p.floor !== "-"
            ? `${p.floor}${p.total_floors ? ` из ${p.total_floors}` : ""}`
            : "—",
        ),
      },
      {
        key: "ceiling",
        label: "Высота потолков",
        values: col((p) =>
          p.ceiling_height && Number(p.ceiling_height) > 0
            ? `${p.ceiling_height} м`
            : "—",
        ),
        numeric: col((p) =>
          Number(p.ceiling_height) > 0 ? Number(p.ceiling_height) : null,
        ),
        prefer: "higher",
      },
      {
        key: "condition",
        label: "Состояние",
        values: col((p) => p.condition || "—"),
      },
      {
        key: "layout",
        label: "Планировка",
        values: col((p) => p.layout || "—"),
      },
      {
        key: "parking",
        label: "Парковка",
        values: col((p) => p.parking || "—"),
      },
      {
        key: "class",
        label: "Класс",
        values: col((p) => (p.class && p.class !== "-" ? p.class : "—")),
      },
    );
  } else {
    rows.push({
      key: "land_use",
      label: "Назначение",
      values: col((p) => getLandUse(p) || "—"),
    });
  }

  if (isRent) {
    rows.push(
      {
        key: "deposit",
        label: "Залог / депозит",
        values: col((p) => p.deposit || "—"),
      },
      {
        key: "contract",
        label: "Срок аренды",
        values: col((p) => p.contract_term || "—"),
      },
    );
  }

  rows.push({
    key: "features",
    label: "Особенности",
    values: col((p) =>
      p.features && p.features.length > 0 ? p.features.join(", ") : "—",
    ),
  });

  return rows;
}

export function bestValueIndexes(
  numeric: (number | null)[] | undefined,
  prefer: "lower" | "higher" | undefined,
): Set<number> {
  const best = new Set<number>();
  if (!numeric || !prefer) return best;
  const valid = numeric
    .map((v, i) => (v != null && Number.isFinite(v) ? { v, i } : null))
    .filter((x): x is { v: number; i: number } => x != null);
  if (valid.length < 2) return best;
  const target =
    prefer === "lower"
      ? Math.min(...valid.map((x) => x.v))
      : Math.max(...valid.map((x) => x.v));
  for (const x of valid) {
    if (x.v === target) best.add(x.i);
  }
  return best;
}
