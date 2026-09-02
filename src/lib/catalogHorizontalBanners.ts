import ctaRentOutBg from "@/assets/cta-rent-out.jpg";
import type { CatalogHorizontalBannerItem } from "@/components/catalog/CatalogHorizontalBanner";
import type { PropertySegment } from "@/config/propertySegments";

export type CatalogBannerSlot = {
  id: string;
  segment: PropertySegment;
  /** После N-го объекта (0-based: 5 = после 6-й карточки) */
  afterIndex: number;
  banner: CatalogHorizontalBannerItem;
};

const COMMERCIAL_PLACEHOLDER_BANNER: CatalogHorizontalBannerItem = {
  id: "commercial-placeholder-1",
  placeholder: true,
  href: "/support",
  image: ctaRentOutBg,
  brand: "ДАДАТУТ",
  title: "Место доступно для размещения рекламы",
  subtitle: "Офисы, склады, торговля — коммерческий каталог",
  cta: "Разместить рекламу",
  footer: "Рекламное место в каталоге. Свяжитесь с нами для размещения.",
};

const COMMERCIAL_BANNER_SLOTS: CatalogBannerSlot[] = [
  {
    id: "commercial-slot-1",
    segment: "commercial",
    afterIndex: 5,
    banner: COMMERCIAL_PLACEHOLDER_BANNER,
  },
];

export function getCatalogHorizontalBannerSlots(
  segment: PropertySegment,
): CatalogBannerSlot[] {
  if (segment === "commercial") return COMMERCIAL_BANNER_SLOTS;
  return [];
}

/** Слоты, которые нужно показать сразу после объекта с индексом `propertyIndex`. */
export function getHorizontalBannersAfterPropertyIndex(
  segment: PropertySegment,
  propertyIndex: number,
): CatalogBannerSlot[] {
  return getCatalogHorizontalBannerSlots(segment).filter(
    (slot) => slot.afterIndex === propertyIndex,
  );
}

/** Fallback: если объектов мало и ни один слот не попал в ленту — показать в конце. */
export function getHorizontalBannerFallbackSlots(
  segment: PropertySegment,
  propertyCount: number,
  bannerInserted: boolean,
): CatalogBannerSlot[] {
  if (bannerInserted || propertyCount <= 0) return [];
  const slots = getCatalogHorizontalBannerSlots(segment);
  if (slots.length === 0) return [];
  const maxAfterIndex = Math.max(...slots.map((s) => s.afterIndex));
  if (propertyCount <= maxAfterIndex + 1) return slots;
  return [];
}
