import { ArrowRight, MapPin, Building2, Store, Warehouse, TreePine, KeyRound } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useProperties } from "@/hooks/useProperties";
import { getPropertyCover } from "@/lib/propertyImages";
import PropertyImage from "@/components/PropertyImage";

const typeIcons: Record<string, React.ElementType> = {
  "Офис": Building2,
  "Торговая": Store,
  "Склад": Warehouse,
  "Земля": TreePine,
  "Производство": Building2,
};

export default function RentSection() {
  const { ref, isVisible } = useScrollReveal();
  const { data: properties = [], isLoading } = useProperties();
  const navigate = useNavigate();

  const rentals = properties.filter((p) => p.deal_type === "Аренда").slice(0, 8);

  return (
    <section ref={ref} className="py-16 bg-background">
      <div
        className={`container mx-auto px-4 lg:px-8 ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}
      >
        <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
          <div>
            <p className="text-xs font-medium tracking-widest uppercase text-primary mb-2 inline-flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5" /> Аренда
            </p>
            <h2 className="font-display text-3xl font-bold text-foreground">
              Объекты в аренду
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Офисы, склады и торговые площади в Иркутске и области
            </p>
          </div>
          <Link
            to="/catalog?deal=rent"
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Все объекты в аренду <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-5 bg-muted rounded w-2/3" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : rentals.length === 0 ? (
          <div className="bg-card rounded-xl p-10 text-center text-sm text-muted-foreground">
            Сейчас нет активных предложений в аренду
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {rentals.map((p) => {
              const Icon = typeIcons[p.type] || Building2;
              return (
                <article
                  key={p.id}
                  onClick={() => navigate(`/property/${p.id}`)}
                  className="group bg-card rounded-xl overflow-hidden border border-border hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                >
                  <div className="relative aspect-[4/3] bg-muted overflow-hidden">
                    <PropertyImage
                      src={p.cover_photo || getPropertyCover(p.cover_photo, p.type)}
                      alt={p.address}
                      imgClassName="group-hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-background/90 backdrop-blur text-foreground text-[10px] font-semibold uppercase tracking-wide">
                      <Icon className="w-3 h-3" />
                      {p.type}
                    </span>
                  </div>
                  <div className="p-3">
                    <div className="font-display text-base font-bold text-foreground">
                      {Number(p.price).toLocaleString("ru-RU")} ₽
                      <span className="text-[11px] font-normal text-muted-foreground">/мес</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      {p.area} м² · Класс {p.class}
                    </div>
                    <div className="flex items-start gap-1 text-[11px] text-muted-foreground mt-2">
                      <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{p.address}</span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="sm:hidden mt-6 text-center">
          <Link
            to="/catalog?deal=rent"
            className="inline-flex items-center gap-1 text-sm font-medium text-primary"
          >
            Все объекты в аренду <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
