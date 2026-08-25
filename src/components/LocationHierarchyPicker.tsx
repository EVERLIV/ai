import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  findLocationByName,
  getChildren,
  getCityNodes,
  getLocationById,
  getPath,
  IRKUTSK_REGION_ID,
  IRKUTSK_REGION_NAME,
  leafDistrictName,
  toPropertyLocationExtras,
  type PropertyLocationExtras,
} from "@/lib/locations";
import { cn } from "@/lib/utils";

const CITY_NONE = "__city__";
const LOCALITY_CITY = "__city_as_leaf__";

export type LocationHierarchyChange = {
  district: string;
  location: PropertyLocationExtras;
  lat?: number;
  lng?: number;
};

type Props = {
  value: string;
  onChange: (next: LocationHierarchyChange) => void;
  label?: string;
  className?: string;
  /** Подставить центроид узла, если у объекта ещё нет координат */
  applyCentroid?: boolean;
  hasCoords?: boolean;
};

function resolveFromLeaf(leafName: string): LocationHierarchyChange | null {
  const leaf = findLocationByName(leafName);
  if (!leaf) return null;
  const extras = toPropertyLocationExtras(leaf);
  return {
    district: leafDistrictName(extras),
    location: extras,
    lat: leaf.lat,
    lng: leaf.lng,
  };
}

function cityIdFromValue(value: string): string | null {
  const leaf = findLocationByName(value);
  if (!leaf) return null;
  if (leaf.kind === "city") return leaf.id;
  if (leaf.parentId === IRKUTSK_REGION_ID) return leaf.id;
  if (leaf.parentId?.startsWith("city:")) return leaf.parentId;
  const path = getPath(leaf.id);
  return (
    path.find((n) => n.kind === "city")?.id ??
    path.find((n) => n.parentId === IRKUTSK_REGION_ID)?.id ??
    null
  );
}

function localityValueFromLeaf(value: string, cityId: string | null): string {
  const leaf = findLocationByName(value);
  if (!leaf || !cityId) return LOCALITY_CITY;
  if (leaf.id === cityId) return LOCALITY_CITY;
  if (leaf.parentId === cityId) return leaf.id;
  return LOCALITY_CITY;
}

export default function LocationHierarchyPicker({
  value,
  onChange,
  label = "Город / район",
  className,
  applyCentroid = true,
  hasCoords = false,
}: Props) {
  const cities = getCityNodes().sort((a, b) =>
    a.name.localeCompare(b.name, "ru"),
  );
  const rayons = getChildren(IRKUTSK_REGION_ID)
    .filter((n) => n.kind === "district" && n.id.startsWith("rayon:"))
    .sort((a, b) => a.name.localeCompare(b.name, "ru"));

  const cityId = cityIdFromValue(value);
  const localities = cityId
    ? getChildren(cityId).sort((a, b) => a.name.localeCompare(b.name, "ru"))
    : [];
  const localitySelect = localityValueFromLeaf(value, cityId);

  const emitNode = (nodeId: string) => {
    const node = getLocationById(nodeId);
    if (!node) return;
    const extras = toPropertyLocationExtras(node);
    const district = leafDistrictName(extras);
    onChange({
      district,
      location: extras,
      ...(applyCentroid && !hasCoords && node.lat != null && node.lng != null
        ? { lat: node.lat, lng: node.lng }
        : {}),
    });
  };

  const onCityChange = (nextCityId: string) => {
    if (nextCityId === CITY_NONE) return;
    emitNode(nextCityId);
  };

  const onLocalityChange = (nextLocalityId: string) => {
    if (!cityId) return;
    if (nextLocalityId === LOCALITY_CITY) {
      emitNode(cityId);
      return;
    }
    emitNode(nextLocalityId);
  };

  const known = Boolean(findLocationByName(value));

  return (
    <div className={cn("space-y-2", className)}>
      {label && <Label className="text-xs mb-1 block">{label}</Label>}
      <p className="text-[11px] text-muted-foreground">{IRKUTSK_REGION_NAME}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <div>
          <Label className="text-[11px] text-muted-foreground mb-1 block">
            Город
          </Label>
          <Select value={cityId ?? CITY_NONE} onValueChange={onCityChange}>
            <SelectTrigger className="h-9 text-sm bg-background">
              <SelectValue placeholder="Выберите город" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              {!known && value && (
                <SelectItem value={CITY_NONE}>{value}</SelectItem>
              )}
              {cities.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
              {rayons.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-[11px] text-muted-foreground mb-1 block">
            Район / село
          </Label>
          <Select
            value={localities.length ? localitySelect : LOCALITY_CITY}
            onValueChange={onLocalityChange}
            disabled={!cityId || localities.length === 0}
          >
            <SelectTrigger className="h-9 text-sm bg-background">
              <SelectValue placeholder="Весь город" />
            </SelectTrigger>
            <SelectContent className="max-h-72">
              <SelectItem value={LOCALITY_CITY}>Весь город</SelectItem>
              {localities.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

/** Хелпер: собрать change из имени листа (адрес / legacy) */
export function locationChangeFromDistrict(
  district: string,
): LocationHierarchyChange | null {
  return resolveFromLeaf(district);
}
