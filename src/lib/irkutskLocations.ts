/**
 * Совместимость: старые импорты из irkutskLocations.
 * Источник правды — src/lib/locations.
 */
import {
  findLocationByName,
  getChildren,
  getCityNodes,
  getIrkutskDistrictNames,
  getIrkutskMicrodistrictNames,
  IRKUTSK_REGION_ID,
  IRKUTSK_REGION_NAME,
  matchLocationFilter,
  resolveLocationFromAddress,
} from "@/lib/locations";

export type LocationGroup = {
  label: string;
  items: readonly string[];
};

export const IRKUTSK_CITY_DISTRICTS =
  getIrkutskDistrictNames() as readonly string[];

export const IRKUTSK_MICRODISTRICTS =
  getIrkutskMicrodistrictNames() as readonly string[];

/** Города области (без Китой — он под Ангарском) */
export const IRKUTSK_OBLAST_CITIES = getCityNodes()
  .filter((n) => n.name !== "Иркутск")
  .map((n) => n.name)
  .sort((a, b) => a.localeCompare(b, "ru")) as readonly string[];

export const IRKUTSK_OBLAST_DISTRICTS = getChildren(IRKUTSK_REGION_ID)
  .filter((n) => n.kind === "district" && n.id.startsWith("rayon:"))
  .map((n) => n.name)
  .sort((a, b) => a.localeCompare(b, "ru")) as readonly string[];

export const LOCATION_GROUPS: LocationGroup[] = [
  { label: "г. Иркутск — районы", items: IRKUTSK_CITY_DISTRICTS },
  { label: "г. Иркутск — микрорайоны", items: IRKUTSK_MICRODISTRICTS },
  { label: "Города и посёлки области", items: IRKUTSK_OBLAST_CITIES },
  { label: "Районы Иркутской области", items: IRKUTSK_OBLAST_DISTRICTS },
];

export const DISTRICTS: readonly string[] = Array.from(
  new Set(LOCATION_GROUPS.flatMap((g) => [...g.items])),
);

export function isBroadLocation(location: string | null | undefined): boolean {
  const loc = (location || "").trim();
  return (
    !loc ||
    loc === "Любой" ||
    loc === "Все" ||
    loc === IRKUTSK_REGION_NAME ||
    loc === "Иркутская область"
  );
}

/** Совпадение объекта с выбранным городом / районом / мкр (с раскрытием детей). */
export function propertyMatchesLocation(
  property: { district?: string | null; address?: string | null },
  location: string | null | undefined,
): boolean {
  if (isBroadLocation(location)) return true;
  const loc = (location || "").trim();
  const district = (property.district || "").trim();

  if (matchLocationFilter(district, loc)) return true;

  const address = (property.address || "").trim();
  if (address) {
    const resolved = resolveLocationFromAddress(address, district);
    if (resolved.district && matchLocationFilter(resolved.district, loc)) {
      return true;
    }
    if (address.toLowerCase().includes(loc.toLowerCase())) return true;
  }

  return false;
}

/** Подставить район/город из текста адреса Яндекса */
export function inferDistrictFromAddress(
  address: string,
  fallback = "Кировский",
): string {
  const text = address.trim();
  if (!text) return fallback;

  const resolved = resolveLocationFromAddress(text, fallback);
  if (resolved.district) return resolved.district;

  const byName = findLocationByName(fallback);
  return byName?.name || fallback;
}
