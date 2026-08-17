import { Link } from "react-router-dom";
import { Eye, Square, Layers, Maximize2, Landmark, MapPin } from "lucide-react";
import type { DbProperty } from "@/hooks/useProperties";
import PropertyImage from "@/components/PropertyImage";
import VerifiedBadge from "@/components/VerifiedBadge";
import ListingAgentFooter from "@/components/ListingAgentFooter";
import { Skeleton } from "@/components/ui/skeleton";
import { formatPropertyPrice, formatListingViews, isListingVerified, buildPropertyDisplayTitle, formatPropertyAddressShort } from "@/lib/propertyCard";
import { getLandCadastral, getLandUse, isLandProperty, LAND_TYPE_LABEL } from "@/lib/propertyLand";

interface PropertyGridCardProps {
  property: DbProperty;
  onOpenPKK?: (cadastral: string) => void;
}

/** Карточка объекта в сетке каталога и на главной. */
export default function PropertyGridCard({ property: p, onOpenPKK }: PropertyGridCardProps) {
  const land = isLandProperty(p);
  const landUse = getLandUse(p);
  const cadastral = getLandCadastral(p.extras as Record<string, unknown> | null);
  const price = formatPropertyPrice(p);
  const title = buildPropertyDisplayTitle(p);
  const addressShort = formatPropertyAddressShort(p.address);
  const description = p.description?.slice(0, 200) || "";

  return (
    <Link
      to={`/property/${p.id}`}
      className="group flex flex-col h-full bg-card border border-border/60 rounded-lg overflow-hidden hover:shadow-lg hover:border-border transition-all duration-200"
    >
      <div className="relative h-44 bg-muted overflow-hidden">
        <PropertyImage src={p.cover_photo} alt={title} imgClassName="transition-transform duration-500 group-hover:scale-[1.04]" />
        <div className="absolute top-2.5 left-2.5 inline-block px-2 py-1 rounded-md bg-primary/90 text-primary-foreground text-[10px] font-bold">
          {p.deal_type || "Аренда"}
        </div>
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded bg-black/50 backdrop-blur text-[10px] text-white">
          <Eye className="w-3 h-3" /> {formatListingViews(p.views_count)}
        </div>
        <div className="absolute bottom-0 left-0">
          <span className="inline-block bg-primary text-primary-foreground text-sm font-bold px-3 py-1.5 leading-none">
            {price ?? "Цена по запросу"}
          </span>
        </div>
      </div>

      <div className="flex flex-col flex-1 p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-bold text-foreground leading-snug group-hover:text-primary transition-colors flex-1">
            {title}
          </h3>
          {isListingVerified(p) && <VerifiedBadge showLabel={false} className="shrink-0" />}
        </div>

        {addressShort && (
          <p className="text-[10px] text-muted-foreground mb-2 leading-relaxed line-clamp-2 flex items-start gap-1">
            <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
            <span>{addressShort}</span>
          </p>
        )}

        {description && (
          <p className="text-[10px] text-muted-foreground mb-3 leading-relaxed line-clamp-3">
            {description}
          </p>
        )}

        <div className="grid grid-cols-3 gap-3 pb-3">
          <div className="min-w-0 flex items-start gap-2">
            <Square className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground mb-0.5">Площадь</p>
              <p className="text-xs font-semibold text-foreground truncate">{p.area} м²</p>
            </div>
          </div>
          {land ? (
            <div className="col-span-2 min-w-0 flex items-start gap-2">
              <Landmark className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground mb-0.5">{LAND_TYPE_LABEL}</p>
                <p className="text-xs font-semibold text-foreground truncate">{landUse || "—"}</p>
              </div>
            </div>
          ) : (
            <>
              <div className="min-w-0 flex items-start gap-2">
                <Layers className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Этаж</p>
                  <p className="text-xs font-semibold text-foreground truncate">
                    {p.floor && p.floor !== "-" ? `${p.floor}${p.total_floors ? `/${p.total_floors}` : ""}` : "—"}
                  </p>
                </div>
              </div>
              <div className="min-w-0 flex items-start gap-2">
                <Maximize2 className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground mb-0.5">Потолок</p>
                  <p className="text-xs font-semibold text-foreground truncate">
                    {p.ceiling_height && Number(p.ceiling_height) > 0 ? `${p.ceiling_height} м` : "—"}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {(p.features || []).length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {(p.features || []).slice(0, 4).map((feature) => (
              <span key={feature} className="px-2 py-0.5 rounded bg-muted text-[10px] text-muted-foreground">
                {feature}
              </span>
            ))}
            {(p.features || []).length > 4 && (
              <span className="px-2 py-0.5 rounded bg-primary/10 text-[10px] text-primary font-medium">
                +{(p.features || []).length - 4}
              </span>
            )}
          </div>
        )}

        <ListingAgentFooter
          extras={p.extras as Record<string, unknown> | null}
          district={land && cadastral ? undefined : p.district}
          trailing={
            land && cadastral && onOpenPKK ? (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  onOpenPKK(cadastral);
                }}
                className="text-[10px] text-muted-foreground hover:text-primary transition-colors whitespace-nowrap"
              >
                к/н {cadastral}
              </button>
            ) : undefined
          }
        />
      </div>
    </Link>
  );
}

export function PropertyGridCardSkeleton() {
  return (
    <div className="bg-card overflow-hidden border border-border/60 rounded-lg">
      <div className="relative h-44 overflow-hidden">
        <Skeleton className="absolute inset-0 rounded-none" />
        <div className="absolute bottom-0 left-0">
          <Skeleton className="h-7 w-28 rounded-none" />
        </div>
      </div>
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
        </div>
        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <div className="flex-1 space-y-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-2 w-32" />
          </div>
        </div>
      </div>
    </div>
  );
}
