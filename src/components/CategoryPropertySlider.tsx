import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Maximize,
} from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import type { PropertySegment } from "@/config/propertySegments";
import { useProperties } from "@/hooks/useProperties";
import { buildCatalogUrl } from "@/lib/catalogLinks";
import {
  buildPropertyDisplayTitle,
  formatPropertyAddressShort,
} from "@/lib/propertyCard";
import { getPropertyCover } from "@/lib/propertyImages";
import {
  propertyMatchesSegment,
  propertyMatchesTypes,
} from "@/lib/propertyTypes";

interface Props {
  type: string;
  title?: string;
  segment?: PropertySegment;
}

export default function CategoryPropertySlider({
  type,
  title = "Объекты в каталоге",
  segment = "commercial",
}: Props) {
  const { data: allProperties, isLoading } = useProperties({ segment });
  const scrollRef = useRef<HTMLDivElement>(null);

  const properties =
    allProperties?.filter(
      (p) =>
        propertyMatchesSegment(p, segment) && propertyMatchesTypes(p, [type]),
    ) ?? [];

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 380;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  const fmt = (n: number) => n.toLocaleString("ru-RU");

  if (isLoading) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-display font-bold text-foreground mb-8">
            {title}
          </h2>
          <div className="flex gap-4 overflow-hidden sm:gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                className="min-w-[280px] h-[320px] rounded-xl sm:min-w-[350px]"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!properties.length) return null;

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
              {title}
            </h2>
            <p className="text-muted-foreground mt-1">
              {properties.length} объектов доступно
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => scroll("left")}
              className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-accent/10 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-accent/10 transition-colors"
            >
              <ChevronRight className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none" }}
        >
          {properties.map((p) => (
            <Link
              key={p.id}
              to={`/property/${p.id}`}
              className="group min-w-[280px] max-w-[280px] snap-start rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg transition-all duration-300 sm:min-w-[340px] sm:max-w-[340px]"
            >
              <div className="relative h-48 overflow-hidden bg-muted">
                <img
                  src={getPropertyCover(p.cover_photo, p.type)}
                  alt={p.address}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary text-primary-foreground">
                    {p.deal_type === "Продажа" ? "Продажа" : "Аренда"}
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-2">
                <div className="font-semibold text-sm text-foreground line-clamp-2 leading-snug">
                  {buildPropertyDisplayTitle(p)}
                </div>
                {formatPropertyAddressShort(p.address) && (
                  <div className="flex items-start gap-1.5 text-muted-foreground text-xs">
                    <MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span className="line-clamp-1 leading-snug">
                      {formatPropertyAddressShort(p.address)}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1 text-muted-foreground text-xs">
                  <Maximize className="w-3.5 h-3.5 shrink-0" />
                  <span className="shrink-0">{p.area} м²</span>
                  {p.district && (
                    <>
                      <span className="opacity-40">·</span>
                      <span className="truncate">{p.district}</span>
                    </>
                  )}
                </div>
                <div className="pt-1">
                  <span className="font-bold text-base text-foreground whitespace-nowrap">
                    {fmt(p.price)} ₽
                    {p.deal_type !== "Продажа" && (
                      <span className="text-sm font-normal text-muted-foreground">
                        /мес
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link to={buildCatalogUrl({ segment, types: type })}>
            <Button variant="outline" size="lg" className="gap-2">
              Смотреть все объекты
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
