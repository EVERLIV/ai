import { absoluteUrl } from "@/config/site";

/** Канонический URL страницы объекта на сайте. */
export function getPropertyPageUrl(propertyId: string): string {
  return absoluteUrl(`/property/${propertyId}`);
}

export function propertyQrFilename(
  propertyId: string,
  publicId?: string | null,
): string {
  const slug = publicId?.trim() || propertyId.slice(0, 8);
  return `qr-${slug}.png`;
}
