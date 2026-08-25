export type LocationKind =
  | "region"
  | "city"
  | "district"
  | "microdistrict"
  | "settlement"
  | "village";

export type LocationNode = {
  id: string;
  name: string;
  kind: LocationKind;
  parentId: string | null;
  /** Центроид для карты / fallback координат */
  lat?: number;
  lng?: number;
  aliases?: string[];
};

/** Структурированная локация на объявлении (extras.location) */
export type PropertyLocationExtras = {
  region: string;
  city: string;
  /** Район города / село / мкр — лист, если глубже города */
  locality: string | null;
  kind: LocationKind;
  path: string[];
  locationId?: string;
};

export const LOCATION_EXTRAS_KEY = "location";

export const IRKUTSK_REGION_NAME = "Иркутская область";
export const IRKUTSK_REGION_ID = "region:irkutsk-oblast";
