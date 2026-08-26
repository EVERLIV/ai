/** Ссылка на Яндекс.Карты по координатам или текстовому адресу. */
export function buildYandexMapsUrl(opts: {
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  zoom?: number;
}): string | null {
  const zoom = opts.zoom ?? 16;
  const lat = opts.lat != null ? Number(opts.lat) : NaN;
  const lng = opts.lng != null ? Number(opts.lng) : NaN;
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return `https://yandex.ru/maps/?ll=${lng},${lat}&z=${zoom}&pt=${lng},${lat},pm2rdm`;
  }
  const text = (opts.address || "").trim();
  if (!text) return null;
  return `https://yandex.ru/maps/?text=${encodeURIComponent(text)}`;
}
