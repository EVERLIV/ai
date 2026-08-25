import { Link } from "react-router-dom";
import ctaRentOutBg from "@/assets/cta-rent-out.jpg";
import residentialBannerDomnd from "@/assets/residential-banner-domnd.png";
import residentialBannerFree from "@/assets/residential-banner-free.jpg";
import type { PropertySegment } from "@/config/propertySegments";
import { listPropertyPath } from "@/lib/listPropertyLinks";
import { cn } from "@/lib/utils";

export type CatalogPromoItem = {
  id: string;
  href: string;
  external?: boolean;
  image: string;
  badge: string;
  title: string;
  subtitle: string;
  cta: string;
  footer?: string;
};

/** Рекламные и CTA-карточки в сетке каталога — один дизайн с партнёрскими баннерами. */
export function getCatalogPromos(
  segment: PropertySegment = "commercial",
): CatalogPromoItem[] {
  const isResidential = segment === "residential";
  const isLand = segment === "land";
  const listFree = listPropertyPath(segment, "rent");
  const listManage = listPropertyPath(segment, "management");

  const listingFree: CatalogPromoItem = {
    id: "list-free",
    href: listFree,
    image: residentialBannerFree,
    badge: "Бесплатно",
    title: isLand
      ? "Разместите участок за 0 ₽"
      : isResidential
        ? "Разместите жильё за 0 ₽"
        : "Разместите объект за 0 ₽",
    subtitle: isLand
      ? "Земля и участки — объявление в каталоге бесплатно"
      : isResidential
        ? "Квартира, дом или комната — в каталоге без оплаты"
        : "Офис, склад или торговля — объявление в каталоге бесплатно",
    cta: "Разместить",
    footer: "АрендаСити · для собственников",
  };

  const listingManage: CatalogPromoItem = {
    id: "list-manage",
    href: listManage,
    image: ctaRentOutBg,
    badge: "Управление",
    title: "Сдайте объект за 14 дней",
    subtitle: "Презентация, показы и сделка с проверенными арендаторами",
    cta: "Оставить заявку",
    footer: "АрендаСити · управление",
  };

  const partnerDomnd: CatalogPromoItem = {
    id: "partner-domnd",
    href: "https://domnd.ru/",
    external: true,
    image: residentialBannerDomnd,
    badge: "Партнёр",
    title: "Строительство деревянных домов и бань под ключ",
    subtitle: "в Иркутске и Иркутской области",
    cta: "Перейти",
    footer: "ООО «СК «Надёжный дом»",
  };

  if (isResidential) {
    return [listingFree, partnerDomnd, listingManage];
  }
  return [listingFree, listingManage, partnerDomnd];
}

/** Стабильный выбор промо по индексу слота и дню — без «прыжков» при каждом рендере. */
export function pickCatalogPromo(
  promos: CatalogPromoItem[],
  slotIndex: number,
): CatalogPromoItem {
  if (promos.length === 0) {
    return {
      id: "fallback",
      href: "/list-property?mode=rent",
      image: residentialBannerFree,
      badge: "Бесплатно",
      title: "Разместите объявление за 0 ₽",
      subtitle: "В каталоге АрендаСити",
      cta: "Разместить",
    };
  }
  const daySeed = Math.floor(Date.now() / 86_400_000);
  return promos[(daySeed + slotIndex) % promos.length];
}

type CatalogPromoBannerProps = {
  promo: CatalogPromoItem;
  className?: string;
  compact?: boolean;
};

export default function CatalogPromoBanner({
  promo,
  className,
  compact = false,
}: CatalogPromoBannerProps) {
  const content = (
    <>
      <img
        src={promo.image}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,12,20,0.12)_0%,rgba(8,12,20,0.82)_100%)]" />
      <div className="absolute left-4 top-4 z-10">
        <span className="inline-flex rounded bg-black/45 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/90 backdrop-blur-sm">
          {promo.badge}
        </span>
      </div>
      <div
        className={cn(
          "relative mt-auto flex flex-col text-white",
          compact ? "p-4" : "p-5",
        )}
      >
        <h3
          className={cn(
            "font-display font-bold leading-snug",
            compact ? "text-base" : "text-xl",
          )}
        >
          {promo.title}
        </h3>
        <p className="mt-1.5 text-xs text-white/78">{promo.subtitle}</p>
        <span className="mt-4 inline-flex h-10 w-fit items-center justify-center rounded-md bg-primary px-4 text-xs font-bold text-primary-foreground transition-colors group-hover:bg-primary/90">
          {promo.cta}
        </span>
        {promo.footer && (
          <p className="mt-3 text-[10px] leading-tight text-white/55">
            {promo.footer}
          </p>
        )}
      </div>
    </>
  );

  const shellClass = cn(
    "group relative flex flex-col h-full min-h-[220px] sm:min-h-[280px] lg:min-h-[320px] rounded-xl overflow-hidden shadow-[var(--shadow-card)]",
    className,
  );

  if (promo.external) {
    return (
      <a
        href={promo.href}
        target="_blank"
        rel="noopener noreferrer"
        className={shellClass}
      >
        {content}
      </a>
    );
  }

  return (
    <Link to={promo.href} className={shellClass}>
      {content}
    </Link>
  );
}
