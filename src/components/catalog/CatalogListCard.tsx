import { Clock, Eye, Landmark, Layers, Maximize2, Square } from "lucide-react";
import { forwardRef } from "react";
import { Link } from "react-router-dom";
import CatalogSellerLine from "@/components/catalog/CatalogSellerLine";
import PropertyImage from "@/components/PropertyImage";
import PropertySaveButton from "@/components/PropertySaveButton";
import VerifiedBadge from "@/components/VerifiedBadge";
import type { DbProperty } from "@/hooks/useProperties";
import {
  buildPropertyDisplayTitle,
  formatListingViews,
  formatPropertyAddressShort,
  formatPropertyPrice,
  isListingVerified,
} from "@/lib/propertyCard";
import { getLandUse, isAnyLand, LAND_TYPE_LABEL } from "@/lib/propertyLand";
import { cn } from "@/lib/utils";

interface Props {
  property: DbProperty;
  highlighted?: boolean;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
}

const CatalogListCard = forwardRef<HTMLElement, Props>(function CatalogListCard(
  { property: p, highlighted, onHoverStart, onHoverEnd },
  ref,
) {
  const land = isAnyLand(p);
  const landUse = getLandUse(p);
  const price = formatPropertyPrice(p);
  const title = buildPropertyDisplayTitle(p);
  const addressShort = formatPropertyAddressShort(p.address);
  const published = p.published_date
    ? new Date(p.published_date).toLocaleDateString("ru-RU")
    : null;

  return (
    <article
      ref={ref}
      data-property-id={p.id}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      className={cn(
        "border-b border-border/70 transition-colors",
        highlighted ? "bg-muted/40" : "hover:bg-muted/30",
      )}
    >
      <Link
        to={`/property/${p.id}`}
        className="group flex gap-4 py-3 sm:py-3.5 min-h-0"
      >
        <div className="relative hidden sm:block w-[200px] lg:w-[220px] shrink-0 aspect-[4/3] bg-muted overflow-hidden rounded-sm">
          <PropertyImage
            src={p.cover_photo}
            alt={title}
            variant="listing"
            imgClassName="transition-transform duration-500 group-hover:scale-[1.02] object-top"
          />
          <div className="absolute top-1.5 right-1.5 z-[1]">
            <PropertySaveButton
              propertyId={p.id}
              className="w-7 h-7 shadow-sm"
              iconClassName="w-3.5 h-3.5"
            />
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between gap-2 py-0.5">
          <div>
            <div className="flex items-start gap-3 sm:hidden mb-2">
              <div className="relative w-24 aspect-[4/3] shrink-0 overflow-hidden rounded-sm bg-muted">
                <PropertyImage
                  src={p.cover_photo}
                  alt={title}
                  variant="listing"
                  imgClassName="object-top"
                />
                <div className="absolute top-1 right-1 z-[1]">
                  <PropertySaveButton
                    propertyId={p.id}
                    className="w-6 h-6"
                    iconClassName="w-3 h-3"
                  />
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="price-display text-lg text-foreground">
                  {price ?? "По запросу"}
                </div>
                <span className="text-[11px] text-muted-foreground">
                  {p.deal_type || "Аренда"}
                </span>
              </div>
            </div>

            <div className="text-[15px] font-semibold text-foreground leading-snug flex items-center gap-1.5 flex-wrap group-hover:text-primary transition-colors">
              {title}
              {isListingVerified(p) && (
                <VerifiedBadge showLabel={false} className="shrink-0" />
              )}
            </div>
            {addressShort && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                {addressShort}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-foreground/90">
            <span className="inline-flex items-center gap-1">
              <Square className="w-3 h-3 text-muted-foreground shrink-0" />
              {p.area} м²
            </span>
            {land ? (
              landUse && (
                <span className="inline-flex items-center gap-1">
                  <Landmark className="w-3 h-3 text-muted-foreground shrink-0" />
                  {LAND_TYPE_LABEL}: {landUse}
                </span>
              )
            ) : (
              <>
                {p.floor && p.floor !== "-" && (
                  <span className="inline-flex items-center gap-1">
                    <Layers className="w-3 h-3 text-muted-foreground shrink-0" />
                    {p.floor}/{p.total_floors}
                  </span>
                )}
                {p.ceiling_height && Number(p.ceiling_height) > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Maximize2 className="w-3 h-3 text-muted-foreground shrink-0" />
                    {p.ceiling_height} м
                  </span>
                )}
                {p.condition && (
                  <span className="text-muted-foreground">{p.condition}</span>
                )}
              </>
            )}
          </div>

          <CatalogSellerLine
            extras={p.extras as Record<string, unknown> | null}
          />
        </div>

        <div className="hidden sm:flex flex-col items-end justify-between shrink-0 w-32 lg:w-36 pt-0.5">
          <div className="text-right">
            <div className="price-display text-xl text-foreground leading-none">
              {price ?? "По запросу"}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              {p.deal_type || "Аренда"}
            </div>
          </div>
          <div className="flex flex-col items-end gap-0.5 text-[10px] text-muted-foreground tabular-nums">
            <span className="inline-flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {formatListingViews(p.views_count)}
            </span>
            {published && (
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {published}
              </span>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
});

export default CatalogListCard;
