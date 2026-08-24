import { getYandexMapsApiKey, IRKUTSK_CENTER_LNGLAT } from "@/lib/yandexMaps";

export type GeoHit = { lat: number; lng: number; address: string };

function parseFeatureMembers(data: unknown): GeoHit[] {
  const root = data as {
    response?: {
      GeoObjectCollection?: {
        featureMember?: Array<{
          GeoObject?: {
            name?: string;
            description?: string;
            Point?: { pos?: string };
            metaDataProperty?: { GeocoderMetaData?: { text?: string } };
          };
        }>;
      };
    };
  };
  const members = root?.response?.GeoObjectCollection?.featureMember ?? [];
  const hits: GeoHit[] = [];

  for (const member of members) {
    const geo = member?.GeoObject;
    const parts = geo?.Point?.pos?.trim().split(/\s+/) ?? [];
    if (parts.length < 2) continue;
    const lng = Number(parts[0]);
    const lat = Number(parts[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const address =
      geo?.metaDataProperty?.GeocoderMetaData?.text?.trim() ||
      [geo?.name, geo?.description].filter(Boolean).join(", ").trim() ||
      "";
    if (!address) continue;
    hits.push({ lat, lng, address });
  }

  return hits;
}

async function geocodeQuery(geocode: string, results = 1): Promise<GeoHit[]> {
  const apiKey = getYandexMapsApiKey();
  if (!apiKey) throw new Error("Не задан ключ Яндекс.Карт");

  const [centerLng, centerLat] = IRKUTSK_CENTER_LNGLAT;
  const params = new URLSearchParams({
    apikey: apiKey,
    geocode,
    lang: "ru_RU",
    format: "json",
    results: String(results),
    ll: `${centerLng},${centerLat}`,
    spn: "8,8",
    bbox: "95.5,51.0,119.5,64.5",
  });

  const resp = await fetch(
    `https://geocode-maps.yandex.ru/1.x/?${params.toString()}`,
  );
  if (!resp.ok) {
    throw new Error(
      resp.status === 403
        ? "Яндекс отклонил ключ геокодера"
        : `Яндекс геокодер недоступен (${resp.status})`,
    );
  }

  const data = await resp.json();
  return parseFeatureMembers(data);
}

export async function geocodeAddress(address: string): Promise<GeoHit | null> {
  const query = address.trim();
  if (query.length < 4) return null;
  const hits = await geocodeQuery(query, 1);
  return hits[0] ?? null;
}

export async function reverseGeocode(
  lat: number,
  lng: number,
): Promise<GeoHit | null> {
  const hits = await geocodeQuery(`${lng},${lat}`, 1);
  return hits[0] ?? null;
}

/** Подсказки адреса с координатами (Иркутск и область) */
export async function suggestAddresses(
  query: string,
  limit = 7,
): Promise<GeoHit[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  const prefixed = /иркутск|ангарск|братск|шелехов|усолье|область/i.test(q)
    ? q
    : `Иркутск, ${q}`;

  try {
    const hits = await geocodeQuery(prefixed, limit);
    if (hits.length > 0) return hits;
  } catch {
    // fallback below
  }

  // запасной вариант без префикса
  return geocodeQuery(q, limit);
}
