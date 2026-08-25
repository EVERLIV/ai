import { IRKUTSK_LOCATION_NODES } from "@/lib/locations/irkutskOblast";
import {
  IRKUTSK_REGION_ID,
  IRKUTSK_REGION_NAME,
  type LocationKind,
  type LocationNode,
  type PropertyLocationExtras,
} from "@/lib/locations/types";

export * from "@/lib/locations/types";
export { IRKUTSK_LOCATION_NODES } from "@/lib/locations/irkutskOblast";

const byId = new Map<string, LocationNode>();
const byNameNorm = new Map<string, LocationNode[]>();
const childrenByParent = new Map<string | null, LocationNode[]>();

function normalizeName(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/\s+/g, " ");
}

function indexNodes(nodes: readonly LocationNode[]) {
  byId.clear();
  byNameNorm.clear();
  childrenByParent.clear();

  for (const n of nodes) {
    byId.set(n.id, n);
    const names = [n.name, ...(n.aliases ?? [])];
    for (const name of names) {
      const key = normalizeName(name);
      const list = byNameNorm.get(key) ?? [];
      list.push(n);
      byNameNorm.set(key, list);
    }
    const parentKey = n.parentId;
    const kids = childrenByParent.get(parentKey) ?? [];
    kids.push(n);
    childrenByParent.set(parentKey, kids);
  }
}

indexNodes(IRKUTSK_LOCATION_NODES);

export function getLocationById(id: string): LocationNode | undefined {
  return byId.get(id);
}

export function getChildren(parentId: string | null): LocationNode[] {
  return [...(childrenByParent.get(parentId) ?? [])];
}

export function getRegionNode(): LocationNode {
  return byId.get(IRKUTSK_REGION_ID)!;
}

export function getCities(): LocationNode[] {
  return getChildren(IRKUTSK_REGION_ID).filter(
    (n) => n.kind === "city" || n.kind === "district",
  );
}

/** Только города (без муниципальных районов области) */
export function getCityNodes(): LocationNode[] {
  return getChildren(IRKUTSK_REGION_ID).filter((n) => n.kind === "city");
}

export function getPath(nodeId: string): LocationNode[] {
  const path: LocationNode[] = [];
  let cur: LocationNode | undefined = byId.get(nodeId);
  while (cur) {
    path.unshift(cur);
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
  }
  return path;
}

export function getPathNames(nodeId: string): string[] {
  return getPath(nodeId).map((n) => n.name);
}

export function getDescendantIds(nodeId: string): string[] {
  const result: string[] = [];
  const stack = [...getChildren(nodeId)];
  while (stack.length) {
    const n = stack.pop()!;
    result.push(n.id);
    stack.push(...getChildren(n.id));
  }
  return result;
}

export function getDescendantNames(nodeId: string): string[] {
  return getDescendantIds(nodeId)
    .map((id) => byId.get(id)?.name)
    .filter((n): n is string => Boolean(n));
}

/** Все имена узла и потомков (для фильтра города → включает Китой и т.д.) */
export function getMatchNamesForNode(nodeId: string): Set<string> {
  const names = new Set<string>();
  const root = byId.get(nodeId);
  if (!root) return names;
  const collect = (n: LocationNode) => {
    names.add(normalizeName(n.name));
    for (const a of n.aliases ?? []) names.add(normalizeName(a));
    for (const c of getChildren(n.id)) collect(c);
  };
  collect(root);
  return names;
}

function findNodesByName(name: string): LocationNode[] {
  return byNameNorm.get(normalizeName(name)) ?? [];
}

/**
 * Фильтр каталога: выбран «Ангарск» → совпадают Ангарск и все дети (Китой…).
 * Выбран лист «Китой» → точное/alias совпадение.
 */
export function matchLocationFilter(
  propertyDistrict: string | null | undefined,
  selectedName: string | null | undefined,
): boolean {
  if (!selectedName?.trim()) return true;
  if (!propertyDistrict?.trim()) return false;

  const selected = findNodesByName(selectedName);
  const propNorm = normalizeName(propertyDistrict);
  const selectedNorm = normalizeName(selectedName);

  if (selected.length === 0) {
    return propNorm === selectedNorm;
  }

  for (const node of selected) {
    const matchSet = getMatchNamesForNode(node.id);
    if (matchSet.has(propNorm)) return true;
  }

  return propNorm === selectedNorm;
}

export function findLocationByName(
  name: string,
  preferredParentId?: string | null,
): LocationNode | undefined {
  const hits = findNodesByName(name);
  if (!hits.length) return undefined;
  if (preferredParentId) {
    const under = hits.find((h) => {
      let cur: LocationNode | undefined = h;
      while (cur) {
        if (cur.id === preferredParentId || cur.parentId === preferredParentId)
          return true;
        cur = cur.parentId ? byId.get(cur.parentId) : undefined;
      }
      return false;
    });
    if (under) return under;
  }
  // Prefer deeper / more specific (settlement over city if same name rare)
  return (
    hits.find((h) => h.kind !== "city" && h.kind !== "region") ??
    hits.find((h) => h.kind === "city") ??
    hits[0]
  );
}

export function toPropertyLocationExtras(
  leaf: LocationNode,
): PropertyLocationExtras {
  const path = getPath(leaf.id);
  const region = path.find((n) => n.kind === "region")?.name ?? IRKUTSK_REGION_NAME;
  const cityNode =
    path.find((n) => n.kind === "city") ??
    path.find((n) => n.parentId === IRKUTSK_REGION_ID);
  const city = cityNode?.name ?? leaf.name;
  const locality =
    cityNode && leaf.id !== cityNode.id ? leaf.name : null;

  return {
    region,
    city,
    locality,
    kind: leaf.kind,
    path: path.map((n) => n.name),
    locationId: leaf.id,
  };
}

