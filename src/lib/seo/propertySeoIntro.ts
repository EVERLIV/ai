import { formatPriceShort } from "@/lib/seo/propertySeoTitle";
import { getPrimaryPropertyType } from "@/lib/propertyTypes";
import { SITE } from "@/config/site";

export type PropertySeoIntroInput = {
  deal_type?: string | null;
  type?: string | null;
  extras?: Record<string, unknown> | null;
  address?: string | null;
  district?: string | null;
  price?: number | null;
  area?: number | null;
  floor?: string | number | null;
  total_floors?: string | number | null;
  condition?: string | null;
  parking?: string | null;
};

/** Уникальный вводный абзац для индексации (видимый текст на странице объекта). */
export function buildPropertySeoIntro(p: PropertySeoIntroInput): string {
  const deal = (p.deal_type || "Аренда").trim();
  const type = getPrimaryPropertyType(p) || "объект";
  const area = Number(p.area) > 0 ? `${Number(p.area).toLocaleString("ru-RU")} м²` : "";
  const price = formatPriceShort(Number(p.price) || null, p.deal_type);
  const place =
    [p.district?.trim(), p.address?.trim()].filter(Boolean).join(", ") ||
    "Иркутске и области";

  const floorParts: string[] = [];
  if (p.floor && String(p.floor) !== "-") {
    const floors = p.total_floors ? ` из ${p.total_floors}` : "";
    floorParts.push(`этаж ${p.floor}${floors}`);
  }
  if (p.condition && p.condition !== "-" && p.condition !== "—") {
    floorParts.push(`состояние: ${p.condition}`);
  }
  if (p.parking && p.parking !== "-" && p.parking !== "—") {
    floorParts.push(`парковка: ${p.parking}`);
  }

  const extras = floorParts.length ? ` ${floorParts.join(", ")}.` : "";

  return `${deal} — ${type.toLowerCase()}${area ? ` ${area}` : ""} в ${place}. Цена: ${price}.${extras} ${SITE.tagline} Объявление на ДАДА ТУТ!`;
}
