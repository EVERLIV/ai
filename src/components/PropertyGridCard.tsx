import { Clock, Eye, Landmark, Layers, MapPin, Maximize2, Square } from "lucide-react";
import { Link } from "react-router-dom";
import ListingCategoryBadges from "@/components/ListingCategoryBadges";
import ListingVideoBadge from "@/components/catalog/ListingVideoBadge";
import NewbuildCardMeta from "@/components/catalog/NewbuildCardMeta";
import PropertyCompareButton from "@/components/PropertyCompareButton";
import PropertyImage from "@/components/PropertyImage";
import PropertySaveButton from "@/components/PropertySaveButton";
import { Skeleton } from "@/components/ui/skeleton";
import type { DbProperty } from "@/hooks/useProperties";
import {
  buildPropertyDisplayTitle,
  formatListingActivityDates,
  formatListingViews,
  formatPropertyAddressShort,
  formatPropertyPrice,
} from "@/lib/propertyCard";
import { getLandUse, isAnyLand } from "@/lib/propertyLand";
import {
  getNewbuildPhotoBadges,
  propertyHasVideo,
} from "@/lib/propertyNewbuildCard";

interface PropertyGridCardProps {
  property: DbProperty;
}

/** Карточка объекта в сетке каталога и на главной — плотный агрегаторный стиль. */
export default function PropertyGridCard({
  property: p,
}: PropertyGridCardProps) {
  const land = isAnyLand(p);
  const landUse = getLandUse(p);
  const price = formatPropertyPrice(p);
  const title = buildPropertyDisplayTitle(p);
  const addressShort = formatPropertyAddressShort(p.address);
  const activity = formatListingActivityDates(p);
  const hasVideo = propertyHasVideo(p.extras);
  const photoBadges = getNewbuildPhotoBadges(p);

  return (
    <Link
      to={`/property/${p.id}`}
      className="group flex flex-col h-full min-w-0 w-full bg-card rounded-xl overflow-hidden shadow-[var(--shadow-card)] transition-[box-shadow,transform] duration-200 hover:shadow-[var(--shadow-card-hover)] active:scale-[0.995]"
    >
      <div className="relative aspect-[16/10] sm:aspect-[4/3] bg-muted overflow-hidden shrink-0">
        <PropertyImage
          src={p.cover_photo}
          alt={title}
          imgClassName="transition-transform duration-500 group-hover:scale-[1.02]"
        />
        <ListingCategoryBadges type={p.type} dealType={p.deal_type} />
        {photoBadges.length > 0 && (
          <div className="absolute top-9 left-2 z-[1] hidden sm:flex flex-wrap gap-1 max-w-[70%]">
            {photoBadges.map((label) => (
              <span
                key={label}
                className="px-1.5 py-0.5 rounded-md bg-foreground/85 text-[10px] font-medium text-background"
              >
                {label}
              </span>
            ))}
          </div>
        )}
        <div className="absolute top-2 right-2 z-[1] hidden sm:flex flex-col gap-1">
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
          {hasVideo && <ListingVideoBadge />}
        </div>
        {hasVideo && (
          <ListingVideoBadge className="absolute sm:hidden bottom-2 left-2" />
        )}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/45 text-[10px] text-white tabular-nums">
          <Eye className="w-3 h-3" /> {formatListingViews(p.views_count)}
        </div>
      </div>

      <div className="flex flex-col flex-1 px-3 sm:px-3.5 pt-2.5 sm:pt-3 pb-3 sm:pb-3.5 gap-1 sm:gap-1.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="price-display text-base sm:text-lg text-foreground leading-tight">
              {price ?? "По запросу"}
            </div>
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {p.deal_type || "Аренда"}
            </div>
          </div>
          <div className="flex sm:hidden items-center gap-1 shrink-0 -mt-0.5">
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

        <h3 className="text-sm font-semibold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2 break-words">
          {title}
        </h3>

        <NewbuildCardMeta property={p} variant="grid" />

        {addressShort && (
          <p className="text-[11px] text-muted-foreground leading-snug line-clamp-1 flex items-center gap-1">
            <MapPin className="w-3 h-3 shrink-0" />
            <span className="truncate">{addressShort}</span>
          </p>
        )}

        <div className="flex flex-wrap gap-x-2.5 gap-y-0.5 text-[11px] text-foreground/90 pt-0.5">
          <span className="inline-flex items-center gap-1">
            <Square className="w-3 h-3 text-muted-foreground shrink-0" />
            {p.area} м²
          </span>
          {land ? (
            landUse && (
              <span className="inline-flex items-center gap-1 truncate">
                <Landmark className="w-3 h-3 text-muted-foreground shrink-0" />
                {landUse}
              </span>
            )
          ) : (
            <>
              {p.floor && p.floor !== "-" && (
                <span className="inline-flex items-center gap-1">
                  <Layers className="w-3 h-3 text-muted-foreground shrink-0" />
                  {p.floor}
                  {p.total_floors ? `/${p.total_floors}` : ""}
                </span>
              )}
              {p.ceiling_height && Number(p.ceiling_height) > 0 && (
                <span className="inline-flex items-center gap-1">
                  <Maximize2 className="w-3 h-3 text-muted-foreground shrink-0" />
                  {p.ceiling_height} м
                </span>
              )}
            </>
          )}
        </div>

        {(p.features || []).length > 0 && (
          <div className="flex flex-wrap gap-1 pt-0.5">
            {(p.features || []).slice(0, 2).map((feature) => (
              <span
                key={feature}
                className="px-1.5 py-0.5 rounded-md bg-muted text-[10px] text-muted-foreground max-w-[9.5rem] truncate sm:max-w-[11rem]"
              >
                {feature}
              </span>
            ))}
            {(p.features || []).length > 2 && (
              <span className="px-1.5 py-0.5 rounded-md bg-muted text-[10px] text-muted-foreground">
                +{(p.features || []).length - 2}
              </span>
            )}
          </div>
        )}

        {activity.line && (
          <p className="flex items-center gap-1 text-[10px] text-muted-foreground tabular-nums pt-0.5 mt-auto">
            <Clock className="w-3 h-3 shrink-0" />
            <span className="truncate">{activity.line}</span>
          </p>
        )}
      </div>
    </Link>
  );
}

export function PropertyGridCardSkeleton() {
  return (
    <div className="bg-card overflow-hidden rounded-xl shadow-[var(--shadow-card)]">
      <div className="relative aspect-[16/10] sm:aspect-[4/3] overflow-hidden">
        <Skeleton className="absolute inset-0 rounded-none" />
      </div>
      <div className="px-3 sm:px-3.5 pt-2.5 sm:pt-3 pb-3 sm:pb-3.5 space-y-2">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}
