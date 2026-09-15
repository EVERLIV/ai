import landImg from "@/assets/property-land.jpg";
import officeImg from "@/assets/property-office.jpg";
import productionImg from "@/assets/property-production.jpg";
import retailImg from "@/assets/property-retail.jpg";
import warehouseImg from "@/assets/property-warehouse.jpg";
import { publicStorageUrl } from "@/lib/storageUrl";

const TYPE_IMAGES: Record<string, string> = {
  Офис: officeImg,
  Торговая: retailImg,
  Склад: warehouseImg,
  Земля: landImg,
  Производство: productionImg,
};

/**
 * Returns a high-quality fallback photo for a property type.
 * Used when a property has no uploaded cover photo.
 */
export function getDefaultPropertyImage(
  type: string | null | undefined,
): string {
  if (!type) return officeImg;
  return TYPE_IMAGES[type] || officeImg;
}

/**
 * Cover для карточек каталога: cover_photo → photos[0] → null,
 * с нормализацией self-hosted Storage URL (/object/public/).
 */
export function resolvePropertyCoverSrc(
  cover: string | null | undefined,
  photos?: (string | null | undefined)[] | null,
): string | null {
  const candidates: string[] = [];
  if (cover?.trim()) candidates.push(cover.trim());
  if (Array.isArray(photos)) {
    for (const p of photos) {
      if (p?.trim()) candidates.push(p.trim());
    }
  }
  for (const raw of candidates) {
    const url = publicStorageUrl(raw);
    if (url) return url;
  }
  return null;
}

/**
 * Returns the cover photo if present, otherwise a type-based fallback.
 */
export function getPropertyCover(
  cover: string | null | undefined,
  type: string | null | undefined,
  photos?: (string | null | undefined)[] | null,
): string {
  return (
    resolvePropertyCoverSrc(cover, photos) || getDefaultPropertyImage(type)
  );
}
