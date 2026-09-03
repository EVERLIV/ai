import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Home,
  MapPin,
} from "lucide-react";
import { useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import PropertyImage from "@/components/PropertyImage";
import { useProperties } from "@/hooks/useProperties";
import { buildCatalogUrl } from "@/lib/catalogLinks";
import {
  buildPropertyDisplayTitle,
  formatPropertyAddressShort,
} from "@/lib/propertyCard";
import { getPropertyCover } from "@/lib/propertyImages";
import { propertyMatchesTypes } from "@/lib/propertyTypes";

const HOME_TYPES = ["Дом", "Коттедж", "Дача", "Таунхаус"] as const;

export default function HomesGallerySection() {
  const { data: properties = [], isLoading } = useProperties({
    segment: "residential",
  });
  const scrollRef = useRef<HTMLDivElement>(null);

  const items = useMemo(
    () =>
      properties
        .filter((p) => propertyMatchesTypes(p, [...HOME_TYPES]))
        .slice(0, 12),
    [properties],
  );

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
  };

  const catalogHref = buildCatalogUrl({
    segment: "residential",
    types: [...HOME_TYPES],
  });

  return (
    <section className="py-14 bg-background border-b border-border/60">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
          <div>
            <p className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-1.5 inline-flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5" /> Жильё
            </p>
            <h2 className="font-display text-2xl font-bold text-foreground">
              Дома
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Дома, коттеджи и дачи в Иркутске и области
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1">
              <button
                type="button"
                onClick={() => scroll("left")}
                aria-label="Назад"
                className="w-8 h-8 flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scroll("right")}
                aria-label="Вперёд"
                className="w-8 h-8 flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <Link
              to={catalogHref}
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Все дома <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="shrink-0 w-[260px] animate-pulse">
                <div className="aspect-[4/3] rounded-lg bg-muted" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-muted w-3/4 rounded" />
                  <div className="h-3 bg-muted w-1/2 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm border border-border rounded-lg">
            Дома появятся здесь после публикации в каталоге
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {items.map((p) => (
              <Link
                key={p.id}
                to={`/property/${p.id}`}
                className="group shrink-0 w-[260px] bg-card rounded-lg overflow-hidden border border-border/50 hover:border-border hover:-translate-y-0.5 transition-all duration-300"
                style={{ scrollSnapAlign: "start" }}
              >
                <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                  <PropertyImage
                    src={
                      p.cover_photo || getPropertyCover(p.cover_photo, p.type)
                    }
                    alt={p.address}
                    imgClassName="group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 left-2 bg-background/90 backdrop-blur px-2 py-0.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-foreground">
                      {p.type}
                    </span>
                  </div>
                  {p.deal_type && (
                    <div
                      className={`absolute top-2 right-2 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                        p.deal_type === "Аренда" || p.deal_type === "Посуточно"
                          ? "bg-primary text-primary-foreground"
                          : "bg-foreground text-background"
                      }`}
                    >
                      {p.deal_type}
                    </div>
                  )}
                </div>

                <div className="px-3.5 pt-3 pb-3.5 space-y-1.5">
                  <div className="font-display text-base font-bold text-foreground leading-none">
                    {Number(p.price).toLocaleString("ru-RU")} ₽
                    <span className="text-[11px] font-normal text-muted-foreground">
                      {p.deal_type === "Аренда"
                        ? "/мес"
                        : p.deal_type === "Посуточно"
                          ? "/сутки"
                          : ""}
                    </span>
                  </div>
                  {Number(p.area) > 0 && (
                    <div className="text-[11px] text-muted-foreground">
                      {p.area} м²
                    </div>
                  )}
                  <div className="text-[11px] font-medium text-foreground line-clamp-2 leading-snug">
                    {buildPropertyDisplayTitle(p)}
                  </div>
                  {formatPropertyAddressShort(p.address) && (
                    <div className="flex items-start gap-1 text-[11px] text-muted-foreground">
                      <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">
                        {formatPropertyAddressShort(p.address)}
                      </span>
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </section>
  );
}
