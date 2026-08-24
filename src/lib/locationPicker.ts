import type { DictionaryItem } from "@/hooks/useDictionaries";
import {
  IRKUTSK_CITY_DISTRICTS,
  IRKUTSK_MICRODISTRICTS,
  IRKUTSK_OBLAST_CITIES,
  IRKUTSK_OBLAST_DISTRICTS,
} from "@/lib/irkutskLocations";

export const IRKUTSK_REGION_LABEL = "Иркутская область";

export type LocationCityNode = {
  city: string;
  /** Районы / мкр под городом. Пустой — выбирается сам город. */
  districts: string[];
};

function mergeDistricts(a: string[], b: string[]): string[] {
  return Array.from(new Set([...a, ...b].map((s) => s.trim()).filter(Boolean)));
}

/** Статический каркас локаций области (fallback + дополнение к БД). */
export function buildStaticLocationTree(): LocationCityNode[] {
  const map = new Map<string, string[]>();

  map.set(
    "Иркутск",
    mergeDistricts([...IRKUTSK_CITY_DISTRICTS], [...IRKUTSK_MICRODISTRICTS]),
  );

  for (const city of IRKUTSK_OBLAST_CITIES) {
    if (!map.has(city)) map.set(city, []);
  }

  for (const district of IRKUTSK_OBLAST_DISTRICTS) {
    if (!map.has(district)) map.set(district, []);
  }

  return Array.from(map.entries())
    .map(([city, districts]) => ({ city, districts }))
    .sort((a, b) => a.city.localeCompare(b.city, "ru"));
}

/**
 * Дерево городов → районы из справочника `district` (parent = город)
 * + статические локации области.
 */
export function buildLocationTree(
  dictItems: DictionaryItem[] = [],
): LocationCityNode[] {
  const map = new Map<string, string[]>();

  for (const node of buildStaticLocationTree()) {
    map.set(node.city, [...node.districts]);
  }

  for (const item of dictItems) {
    if (item.category !== "district" || !item.is_active) continue;
    const value = item.value?.trim();
    if (!value) continue;
    const parent = item.parent?.trim() || null;

    if (!parent || parent === value) {
      if (!map.has(value)) map.set(value, []);
      continue;
    }

    const existing = map.get(parent) || [];
    map.set(parent, mergeDistricts(existing, [value]));
  }

  return Array.from(map.entries())
    .map(([city, districts]) => ({
      city,
      districts: [...districts].sort((a, b) => a.localeCompare(b, "ru")),
    }))
    .sort((a, b) => a.city.localeCompare(b.city, "ru"));
}

export type LetterGroup = {
  letter: string;
  cities: LocationCityNode[];
};

export function groupLocationsByLetter(
  cities: LocationCityNode[],
  query = "",
): LetterGroup[] {
  const q = query.trim().toLowerCase();
  const filtered = !q
    ? cities
    : cities
        .map((node) => {
          const cityMatch = node.city.toLowerCase().includes(q);
          const districts = node.districts.filter((d) =>
            d.toLowerCase().includes(q),
          );
          if (cityMatch) return node;
          if (districts.length > 0) return { ...node, districts };
          return null;
        })
        .filter((n): n is LocationCityNode => !!n);

  const byLetter = new Map<string, LocationCityNode[]>();
  for (const node of filtered) {
    const letter = node.city.charAt(0).toUpperCase();
    const list = byLetter.get(letter) || [];
    list.push(node);
    byLetter.set(letter, list);
  }

  return Array.from(byLetter.entries())
    .sort(([a], [b]) => a.localeCompare(b, "ru"))
    .map(([letter, cities]) => ({ letter, cities }));
}
