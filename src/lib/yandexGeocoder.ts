import { getYandexMapsApiKey, IRKUTSK_CENTER_LNGLAT } from "@/lib/yandexMaps";

type GeoHit = { lat: number; lng: number; address: string };

function parseGeoResponse(data: unknown): GeoHit | null {
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
  const geo = root?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject;
  const parts = geo?.Point?.pos?.trim().split(/\s+/) ?? [];
  if (parts.length < 2) return null;
  const lng = Number(parts[0]);
  const lat = Number(parts[1]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  const address =
    geo?.metaDataProperty?.GeocoderMetaData?.text?.trim() ||
    [geo?.name, geo?.description].filter(Boolean).join(", ").trim() ||
    "";
  return { lat, lng, address };
}

async function geocodeQuery(geocode: string): Promise<GeoHit | null> {
  const apiKey = getYandexMapsApiKey();
  if (!apiKey) throw new Error("Не задан ключ Яндекс.Карт");

  const [centerLng, centerLat] = IRKUTSK_CENTER_LNGLAT;
  const params = new URLSearchParams({
    apikey: apiKey,
    geocode,
    lang: "ru_RU",
    format: "json",
    results: "1",
    ll: `${centerLng},${centerLat}`,
    spn: "6,6",
  });

  const resp = await fetch(`https://geocode-maps.yandex.ru/1.x/?${params.toString()}`);
  if (!resp.ok) {
    throw new Error(
      resp.status === 403
        ? "Яндекс отклонил ключ геокодера"
        : `Яндекс геокодер недоступен (${resp.status})`,
    );
  }

  const data = await resp.json();
  return parseGeoResponse(data);
}

export async function geocodeAddress(address: string): Promise<GeoHit | null> {
  const query = address.trim();
  if (query.length < 4) return null;
  return geocodeQuery(query);
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeoHit | null> {
  return geocodeQuery(`${lng},${lat}`);
}
