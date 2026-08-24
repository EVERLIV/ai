import { Clock, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import ListingCategoryBadges from "@/components/ListingCategoryBadges";
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
import { getResidentialRooms } from "@/lib/propertyResidential";

interface Props {
  property: DbProperty;
}

/** Компактная карточка для mobile 2-col */
export default function PropertyGridCardCompact({ property: p }: Props) {
  const price = formatPropertyPrice(p);
  const title = buildPropertyDisplayTitle(p);
  const address = formatPropertyAddressShort(p.address);
  const rooms = getResidentialRooms(p);
  const activity = formatListingActivityDates(p);
  const floor =
    p.floor && p.floor !== "-"
      ? `${p.floor}${p.total_floors ? `/${p.total_floors}` : ""} этаж`
      : null;

  const specLine = [
    rooms ? `${rooms}-комн.` : p.type,
    p.area ? `${p.area} м²` : null,
    floor,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      to={`/property/${p.id}`}
      className="group flex flex-col h-full bg-card rounded-lg overflow-hidden"
    >
      <div className="relative aspect-[4/3] bg-muted overflow-hidden rounded-t-lg">
        <PropertyImage
          src={p.cover_photo}
          alt={title}
          imgClassName="object-cover"
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
        <span className="absolute bottom-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-black/45 text-[10px] text-white tabular-nums">
          <Eye className="w-3 h-3" /> {formatListingViews(p.views_count)}
        </span>
      </div>
      <div className="flex flex-col flex-1 px-3 pt-2.5 pb-3 gap-1">
        <p className="text-sm font-bold text-foreground leading-tight">
          {price ?? "Цена по запросу"}
        </p>
        {specLine && (
          <p className="text-[11px] text-muted-foreground leading-snug line-clamp-2">
            {specLine}
          </p>
        )}
        {address && (
          <p className="text-[10px] text-muted-foreground/80 line-clamp-2 leading-snug">
            {address}
          </p>
        )}
        {activity.line && (
          <p className="flex items-center gap-1 text-[10px] text-muted-foreground/80 tabular-nums">
            <Clock className="w-3 h-3 shrink-0" />
            <span className="truncate">{activity.line}</span>
          </p>
        )}
      </div>
    </Link>
  );
}
