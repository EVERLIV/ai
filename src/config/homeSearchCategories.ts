import type { PropertySegment } from "@/config/propertySegments";

/** Значения сделки в каталоге / URL */
export type HomeDealChoice = "Аренда" | "Продажа" | "Посуточно";

export type HomeDealTab = {
  label: string;
  value: HomeDealChoice;
};

/** Вкладки сделки (Купить / Снять / Посуточно) */
export const HOME_DEAL_TABS: readonly HomeDealTab[] = [
  { label: "Купить", value: "Продажа" },
  { label: "Снять", value: "Аренда" },
  { label: "Посуточно", value: "Посуточно" },
] as const;

export function homeDealLabel(value: HomeDealChoice): string {
  return HOME_DEAL_TABS.find((t) => t.value === value)?.label ?? "Снять";
}

export type HomeMainCategory = {
  id: string;
  label: string;
  segment: PropertySegment;
  /** Типы объектов в каталоге (без подкатегорий в UI) */
  types: readonly string[];
  deals: readonly HomeDealChoice[];
  /** Показать фильтр «Комнаты» */
  showRooms?: boolean;
  /** Рынок зафиксирован (Новостройка / Вторичка) */
  market?: string;
  /** ID родительской категории (для визуальной группировки checkboxes) */
  parentId?: string;
};

/**
 * Основные категории сайта — плоский список без подтипов.
 * Клик передаёт группу types в buildCatalogUrl.
 */
export const HOME_MAIN_CATEGORIES: readonly HomeMainCategory[] = [
  {
    id: "apartments",
    label: "Квартиры",
    segment: "residential",
    types: ["Квартира", "Апартаменты"],
    deals: ["Аренда", "Продажа", "Посуточно"],
    showRooms: true,
  },
  {
    id: "rooms",
    label: "Комнаты",
    segment: "residential",
    types: ["Комната"],
    deals: ["Аренда", "Продажа", "Посуточно"],
  },
  {
    id: "houses",
    label: "Дома, дачи, коттеджи",
    segment: "residential",
    types: ["Дом", "Коттедж", "Дача", "Таунхаус", "Дом на заказ"],
    deals: ["Аренда", "Продажа", "Посуточно"],
  },
  {
    id: "land",
    label: "Земельные участки",
    segment: "land",
    types: ["Земля", "Участок"],
    deals: ["Аренда", "Продажа"],
  },
  {
    id: "garages",
    label: "Гаражи и машиноместа",
    segment: "residential",
    types: ["Гараж", "Машиноместо"],
    deals: ["Аренда", "Продажа"],
  },
  {
    id: "commercial",
    label: "Коммерческая недвижимость",
    segment: "commercial",
    types: [
      "Офис",
      "Торговая",
      "Помещение",
      "Павильон",
      "Киоск",
      "Общепит",
      "Склад",
      "Производство",
      "Автосервис",
      "ПСН",
    ],
    deals: ["Аренда", "Продажа"],
  },
] as const;

/** Для посуточной аренды домов — без «Дом на заказ» */
const DAILY_HOUSE_TYPES = ["Дом", "Коттедж", "Дача", "Таунхаус"] as const;

export function categoriesForDeal(
  deal: HomeDealChoice,
): HomeMainCategory[] {
  return HOME_MAIN_CATEGORIES.filter((c) => c.deals.includes(deal)).map(
    (c) => {
      if (deal === "Посуточно" && c.id === "houses") {
        return { ...c, types: [...DAILY_HOUSE_TYPES] };
      }
      return { ...c, types: [...c.types] };
    },
  );
}

export function getCategoryById(
  id: string | null | undefined,
): HomeMainCategory | undefined {
  if (!id) return undefined;
  return HOME_MAIN_CATEGORIES.find((c) => c.id === id);
}

export function defaultCategoryForDeal(deal: HomeDealChoice): HomeMainCategory {
  const list = categoriesForDeal(deal);
  return list.find((c) => c.id === "apartments") ?? list[0]!;
}

export function isCategoryAllowedForDeal(
  categoryId: string,
  deal: HomeDealChoice,
): boolean {
  return categoriesForDeal(deal).some((c) => c.id === categoryId);
}

export function typesForCategoryDeal(
  categoryId: string,
  deal: HomeDealChoice,
): string[] {
  const cat = categoriesForDeal(deal).find((c) => c.id === categoryId);
  return cat ? [...cat.types] : [];
}

/** @deprecated используйте getCategoryById / typesForCategoryDeal */
export function segmentForPropertyType(type: string): PropertySegment {
  const found = HOME_MAIN_CATEGORIES.find((c) =>
    c.types.includes(type),
  );
  return found?.segment ?? "commercial";
}
