import { Heart, ArrowRight, MapPin, Building2, Store, Warehouse, TreePine } from "lucide-react";
import { Link } from "react-router-dom";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProperties, type DbProperty } from "@/hooks/useProperties";
import PropertyImage from "@/components/PropertyImage";

const typeIcons: Record<string, React.ElementType> = {
  "Офис": Building2, "Торговая": Store, "Склад": Warehouse, "Земля": TreePine,
};

export default function PropertyGrid() {
  const { ref, isVisible } = useScrollReveal();
  const [saved, setSaved] = useState<string[]>([]);
  const navigate = useNavigate();
  const { data: properties = [], isLoading } = useProperties();

  const toggleSave = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSaved((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <section ref={ref} id="Офисы" className="py-16">
      <div className={`container mx-auto px-4 lg:px-8 ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}>
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl font-bold text-foreground">Актуальные объекты</h2>
            <p className="text-muted-foreground mt-1">Лучшие предложения на рынке</p>
          </div>
          <Link to="/catalog" className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Все объекты <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="bg-card rounded-2xl shadow-card overflow-hidden animate-pulse">
                <div className="h-48 bg-muted" />
                <div className="p-5 space-y-3">
                  <div className="h-6 bg-muted rounded w-1/2" />
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-10 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.slice(0, 6).map((p) => {
              const Icon = typeIcons[p.type] || Building2;
              return (
                <div
                  key={p.id}
                  onClick={() => navigate(`/property/${p.id}`)}
                  className="group bg-card rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-400 overflow-hidden hover:-translate-y-1 border-l-4 border-l-transparent hover:border-l-gold cursor-pointer"
                >
                  <div className="relative h-48 bg-muted overflow-hidden">
                    <PropertyImage
                      src={p.cover_photo}
                      alt={p.address}
                      imgClassName="transition-transform duration-500 group-hover:scale-[1.05]"
                    />
                    <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium z-10">
                      {p.type}
                    </span>
                    {p.class !== "-" && (
                      <span className="absolute top-3 right-3 px-2 py-1 rounded-full bg-card text-foreground text-xs font-medium shadow-card">
                        Класс {p.class}
                      </span>
                    )}
                  </div>

                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="min-w-0">
                        {Number(p.price) > 0 ? (
                          <>
                            <div className="text-xl font-bold text-foreground">
                              {Number(p.price).toLocaleString("ru-RU")} ₽
                              {p.deal_type === "Аренда" && <span className="text-sm font-normal text-muted-foreground">/мес</span>}
                            </div>
                            <div className="text-sm text-muted-foreground mt-0.5">{p.area} м²</div>
                          </>
                        ) : (
                          <div className="space-y-1.5">
                            <div className="text-sm text-muted-foreground">{p.area} м²</div>
                            <RequestPriceDialog propertyId={p.id} propertyAddress={p.address} />
                          </div>
                        )}
                      </div>
                      <button
                        onClick={(e) => toggleSave(p.id, e)}
                        className={`p-2 rounded-full transition-colors ${
                          saved.includes(p.id) ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-primary"
                        }`}
                      >
                        <Heart className="w-4 h-4" fill={saved.includes(p.id) ? "currentColor" : "none"} />
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      {p.address}
                    </div>

                    <button className="w-full py-2.5 rounded-lg text-sm font-medium text-primary border border-primary/20 hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                      Подробнее
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