/** Лист для хранения: locality если есть, иначе city */
export function leafDistrictName(extras: PropertyLocationExtras): string {
  return extras.locality?.trim() || extras.city.trim();
}

export function inferLocationLeaf(
  addressOrDistrict: string | null | undefined,
  hintCity?: string | null,
): LocationNode | undefined {
  if (!addressOrDistrict?.trim() && !hintCity?.trim()) return undefined;
  const lower = normalizeName(addressOrDistrict ?? "");

  // Prefer longest name match; при равной длине — более глубокий узел (Китой > Ангарск)
  let best: LocationNode | undefined;
  let bestLen = 0;
  let bestDepth = -1;
  for (const n of IRKUTSK_LOCATION_NODES) {
    if (n.kind === "region") continue;
    const depth = getPath(n.id).length;
    const candidates = [n.name, ...(n.aliases ?? [])];
    for (const c of candidates) {
      const cn = normalizeName(c);
      if (cn.length < 3) continue;
      if (!lower.includes(cn)) continue;
      if (
        cn.length > bestLen ||
        (cn.length === bestLen && depth > bestDepth) ||
        (cn.length >= bestLen - 2 &&
          depth > bestDepth &&
          n.kind !== "city" &&
          best?.kind === "city")
      ) {
        best = n;
        bestLen = Math.max(bestLen, cn.length);
        bestDepth = depth;
      }
    }
  }

  if (hintCity?.trim()) {
    const cityNode = findLocationByName(hintCity);
    const preferredRoot =
      cityNode?.kind === "city"
        ? cityNode
        : cityNode?.parentId?.startsWith("city:")
          ? getLocationById(cityNode.parentId)
          : cityNode;

    if (preferredRoot) {
      if (
        best &&
        (best.parentId === preferredRoot.id || best.id === preferredRoot.id)
      ) {
        return best;
      }
      const childHit = getChildren(preferredRoot.id).find((ch) => {
        const names = [ch.name, ...(ch.aliases ?? [])];
        return names.some((nm) => lower.includes(normalizeName(nm)));
      });
      if (childHit) return childHit;
      // Не подменяем найденный по адресу город/лист хинтом из формы
      if (best) return best;
      if (preferredRoot.kind === "city") return preferredRoot;
    }
  }

  return best;
}

export function resolveLocationFromAddress(
  address: string | null | undefined,
  fallbackDistrict?: string | null,
): {
  leaf: LocationNode | undefined;
  extras: PropertyLocationExtras | null;
  district: string | null;
  lat?: number;
  lng?: number;
} {
  const leaf =
    inferLocationLeaf(address, fallbackDistrict) ??
    (fallbackDistrict ? findLocationByName(fallbackDistrict) : undefined);

  if (!leaf) {
    return {
      leaf: undefined,
      extras: null,
      district: fallbackDistrict?.trim() || null,
    };
  }

  const extras = toPropertyLocationExtras(leaf);
  return {
    leaf,
    extras,
    district: leafDistrictName(extras),
    lat: leaf.lat,
    lng: leaf.lng,
  };
}

export type FlatLocationOption = {
  id: string;
  name: string;
  kind: LocationKind;
  parentId: string | null;
  label: string;
  depth: number;
};

/** Плоский список для селектов / фильтров (город + locality с отступом) */
export function flattenForSelect(options?: {
  includeRayons?: boolean;
  citiesOnly?: boolean;
}): FlatLocationOption[] {
  const includeRayons = options?.includeRayons ?? true;
  const citiesOnly = options?.citiesOnly ?? false;
  const out: FlatLocationOption[] = [];

  const cities = getChildren(IRKUTSK_REGION_ID).filter((n) => {
    if (n.kind === "city") return true;
    if (includeRayons && n.kind === "district") return true;
    return false;
  });

  cities.sort((a, b) => a.name.localeCompare(b.name, "ru"));

  for (const c of cities) {
    out.push({
      id: c.id,
      name: c.name,
      kind: c.kind,
      parentId: c.parentId,
      label: c.name,
      depth: 0,
    });
    if (citiesOnly) continue;
    const kids = getChildren(c.id).slice().sort((a, b) =>
      a.name.localeCompare(b.name, "ru"),
    );
    for (const k of kids) {
      out.push({
        id: k.id,
        name: k.name,
        kind: k.kind,
        parentId: k.parentId,
        label: `${c.name} → ${k.name}`,
        depth: 1,
      });
    }
  }

  return out;
}

/** Имена для совместимости со старыми списками городов области */
export function getOblastCityNames(): string[] {
  return getCityNodes()
    .map((n) => n.name)
    .sort((a, b) => a.localeCompare(b, "ru"));
}

export function getIrkutskDistrictNames(): string[] {
  return getChildren("city:irkutsk")
    .filter((n) => n.kind === "district")
    .map((n) => n.name);
}

export function getIrkutskMicrodistrictNames(): string[] {
  return getChildren("city:irkutsk")
    .filter((n) => n.kind === "microdistrict")
    .map((n) => n.name);
}

export function centroidOf(nameOrId: string): { lat: number; lng: number } | null {
  const byIdHit = byId.get(nameOrId);
  const node = byIdHit ?? findLocationByName(nameOrId);
  if (node?.lat != null && node?.lng != null) {
    return { lat: node.lat, lng: node.lng };
  }
  return null;
}
