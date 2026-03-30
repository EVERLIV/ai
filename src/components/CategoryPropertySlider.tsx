import { useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, MapPin, Maximize, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProperties } from "@/hooks/useProperties";
import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  type: string;
  title?: string;
}

export default function CategoryPropertySlider({ type, title = "Объекты в каталоге" }: Props) {
  const { data: allProperties, isLoading } = useProperties();
  const scrollRef = useRef<HTMLDivElement>(null);

  const properties = allProperties?.filter((p) => p.type === type) ?? [];

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = 380;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  const fmt = (n: number) => n.toLocaleString("ru-RU");

  if (isLoading) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-display font-bold text-foreground mb-8">{title}</h2>
          <div className="flex gap-6 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="min-w-[350px] h-[320px] rounded-xl" />
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
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">{title}</h2>
            <p className="text-muted-foreground mt-1">{properties.length} объектов доступно</p>
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
              className="group min-w-[340px] max-w-[340px] snap-start rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              <div className="relative h-48 overflow-hidden bg-muted">
                {p.cover_photo ? (
                  <img
                    src={p.cover_photo}
                    alt={p.address}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    Нет фото
                  </div>
                )}
                <div className="absolute top-3 left-3">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary text-primary-foreground">
                    {p.deal_type === "Продажа" ? "Продажа" : "Аренда"}
                  </span>
                </div>
              </div>
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="truncate">{p.address}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-lg text-foreground">
                    {fmt(p.price)} ₽{p.deal_type !== "Продажа" && <span className="text-sm font-normal text-muted-foreground">/мес</span>}
                  </span>
                  <div className="flex items-center gap-1 text-muted-foreground text-sm">
                    <Maximize className="w-3.5 h-3.5" />
                    {p.area} м²
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="px-2 py-0.5 rounded bg-secondary">{p.class}</span>
                  <span>{p.district}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link to={`/catalog?type=${encodeURIComponent(type)}`}>
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
