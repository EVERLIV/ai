import { loadYandexMaps, IRKUTSK_CENTER_LNGLAT } from "@/lib/yandexMaps";

type SearchFeature = {
  properties?: {
    name?: string;
    description?: string;
    address?: { formattedAddress?: string };
  };
  geometry?: {
    coordinates?: [number, number];
  };
};

const IRKUTSK_SEARCH = {
  center: IRKUTSK_CENTER_LNGLAT,
  span: [3, 3] as [number, number],
  type: ["toponyms"] as ("toponyms" | "businesses")[],
  limit: 1,
};

async function runSearch(
  options: Record<string, unknown>,
): Promise<{ lat: number; lng: number; address: string } | null> {
  const ymaps3 = await loadYandexMaps();
  if (typeof ymaps3.search !== "function") {
    throw new Error("Поиск в Яндекс Картах недоступен");
  }

  let results: SearchFeature[];
  try {
    results = await ymaps3.search({ ...IRKUTSK_SEARCH, ...options });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    throw new Error(`Яндекс не смог определить локацию: ${message}`);
  }

  const hit = results?.[0];
  const coords = hit?.geometry?.coordinates;
  if (!coords || coords.length < 2) return null;

  const [lng, lat] = coords;
  const address =
    hit?.properties?.address?.formattedAddress?.trim() ||
    hit?.properties?.name?.trim() ||
    hit?.properties?.description?.trim() ||
    "";

  return { lat, lng, address };
}

export async function geocodeAddress(
  address: string,
): Promise<{ lat: number; lng: number; address: string } | null> {
  const query = address.trim();
  if (query.length < 4) return null;
  return runSearch({ text: query });
}

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<{ lat: number; lng: number; address: string } | null> {
  return runSearch({ text: [lng, lat] });
}
