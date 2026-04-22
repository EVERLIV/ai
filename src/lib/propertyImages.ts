import officeImg from "@/assets/property-office.jpg";
import retailImg from "@/assets/property-retail.jpg";
import warehouseImg from "@/assets/property-warehouse.jpg";
import landImg from "@/assets/property-land.jpg";
import productionImg from "@/assets/property-production.jpg";

const TYPE_IMAGES: Record<string, string> = {
  "Офис": officeImg,
  "Торговая": retailImg,
  "Склад": warehouseImg,
  "Земля": landImg,
  "Производство": productionImg,
};

/**
 * Returns a high-quality fallback photo for a property type.
 * Used when a property has no uploaded cover photo.
 */
export function getDefaultPropertyImage(type: string | null | undefined): string {
  if (!type) return officeImg;
  return TYPE_IMAGES[type] || officeImg;
}

/**
 * Returns the cover photo if present, otherwise a type-based fallback.
 */
export function getPropertyCover(cover: string | null | undefined, type: string | null | undefined): string {
  if (cover && cover.trim().length > 0) return cover;
  return getDefaultPropertyImage(type);
}
