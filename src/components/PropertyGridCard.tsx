import { Clock, Eye, Landmark, Layers, MapPin, Maximize2, Square } from "lucide-react";
import { Link } from "react-router-dom";
import ListingCategoryBadges from "@/components/ListingCategoryBadges";
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

  return (
    <Link
      to={`/property/${p.id}`}
      className="group flex flex-col h-full bg-card rounded-lg overflow-hidden"
    >
      <div className="relative aspect-[4/3] bg-muted overflow-hidden rounded-t-lg">
        <PropertyImage
          src={p.cover_photo}
          alt={title}
          imgClassName="transition-transform duration-500 group-hover:scale-[1.02]"
        />
        <ListingCategoryBadges type={p.type} dealType={p.deal_type} />
        <div className="absolute top-2 right-2 z-[1] flex flex-col gap-1">
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
        <div className="absolute bottom-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/45 text-[10px] text-white tabular-nums">
          <Eye className="w-3 h-3" /> {formatListingViews(p.views_count)}
        </div>
      </div>

      <div className="flex flex-col flex-1 px-3.5 pt-3 pb-3.5 gap-1.5">
        <div>
          <div className="price-display text-lg text-foreground leading-tight">
            {price ?? "По запросу"}
          </div>
          <div className="text-[11px] text-muted-foreground mt-0.5">
            {p.deal_type || "Аренда"}
          </div>
        </div>

        <h3 className="text-sm font-semibold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
          {title}
        </h3>

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
            {(p.features || []).slice(0, 3).map((feature) => (
              <span
                key={feature}
                className="px-1.5 py-0.5 rounded bg-muted text-[10px] text-muted-foreground"
              >
                {feature}
              </span>
            ))}
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
    <div className="bg-card overflow-hidden rounded-lg">
      <div className="relative aspect-[4/3] overflow-hidden rounded-t-lg">
        <Skeleton className="absolute inset-0 rounded-none" />
      </div>
      <div className="px-3.5 pt-3 pb-3.5 space-y-2">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}
