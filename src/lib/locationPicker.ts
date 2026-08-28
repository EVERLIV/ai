import type { DictionaryItem } from "@/hooks/useDictionaries";
import { mergeCatalogWithStaticTree } from "@/lib/catalogLocations";
import {
  getChildren,
  getCityNodes,
  getIrkutskDistrictNames,
  getIrkutskMicrodistrictNames,
  IRKUTSK_REGION_ID,
} from "@/lib/locations";

export const IRKUTSK_REGION_LABEL = "Иркутская область";

export type LocationCityNode = {
  city: string;
  /** Районы / мкр под городом. Пустой — выбирается сам город. */
  districts: string[];
};

function mergeDistricts(a: string[], b: string[]): string[] {
  return Array.from(new Set([...a, ...b].map((s) => s.trim()).filter(Boolean)));
}

/** Статический каркас из иерархической библиотеки (Китой под Ангарском). */
export function buildStaticLocationTree(): LocationCityNode[] {
  const map = new Map<string, string[]>();

  for (const city of getCityNodes()) {
    const kids = getChildren(city.id).map((c) => c.name);
    map.set(city.name, kids);
  }

  for (const rayon of getChildren(IRKUTSK_REGION_ID).filter(
    (n) => n.kind === "district" && n.id.startsWith("rayon:"),
  )) {
    if (!map.has(rayon.name)) map.set(rayon.name, []);
  }

  return Array.from(map.entries())
    .map(([city, districts]) => ({ city, districts }))
    .sort((a, b) => a.city.localeCompare(b.city, "ru"));
}

/**
 * Дерево городов → районы из справочника `district` (parent = город)
 * + статические локации области
 * + доп. значения с объявлений.
 */
export function buildLocationTree(
  dictItems: DictionaryItem[] = [],
  extraLocations: string[] = [],
): LocationCityNode[] {
  const merged = mergeCatalogWithStaticTree(buildStaticLocationTree(), dictItems);
  const map = new Map<string, string[]>();

  for (const node of merged) {
    map.set(node.city, [...node.districts]);
  }

  const irkutskDistricts = new Set(getIrkutskDistrictNames());
  const irkutskMicros = new Set(getIrkutskMicrodistrictNames());

  const known = new Set<string>();
  for (const [city, districts] of map) {
    known.add(city);
    for (const d of districts) known.add(d);
  }

  for (const raw of extraLocations) {
    const value = raw?.trim();
    if (!value || known.has(value)) continue;

    let nested = false;
    for (const districts of map.values()) {
      if (districts.includes(value)) {
        nested = true;
        break;
      }
    }
    if (nested) continue;

    if (irkutskDistricts.has(value) || irkutskMicros.has(value)) {
      map.set("Иркутск", mergeDistricts(map.get("Иркутск") || [], [value]));
      known.add(value);
      continue;
    }

    map.set(value, []);
    known.add(value);
  }

  return Array.from(map.entries())
    .map(([city, districts]) => ({
      city,
      districts: [...districts].sort((a, b) => a.localeCompare(b, "ru")),
    }))
    .sort((a, b) => a.city.localeCompare(b.city, "ru"));
}

/** Плоский список всех локаций для выпадающего фильтра каталога */
export function flattenLocationOptions(
  dictItems: DictionaryItem[] = [],
  extraLocations: string[] = [],
): string[] {
  const tree = buildLocationTree(dictItems, extraLocations);
  const out = new Set<string>();
  for (const node of tree) {
    out.add(node.city);
    for (const d of node.districts) out.add(d);
  }
  for (const raw of extraLocations) {
    const v = raw?.trim();
    if (v) out.add(v);
  }
  return Array.from(out).sort((a, b) => a.localeCompare(b, "ru"));
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
