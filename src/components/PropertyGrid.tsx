import { Heart, ArrowRight, Building2, Store, Warehouse, TreePine, MapPin } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useState } from "react";

const properties = [
  { id: 1, type: "Офис", class: "A", area: 120, price: 180000, address: "Москва, Пресненская наб., 10", icon: Building2 },
  { id: 2, type: "Торговая", class: "B", area: 85, price: 250000, address: "Москва, ул. Тверская, 22", icon: Store },
  { id: 3, type: "Склад", class: "B", area: 450, price: 135000, address: "Москва, Дмитровское ш., 163", icon: Warehouse },
  { id: 4, type: "Офис", class: "A", area: 200, price: 320000, address: "Москва, Ленинский пр-т, 15", icon: Building2 },
  { id: 5, type: "Земля", class: "-", area: 1200, price: 95000, address: "МО, Одинцовский р-н, д. Жуковка", icon: TreePine },
  { id: 6, type: "Торговая", class: "A", area: 310, price: 480000, address: "Москва, Кутузовский пр-т, 48", icon: Store },
];

export default function PropertyGrid() {
  const { ref, isVisible } = useScrollReveal();
  const [saved, setSaved] = useState<number[]>([]);

  const toggleSave = (id: number) =>
    setSaved((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <section ref={ref} id="Офисы" className="py-16">
      <div className={`container mx-auto px-4 lg:px-8 ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}>
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-3xl font-bold text-foreground">Актуальные объекты</h2>
            <p className="text-muted-foreground mt-1">Лучшие предложения на рынке</p>
          </div>
          <a href="#" className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Все объекты <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.id}
                className="group bg-card rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-400 overflow-hidden hover:-translate-y-1 border-l-4 border-l-transparent hover:border-l-gold"
              >
                {/* Image placeholder */}
                <div className="h-48 bg-gradient-to-br from-muted to-secondary flex items-center justify-center relative">
                  <Icon className="w-12 h-12 text-muted-foreground/30" />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium">
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
                    <div>
                      <div className="text-xl font-bold text-foreground">
                        {p.price.toLocaleString("ru-RU")} ₽<span className="text-sm font-normal text-muted-foreground">/мес</span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-0.5">{p.area} м²</div>
                    </div>
                    <button
                      onClick={() => toggleSave(p.id)}
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
      </div>
    </section>
  );
}
