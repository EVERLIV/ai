import { Heart } from "lucide-react";
import { Link } from "react-router-dom";
import PropertyImage from "@/components/PropertyImage";
import type { DbProperty } from "@/hooks/useProperties";
import {
  buildPropertyDisplayTitle,
  formatPropertyAddressShort,
  formatPropertyPrice,
} from "@/lib/propertyCard";
import { getResidentialRooms } from "@/lib/propertyResidential";

interface Props {
  property: DbProperty;
}

/** Компактная карточка для mobile 2-col (референс Циан) */
export default function PropertyGridCardCompact({ property: p }: Props) {
  const price = formatPropertyPrice(p);
  const title = buildPropertyDisplayTitle(p);
  const address = formatPropertyAddressShort(p.address);
  const rooms = getResidentialRooms(p);
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
      className="group flex flex-col bg-card overflow-hidden"
    >
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        <PropertyImage
          src={p.cover_photo}
          alt={title}
          imgClassName="object-cover"
        />
        <span
          className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center bg-black/30 text-white"
          onClick={(e) => e.preventDefault()}
          aria-hidden
        >
          <Heart className="w-4 h-4" />
        </span>
      </div>
      <div className="pt-2 px-0.5 pb-1 space-y-0.5">
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
      </div>
    </Link>
  );
}
