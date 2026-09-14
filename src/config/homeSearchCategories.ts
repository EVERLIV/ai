import type { PropertySegment } from "@/config/propertySegments";
import {
  COMMERCIAL_PROPERTY_TYPES,
  LAND_PROPERTY_TYPES,
  RESIDENTIAL_PROPERTY_TYPES,
} from "@/config/propertySegments";

/** Значения сделки в каталоге / URL */
export type HomeDealChoice = "Аренда" | "Продажа" | "Посуточно";

export type HomeDealTab = {
  label: string;
  value: HomeDealChoice;
};

/** Вкладки сделки на главной (как у Авито: Купить / Снять / Посуточно) */
export const HOME_DEAL_TABS: readonly HomeDealTab[] = [
  { label: "Купить", value: "Продажа" },
  { label: "Снять", value: "Аренда" },
  { label: "Посуточно", value: "Посуточно" },
] as const;

export function homeDealLabel(value: HomeDealChoice): string {
  return HOME_DEAL_TABS.find((t) => t.value === value)?.label ?? "Снять";
}

type CategoryGroup = {
  title: string;
  items: readonly string[];
  /** Для каких сделок показывать группу (все items) */
  deals: readonly HomeDealChoice[];
};

/**
 * Все категории сайта для выпадающего списка на главной.
 * Посуточно — только жильё, которое реально сдают краткосрочно.
 */
export const HOME_SEARCH_CATEGORY_GROUPS: readonly CategoryGroup[] = [
  {
    title: "Квартиры и комнаты",
    items: ["Квартира", "Комната", "Апартаменты", "Доля"],
    deals: ["Аренда", "Продажа", "Посуточно"],
  },
  {
    title: "Дома",
    items: ["Дом", "Дом на заказ", "Дача", "Коттедж", "Таунхаус"],
    deals: ["Аренда", "Продажа", "Посуточно"],
  },
  {
    title: "Гаражи",
    items: ["Гараж", "Машиноместо"],
    deals: ["Аренда", "Продажа"],
  },
  {
    title: "Офисы",
    items: ["Офис"],
    deals: ["Аренда", "Продажа"],
  },
  {
    title: "Торговля",
    items: ["Торговая", "Павильон", "Общепит"],
    deals: ["Аренда", "Продажа"],
  },
  {
    title: "Склад и производство",
    items: ["Склад", "Производство", "Автосервис"],
    deals: ["Аренда", "Продажа"],
  },
  {
    title: "Свободного назначения",
    items: ["ПСН"],
    deals: ["Аренда", "Продажа"],
  },
  {
    title: "Участки",
    items: ["Земля", "Участок"],
    deals: ["Аренда", "Продажа"],
  },
] as const;

/** Типы, недоступные для посуточной аренды даже внутри «жилых» групп */
const DAILY_EXCLUDED = new Set(["Доля", "Дом на заказ"]);

export function categoriesForDeal(
  deal: HomeDealChoice,
): { title: string; items: string[] }[] {
  return HOME_SEARCH_CATEGORY_GROUPS.filter((g) =>
    g.deals.includes(deal),
  ).map((g) => ({
    title: g.title,
    items: g.items.filter((item) => {
      if (deal === "Посуточно" && DAILY_EXCLUDED.has(item)) return false;
      return true;
    }),
  })).filter((g) => g.items.length > 0);
}

export function typesAllowedForDeal(deal: HomeDealChoice): string[] {
  return categoriesForDeal(deal).flatMap((g) => g.items);
}

export function defaultTypeForDeal(deal: HomeDealChoice): string {
  const types = typesAllowedForDeal(deal);
  if (types.includes("Квартира")) return "Квартира";
  return types[0] ?? "Квартира";
}

export function isTypeAllowedForDeal(
  type: string,
  deal: HomeDealChoice,
): boolean {
  return typesAllowedForDeal(deal).includes(type);
}

export function segmentForPropertyType(type: string): PropertySegment {
  if ((LAND_PROPERTY_TYPES as readonly string[]).includes(type)) return "land";
  if ((RESIDENTIAL_PROPERTY_TYPES as readonly string[]).includes(type)) {
    return "residential";
  }
  if ((COMMERCIAL_PROPERTY_TYPES as readonly string[]).includes(type)) {
    return "commercial";
  }
  if (type === "Новостройка") return "residential";
  return "commercial";
}
