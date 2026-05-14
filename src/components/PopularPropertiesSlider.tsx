import { useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, MapPin, ArrowRight, TrendingUp } from "lucide-react";
import { useProperties } from "@/hooks/useProperties";
import PropertyImage from "@/components/PropertyImage";
import { getPropertyCover } from "@/lib/propertyImages";

const TYPE_LABELS: Record<string, string> = {
  "Офис": "Офис",
  "Торговая": "Торговля",
  "Склад": "Склад",
  "Земля": "Земля",
  "Производство": "Производство",
};

export default function PopularPropertiesSlider() {
  const { data: properties = [], isLoading } = useProperties();
  const scrollRef = useRef<HTMLDivElement>(null);

  const items = properties.slice(0, 10);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" });
  };

  return (
    <section className="py-14 bg-background border-b border-border">
      <div className="container mx-auto px-4 lg:px-8">

        <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
          <div>
            <p className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-1.5 inline-flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> Популярное
            </p>
            <h2 className="font-display text-2xl font-bold text-foreground">Актуальные предложения</h2>
            <p className="text-sm text-muted-foreground mt-1">Свежие объекты в каталоге</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1">
              <button
                onClick={() => scroll("left")}
                className="w-8 h-8 flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => scroll("right")}
                className="w-8 h-8 flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <Link
              to="/catalog"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Все объекты <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="flex gap-4 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="shrink-0 w-64 animate-pulse">
                <div className="aspect-[4/3] bg-muted" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-muted w-3/4" />
                  <div className="h-3 bg-muted w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm border border-border">
            Объекты появятся здесь после добавления в каталог
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
                className="group shrink-0 w-[260px] bg-card border border-border hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300"
                style={{ scrollSnapAlign: "start" }}
              >
                <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                  <PropertyImage
                    src={p.cover_photo || getPropertyCover(p.cover_photo, p.type)}
                    alt={p.address}
                    imgClassName="group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-background/90 backdrop-blur px-2 py-0.5">
                    <span className="text-[10px] font-semibold uppercase tracking-wide text-foreground">
                      {TYPE_LABELS[p.type] ?? p.type}
                    </span>
                  </div>
                  {p.deal_type && (
                    <div className={`absolute top-2 right-2 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                      p.deal_type === "Аренда" ? "bg-primary text-primary-foreground" : "bg-foreground text-background"
                    }`}>
                      {p.deal_type}
                    </div>
                  )}
                </div>

                <div className="p-3 space-y-1.5">
                  <div className="font-display text-base font-bold text-foreground leading-none">
                    {Number(p.price).toLocaleString("ru-RU")} ₽
                    <span className="text-[11px] font-normal text-muted-foreground">
                      {p.deal_type === "Аренда" ? "/мес" : ""}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {p.area} м² · Класс {p.class}
                  </div>
                  <div className="flex items-start gap-1 text-[11px] text-muted-foreground">
                    <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
                    <span className="line-clamp-1">{p.address}</span>
                  </div>
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
