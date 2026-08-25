import { Clock, Eye, Landmark, Layers, Maximize2, Square } from "lucide-react";
import { forwardRef } from "react";
import { Link } from "react-router-dom";
import ListingCategoryBadges from "@/components/ListingCategoryBadges";
import ListingVideoBadge from "@/components/catalog/ListingVideoBadge";
import NewbuildCardMeta from "@/components/catalog/NewbuildCardMeta";
import PropertyCompareButton from "@/components/PropertyCompareButton";
import PropertyImage from "@/components/PropertyImage";
import PropertySaveButton from "@/components/PropertySaveButton";
import type { DbProperty } from "@/hooks/useProperties";
import {
  buildPropertyDisplayTitle,
  formatListingActivityDates,
  formatListingViews,
  formatPropertyAddressShort,
  formatPropertyPrice,
} from "@/lib/propertyCard";
import { getLandUse, isAnyLand, LAND_TYPE_LABEL } from "@/lib/propertyLand";
import {
  getNewbuildPhotoBadges,
  isNewbuildListing,
  propertyHasVideo,
} from "@/lib/propertyNewbuildCard";
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
  const activity = formatListingActivityDates(p);
  const hasVideo = propertyHasVideo(p.extras);
  const photoBadges = getNewbuildPhotoBadges(p);
  const newbuild = isNewbuildListing(p) || !!p.developer_id;

  return (
    <article
      ref={ref}
      data-property-id={p.id}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
      className={cn(
        "rounded-xl px-3 sm:px-4 transition-[background-color,box-shadow] duration-200",
        highlighted
          ? "bg-muted/50 shadow-[var(--shadow-card)]"
          : "hover:bg-muted/40 hover:shadow-[var(--shadow-card)]",
      )}
    >
      <Link
        to={`/property/${p.id}`}
        className="group flex gap-3 sm:gap-4 py-3 sm:py-3.5 min-h-0"
      >
        <div className="relative hidden sm:block w-[200px] lg:w-[220px] shrink-0 aspect-[4/3] bg-muted overflow-hidden rounded-lg">
          <PropertyImage
            src={p.cover_photo}
            alt={title}
            variant="listing"
            imgClassName="transition-transform duration-500 group-hover:scale-[1.02] object-top"
          />
          {photoBadges.length > 0 ? (
            <div className="absolute top-2 left-2 z-[1] flex flex-wrap gap-1 max-w-[75%]">
              {photoBadges.map((label) => (
                <span
                  key={label}
                  className="px-1.5 py-0.5 rounded-md bg-foreground/85 text-[10px] font-medium text-background"
                >
                  {label}
                </span>
              ))}
            </div>
          ) : (
            <ListingCategoryBadges type={p.type} dealType={p.deal_type} />
          )}
          {hasVideo && (
            <ListingVideoBadge className="absolute top-1.5 right-1.5" />
          )}
          <div
            className={cn(
              "absolute z-[1] flex flex-col gap-1",
              hasVideo ? "top-11 right-1.5" : "top-1.5 right-1.5",
            )}
          >
            <PropertySaveButton
              propertyId={p.id}
              className="w-7 h-7 shadow-sm"
              iconClassName="w-3.5 h-3.5"
            />
            <PropertyCompareButton
              property={p}
              className="w-7 h-7 shadow-sm"
              iconClassName="w-3.5 h-3.5"
            />
          </div>
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-between gap-2 py-0.5 pr-0.5">
          <div>
            <div className="flex items-start gap-3 sm:hidden mb-2">
              <div className="relative w-24 aspect-[4/3] shrink-0 overflow-hidden rounded-lg bg-muted">
                <PropertyImage
                  src={p.cover_photo}
                  alt={title}
                  variant="listing"
                  imgClassName="object-top"
                />
                <ListingCategoryBadges
                  type={p.type}
                  dealType={p.deal_type}
                  className="top-1 left-1 scale-90 origin-top-left"
                />
                {hasVideo && (
                  <ListingVideoBadge className="absolute bottom-1 left-1 w-6 h-6" />
                )}
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="price-display text-lg text-foreground">
                      {price ?? "По запросу"}
                    </div>
                    <span className="text-[11px] text-muted-foreground">
                      {p.deal_type || "Аренда"}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    <PropertySaveButton
                      propertyId={p.id}
                      className="w-8 h-8"
                      iconClassName="w-3.5 h-3.5"
                    />
                    <PropertyCompareButton
                      property={p}
                      className="w-8 h-8"
                      iconClassName="w-3.5 h-3.5"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="text-[15px] font-semibold text-foreground leading-snug group-hover:text-primary transition-colors">
              {title}
            </div>
            {addressShort && (
              <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                {addressShort}
              </p>
            )}
            <NewbuildCardMeta
              property={p}
              variant="list"
              className="mt-2"
            />
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
                {p.condition && !newbuild && (
                  <span className="text-muted-foreground">{p.condition}</span>
                )}
              </>
            )}
          </div>

          {(p.features || []).length > 0 && (
            <div className="flex flex-wrap gap-1">
              {(p.features || []).slice(0, 3).map((feature) => (
                <span
                  key={feature}
                  className="px-1.5 py-0.5 rounded-md bg-muted text-[10px] text-muted-foreground max-w-[11rem] truncate"
                >
                  {feature}
                </span>
              ))}
            </div>
          )}

          <div className="sm:hidden flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] text-muted-foreground tabular-nums pt-0.5">
            <span className="inline-flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {formatListingViews(p.views_count)}
            </span>
            {activity.line && (
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {activity.line}
              </span>
            )}
          </div>
        </div>

        <div
          className={cn(
            "hidden sm:flex flex-col justify-between shrink-0 pt-0.5 pl-1",
            newbuild ? "w-36 lg:w-44 items-stretch" : "w-32 lg:w-40 items-end",
          )}
        >
          <div className={cn(newbuild ? "text-left" : "text-right")}>
            <div className="price-display text-xl text-foreground leading-none">
              {price ?? "По запросу"}
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              {p.deal_type || "Аренда"}
            </div>
          </div>
          {newbuild && (
            <NewbuildCardMeta
              property={p}
              variant="developer"
              className="my-2"
            />
          )}
          <div
            className={cn(
              "flex flex-col gap-0.5 text-[10px] text-muted-foreground tabular-nums",
              newbuild ? "items-start" : "items-end",
            )}
          >
            <span className="inline-flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {formatListingViews(p.views_count)}
            </span>
            {activity.addedLabel && (
              <span className="inline-flex items-center gap-1" title="Добавлен">
                <Clock className="w-3 h-3" />
                {activity.addedLabel}
              </span>
            )}
            {activity.updatedLabel && (
              <span title="Обновлён">обн. {activity.updatedLabel}</span>
            )}
          </div>
        </div>
      </Link>
    </article>
  );
});

export default CatalogListCard;
