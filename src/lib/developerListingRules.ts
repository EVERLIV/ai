import type { PropertySegment } from "@/config/propertySegments";
import {
  defaultProjectKindForSubtype,
  type DeveloperProjectKind,
  type DeveloperSubtype,
} from "@/lib/developerTypes";
import { getPropertyTypes } from "@/lib/propertyTypes";

/** Квартиры / апартаменты в ЖК */
export const APARTMENT_DEVELOPER_PROPERTY_TYPES = [
  "Квартира",
  "Апартаменты",
] as const;

/** Деревянные / каркасные дома на заказ */
export const MADE_TO_ORDER_HOUSE_TYPE = "Дом на заказ";

export const FRAME_HOUSE_DEVELOPER_PROPERTY_TYPES = [
  MADE_TO_ORDER_HOUSE_TYPE,
  "Дом",
  "Коттедж",
  "Дача",
] as const;

export function allowedSegmentsForDeveloper(): PropertySegment[] {
  return ["residential"];
}

export function allowedPropertyTypesForSubtype(
  subtype: DeveloperSubtype,
): readonly string[] {
  return subtype === "frame_house_builder"
    ? FRAME_HOUSE_DEVELOPER_PROPERTY_TYPES
    : APARTMENT_DEVELOPER_PROPERTY_TYPES;
}

export function defaultMarketForSubtype(subtype: DeveloperSubtype): string {
  return subtype === "frame_house_builder" ? "На заказ" : "Новостройка";
}

export function defaultPropertyTypeForSubtype(
  subtype: DeveloperSubtype,
): string {
  return allowedPropertyTypesForSubtype(subtype)[0];
}

export function assertDeveloperProjectKind(
  subtype: DeveloperSubtype,
  projectKind: DeveloperProjectKind | string | null | undefined,
): void {
  const expected = defaultProjectKindForSubtype(subtype);
  if (projectKind && projectKind !== expected) {
    throw new Error(
      subtype === "frame_house_builder"
        ? "Для деревянного застройщика доступны только серии домов"
        : "Для застройщика МКД доступны только жилые комплексы",
    );
  }
}

export function resolveDeveloperProjectKind(
  subtype: DeveloperSubtype,
  _requested?: DeveloperProjectKind | null,
): DeveloperProjectKind {
  return defaultProjectKindForSubtype(subtype);
}

type ListingAssertInput = {
  subtype: DeveloperSubtype;
  segment?: string | null;
  type?: string | null;
  types?: string[] | null;
  extras?: Record<string, unknown> | null;
  developer_project_id?: string | null;
  developer_unit_type_id?: string | null;
};

function collectListingTypes(input: ListingAssertInput): string[] {
  const fromExtras = getPropertyTypes({
    type: input.type,
    extras: input.extras ?? undefined,
  });
  if (fromExtras.length) return fromExtras;
  if (Array.isArray(input.types) && input.types.length) {
    return input.types.map((t) => String(t).trim()).filter(Boolean);
  }
  if (input.type?.trim()) return [input.type.trim()];
  return [];
}

/**
 * Жёсткая проверка объявления застройщика.
 * Требует residential, allowlist типов, project_id и unit_type_id.
 */
export function assertDeveloperListingPayload(input: ListingAssertInput): void {
  const segment = (input.segment || "").trim() || "residential";
  if (segment !== "residential") {
    throw new Error(
      "Застройщик может размещать только жилые объекты в своих проектах",
    );
  }

  const allowed = allowedPropertyTypesForSubtype(input.subtype);
  const types = collectListingTypes(input);
  if (types.length === 0) {
    throw new Error("Укажите тип объекта");
  }
  const invalid = types.filter((t) => !allowed.includes(t));
  if (invalid.length > 0) {
    throw new Error(
      input.subtype === "frame_house_builder"
        ? `Деревянный застройщик может размещать только: ${allowed.join(", ")}`
        : `Застройщик МКД может размещать только: ${allowed.join(", ")}`,
    );
  }

  const projectId = (input.developer_project_id || "").trim();
  if (!projectId) {
    throw new Error(
      input.subtype === "frame_house_builder"
        ? "Выберите серию домов для объявления"
        : "Выберите проект (ЖК) для объявления",
    );
  }

  const unitId = (input.developer_unit_type_id || "").trim();
  if (!unitId) {
    throw new Error(
      input.subtype === "frame_house_builder"
        ? "Выберите модель / планировку серии"
        : "Выберите планировку в проекте",
    );
  }
}

export function filterTypesForDeveloperSubtype(
  subtype: DeveloperSubtype,
  typeOptions: string[],
): string[] {
  const allowed = new Set(allowedPropertyTypesForSubtype(subtype));
  return typeOptions.filter((t) => allowed.has(t));
}

export function developerAddListingCtaLabel(subtype: DeveloperSubtype): string {
  return subtype === "frame_house_builder"
    ? "Дом на заказ"
    : "Квартиру в ЖК";
}
