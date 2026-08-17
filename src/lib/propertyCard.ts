import type { DbProperty } from "@/hooks/useProperties";
import { getLandUse, isLandProperty } from "@/lib/propertyLand";
import { getPrimaryPropertyType, getPropertyTypes } from "@/lib/propertyTypes";

export type PropertyTitleInput = {
  type?: string | null;
  extras?: Record<string, unknown> | null;
  area?: number | null;
  district?: string | null;
  address?: string | null;
  layout?: string | null;
  class?: string | null;
};

/** Короткий район/город для заголовка карточки */
export function getPropertyDistrictLabel(property: PropertyTitleInput): string {
  const district = property.district?.trim();
  if (district && district !== "—") return district;

  const address = property.address?.trim() || "";
  const cityMatch = address.match(/(?:^|,\s*)г\.\s*([^,]+)/i);
  if (cityMatch?.[1]) return cityMatch[1].trim();

  const first = address.split(",")[0]?.trim();
  if (first && first.length <= 32) return first;

  return "";
}

function getPropertySubtypeLabel(property: PropertyTitleInput, category: string): string | null {
  const types = getPropertyTypes(property);
  const extraTypes = types.filter((type) => type !== category);
  if (extraTypes.length > 0) return extraTypes.join(", ");

  if (isLandProperty(property)) {
    return getLandUse(property);
  }

  const extras = (property.extras || {}) as Record<string, unknown>;
  const purpose = typeof extras.purpose === "string" ? extras.purpose.trim() : "";
  if (purpose && purpose !== "—") return purpose;

  const layout = property.layout?.trim();
  if (layout && layout !== "-") return layout;

  const propertyClass = property.class?.trim();
  if (propertyClass && propertyClass !== "-") return `класс ${propertyClass}`;

  return null;
}

/**
 * Заголовок объекта для карточек: категория · назначение · площадь · район.
 * Пример: «Земля · Гаражи · 58 м² · Байкальск»
 */
export function buildPropertyDisplayTitle(property: PropertyTitleInput): string {
  const category = getPrimaryPropertyType(property) || "Объект";
  const subtype = getPropertySubtypeLabel(property, category);
  const area = Number(property.area) > 0 ? `${Number(property.area).toLocaleString("ru-RU")} м²` : null;
  const district = getPropertyDistrictLabel(property);

  return [category, subtype, area, district].filter(Boolean).join(" · ");
}

/** Короткий адрес под заголовком — без региона и «Российская Федерация» */
export function formatPropertyAddressShort(address?: string | null): string {
  const value = address?.trim();
  if (!value) return "";

  const parts = value.split(",").map((part) => part.trim()).filter(Boolean);
  if (parts.length <= 2) return value;

  const skip = /^(российская федерация|россия|иркутская область|иркутская обл\.?)/i;
  const filtered = parts.filter((part) => !skip.test(part));
  const tail = (filtered.length > 0 ? filtered : parts).slice(-3);
  return tail.join(", ");
}

/** Минимальное отображаемое число просмотров на публичных карточках */
export const LISTING_VIEWS_FLOOR = 400;
/** Минимальное отображаемое число объектов агентства */
export const AGENCY_OBJECTS_FLOOR = 190;

/** Формат цены: "6 300 000 ₽" / "400 000 ₽/мес" */
export function formatPropertyPrice(p: { price?: number | null; deal_type?: string | null }): string | null {
  const price = Number(p.price);
  if (!price) return null;
  return `${price.toLocaleString("ru-RU")} ₽${p.deal_type === "Аренда" ? "/мес" : ""}`;
}

export function isListingVerified(p: DbProperty): boolean {
  const extras = p.extras as Record<string, unknown> | null;
  return !!extras?.agent_verified;
}

/** Просмотры для карточек и страницы объекта: не ниже 400+ */
export function formatListingViews(viewsCount?: number | null): string {
  const count = viewsCount ?? 0;
  if (count >= LISTING_VIEWS_FLOOR) return count.toLocaleString("ru-RU");
  return `${LISTING_VIEWS_FLOOR}+`;
}

function pluralizeObjects(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "объект";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "объекта";
  return "объектов";
}

/** Число объектов агента для публичного UI */
export function formatAgentObjectsLabel(
  count?: number | null,
  options?: { isAgency?: boolean },
): string | null {
  const raw = count ?? 0;
  if (raw <= 0 && !options?.isAgency) return null;

  if (options?.isAgency && raw < AGENCY_OBJECTS_FLOOR) {
    return `${AGENCY_OBJECTS_FLOOR}+ ${pluralizeObjects(AGENCY_OBJECTS_FLOOR)}`;
  }

  const display = raw > 0 ? raw : AGENCY_OBJECTS_FLOOR;
  return `${display.toLocaleString("ru-RU")} ${pluralizeObjects(display)}`;
}
