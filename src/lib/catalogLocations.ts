import type { DictionaryItem } from "@/hooks/useDictionaries";
import type { LocationKind, LocationNode } from "@/lib/locations/types";
import {
  getChildren,
  getCityNodes,
  getIrkutskDistrictNames,
  getIrkutskMicrodistrictNames,
  IRKUTSK_REGION_ID,
  IRKUTSK_REGION_NAME,
  IRKUTSK_LOCATION_NODES,
} from "@/lib/locations";
import type { LocationCityNode } from "@/lib/locationPicker";

export type CatalogTreeNode = {
  item: DictionaryItem;
  children: CatalogTreeNode[];
};

export type LocationCatalogLists = {
  irkutskDistricts: string[];
  oblastCities: string[];
  oblastRayons: string[];
  allDistricts: string[];
};

function districtItems(items: DictionaryItem[]): DictionaryItem[] {
  return items.filter(
    (i) => i.category === "district" && i.is_active !== false,
  );
}

function metaKind(item: DictionaryItem): LocationKind | undefined {
  const kind = item.metadata?.kind;
  return typeof kind === "string" ? (kind as LocationKind) : undefined;
}

function metaStringList(item: DictionaryItem, key: string): string[] {
  const raw = item.metadata?.[key];
  if (Array.isArray(raw)) {
    return raw.map((v) => String(v).trim()).filter(Boolean);
  }
  if (typeof raw === "string") {
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function parentValueOf(
  item: DictionaryItem,
  byId: Map<string, DictionaryItem>,
): string | null {
  if (item.parent_id) {
    const p = byId.get(item.parent_id);
    if (p) return p.value;
  }
  return item.parent?.trim() || null;
}

export function buildCatalogTree(items: DictionaryItem[]): CatalogTreeNode[] {
  const sorted = [...items].sort(
    (a, b) => a.sort_order - b.sort_order || a.value.localeCompare(b.value, "ru"),
  );
  const byId = new Map(sorted.map((i) => [i.id, i]));

  const resolveParentId = (item: DictionaryItem): string | null => {
    if (item.parent_id && byId.has(item.parent_id)) return item.parent_id;
    if (item.parent) {
      const p = sorted.find((x) => x.value === item.parent);
      return p?.id ?? null;
    }
    return null;
  };

  const childrenMap = new Map<string | null, DictionaryItem[]>();
  for (const item of sorted) {
    const pid = resolveParentId(item);
    const list = childrenMap.get(pid) ?? [];
    list.push(item);
    childrenMap.set(pid, list);
  }

  const build = (parentId: string | null): CatalogTreeNode[] => {
    const kids = childrenMap.get(parentId) ?? [];
    return kids.map((item) => ({
      item,
      children: build(item.id),
    }));
  };

  return build(null);
}

function mergeDistricts(a: string[], b: string[]): string[] {
  return Array.from(new Set([...a, ...b].map((s) => s.trim()).filter(Boolean)));
}

/** Дерево город → районы из БД (category=district). */
export function buildLocationTreeFromCatalog(
  dictItems: DictionaryItem[] = [],
): LocationCityNode[] {
  const items = districtItems(dictItems);
  if (items.length === 0) return [];

  const byId = new Map(items.map((i) => [i.id, i]));
  const map = new Map<string, string[]>();

  for (const item of items) {
    const kind = metaKind(item);
    const parentName = parentValueOf(item, byId);

    if (!parentName || parentName === item.value) {
      if (!map.has(item.value)) map.set(item.value, []);
      continue;
    }

    const existing = map.get(parentName) || [];
    map.set(parentName, mergeDistricts(existing, [item.value]));
  }

  for (const item of items) {
    const parentName = parentValueOf(item, byId);
    if (!parentName && !map.has(item.value)) {
      map.set(item.value, []);
    }
  }

  return Array.from(map.entries())
    .map(([city, districts]) => ({
      city,
      districts: [...districts].sort((a, b) => a.localeCompare(b, "ru")),
    }))
    .sort((a, b) => a.city.localeCompare(b.city, "ru"));
}

export function mergeCatalogWithStaticTree(
  staticTree: LocationCityNode[],
  dictItems: DictionaryItem[] = [],
): LocationCityNode[] {
  const catalogTree = buildLocationTreeFromCatalog(dictItems);
  const map = new Map<string, string[]>();

  for (const node of staticTree) {
    map.set(node.city, [...node.districts]);
  }
  for (const node of catalogTree) {
    const existing = map.get(node.city) || [];
    map.set(node.city, mergeDistricts(existing, node.districts));
  }

  return Array.from(map.entries())
    .map(([city, districts]) => ({
      city,
      districts: [...districts].sort((a, b) => a.localeCompare(b, "ru")),
    }))
    .sort((a, b) => a.city.localeCompare(b, "ru"));
}

export function getLocationCatalogLists(
  dictItems: DictionaryItem[] = [],
): LocationCatalogLists {
  const items = districtItems(dictItems);
  const staticIrkutsk = [...getIrkutskDistrictNames()];
  const staticMicros = [...getIrkutskMicrodistrictNames()];
  const staticCities = getCityNodes()
    .filter((n) => n.name !== "Иркутск")
    .map((n) => n.name);
  const staticRayons = getChildren(IRKUTSK_REGION_ID)
    .filter((n) => n.kind === "district" && n.id.startsWith("rayon:"))
    .map((n) => n.name);

  const byId = new Map(items.map((i) => [i.id, i]));
  const irkutskDistricts = new Set<string>(staticIrkutsk);
  const oblastCities = new Set<string>(staticCities);
  const oblastRayons = new Set<string>(staticRayons);

  for (const item of items) {
    const kind = metaKind(item);
    const parentName = parentValueOf(item, byId);

    if (parentName === "Иркутск" || parentName === IRKUTSK_REGION_NAME) {
      if (kind === "district" || kind === "microdistrict" || !kind) {
        irkutskDistricts.add(item.value);
      }
    }
    if (kind === "city" || (!parentName && !kind)) {
      if (item.value !== "Иркутск" && item.value !== IRKUTSK_REGION_NAME) {
        oblastCities.add(item.value);
      }
    }
    if (kind === "district" && parentName === IRKUTSK_REGION_NAME) {
      oblastRayons.add(item.value);
    }
    if (!parentName && item.value !== IRKUTSK_REGION_NAME) {
      oblastCities.add(item.value);
    }
    if (parentName === "Иркутск") {
      irkutskDistricts.add(item.value);
    }
  }

  const allDistricts = Array.from(
    new Set([
      ...irkutskDistricts,
      ...staticMicros,
      ...oblastCities,
      ...oblastRayons,
    ]),
  ).sort((a, b) => a.localeCompare(b, "ru"));

  return {
    irkutskDistricts: Array.from(irkutskDistricts).sort((a, b) =>
      a.localeCompare(b, "ru"),
    ),
    oblastCities: Array.from(oblastCities).sort((a, b) =>
      a.localeCompare(b, "ru"),
    ),
    oblastRayons: Array.from(oblastRayons).sort((a, b) =>
      a.localeCompare(b, "ru"),
    ),
    allDistricts,
  };
}

export type CatalogCityOption = {
  id: string;
  name: string;
  kind: LocationKind;
  lat?: number;
  lng?: number;
};

export function getCatalogCityOptions(
  dictItems: DictionaryItem[] = [],
): CatalogCityOption[] {
  const items = districtItems(dictItems);
  const byId = new Map(items.map((i) => [i.id, i]));
  const staticCities = getCityNodes().map((c) => ({
    id: c.id,
    name: c.name,
    kind: c.kind,
    lat: c.lat,
    lng: c.lng,
  }));
  const staticRayons = getChildren(IRKUTSK_REGION_ID)
    .filter((n) => n.kind === "district" && n.id.startsWith("rayon:"))
    .map((r) => ({
      id: r.id,
      name: r.name,
      kind: r.kind,
      lat: r.lat,
      lng: r.lng,
    }));

  const fromDb: CatalogCityOption[] = [];
  const seen = new Set(staticCities.map((c) => c.name));

  for (const item of items) {
    const kind = metaKind(item);
    const parentName = parentValueOf(item, byId);
    const isTopLevel =
      !parentName ||
      parentName === IRKUTSK_REGION_NAME ||
      parentName === item.value;
    const isCity = kind === "city" || (isTopLevel && kind !== "district");

    if (isCity && !seen.has(item.value)) {
      seen.add(item.value);
      const lat = Number(item.metadata?.lat);
      const lng = Number(item.metadata?.lng);
      fromDb.push({
        id: `catalog:${item.id}`,
        name: item.value,
        kind: kind ?? "city",
        ...(Number.isFinite(lat) ? { lat } : {}),
        ...(Number.isFinite(lng) ? { lng } : {}),
      });
    }
  }

  return [...staticCities, ...staticRayons, ...fromDb].sort((a, b) =>
    a.name.localeCompare(b.name, "ru"),
  );
}

export function getCatalogLocalityOptions(
  dictItems: DictionaryItem[],
  cityName: string,
): CatalogCityOption[] {
  const items = districtItems(dictItems);
  const byId = new Map(items.map((i) => [i.id, i]));
  const staticCity = getCityNodes().find((c) => c.name === cityName);
  const staticKids = staticCity
    ? getChildren(staticCity.id).map((l) => ({
        id: l.id,
        name: l.name,
        kind: l.kind,
        lat: l.lat,
        lng: l.lng,
      }))
    : [];

  const fromDb: CatalogCityOption[] = [];
  const seen = new Set(staticKids.map((k) => k.name));

  for (const item of items) {
    const parentName = parentValueOf(item, byId);
    if (parentName !== cityName) continue;
    if (seen.has(item.value)) continue;
    seen.add(item.value);
    const kind = metaKind(item) ?? "district";
    const lat = Number(item.metadata?.lat);
    const lng = Number(item.metadata?.lng);
    fromDb.push({
      id: `catalog:${item.id}`,
      name: item.value,
      kind,
      ...(Number.isFinite(lat) ? { lat } : {}),
      ...(Number.isFinite(lng) ? { lng } : {}),
    });
  }

  return [...staticKids, ...fromDb].sort((a, b) =>
    a.name.localeCompare(b.name, "ru"),
  );
}

export function dictionaryToLocationNode(item: DictionaryItem): LocationNode {
  const kind = metaKind(item) ?? "district";
  const lat = Number(item.metadata?.lat);
  const lng = Number(item.metadata?.lng);
  const aliases = metaStringList(item, "aliases");

  return {
    id: `catalog:${item.id}`,
    name: item.value,
    kind,
    parentId: item.parent_id ? `catalog:${item.parent_id}` : null,
    ...(Number.isFinite(lat) ? { lat } : {}),
    ...(Number.isFinite(lng) ? { lng } : {}),
    ...(aliases.length ? { aliases } : {}),
  };
}

export function mergeStaticAndCatalogNodes(
  dictItems: DictionaryItem[] = [],
): LocationNode[] {
  const staticNodes = [...IRKUTSK_LOCATION_NODES];
  const items = districtItems(dictItems);
  const staticNames = new Set(
    staticNodes.flatMap((n) => [n.name, ...(n.aliases ?? [])]),
  );

  const extra = items
    .filter((i) => !staticNames.has(i.value))
    .map(dictionaryToLocationNode);

  return [...staticNodes, ...extra];
}

export function filterCatalogItems(
  items: DictionaryItem[],
  query: string,
): DictionaryItem[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => {
    const hay = [
      item.value,
      item.label ?? "",
      item.slug ?? "",
      item.description ?? "",
      item.parent ?? "",
      JSON.stringify(item.metadata ?? {}),
    ]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}
