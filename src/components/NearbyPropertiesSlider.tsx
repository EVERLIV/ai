import { useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, MapPin, Maximize } from "lucide-react";
import { useProperties } from "@/hooks/useProperties";

interface Props {
  district: string;
  excludeId: string;
  type?: string;
}

export default function NearbyPropertiesSlider({ district, excludeId, type }: Props) {
  const { data: all } = useProperties();
  const scrollRef = useRef<HTMLDivElement>(null);

  const items = (all ?? []).filter(
    (p) =>
      p.id !== excludeId &&
      p.district === district &&
      (type ? p.type === type : true),
  );

  // Fallback: if not enough in same district, fill with same type from elsewhere
  const fallback =
    items.length < 4
      ? (all ?? []).filter(
          (p) =>
            p.id !== excludeId &&
            p.district !== district &&
            (type ? p.type === type : true),
        )
      : [];

  const list = [...items, ...fallback].slice(0, 12);

  if (!list.length) return null;

  const fmt = (n: number | string | null) =>
    n ? Number(n).toLocaleString("ru-RU") : "—";

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -360 : 360, behavior: "smooth" });
  };

  return (
    <section className="mt-12 pt-8 border-t border-border">
      <div className="flex items-end justify-between mb-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">
            Другие объекты в районе
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {district} · {list.length} {list.length === 1 ? "объект" : "объектов"}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={() => scroll("left")}
            className="w-9 h-9 border border-border flex items-center justify-center hover:bg-muted transition-colors"
            aria-label="Previous"
          >
            <ChevronLeft className="w-4 h-4 text-foreground" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="w-9 h-9 border border-border flex items-center justify-center hover:bg-muted transition-colors"
            aria-label="Next"
          >
            <ChevronRight className="w-4 h-4 text-foreground" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory"
        style={{ scrollbarWidth: "none" }}
      >
        {list.map((p) => (
          <Link
            key={p.id}
            to={`/property/${p.id}`}
            className="group min-w-[280px] max-w-[280px] snap-start border border-border bg-card overflow-hidden hover:bg-muted/30 transition-colors"
          >
            <div className="relative h-40 overflow-hidden bg-muted">
              {p.cover_photo ? (
                <img
                  src={p.cover_photo}
                  alt={p.address}
                  loading="lazy"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">
                  Нет фото
                </div>
              )}
              <span className="absolute top-2 left-2 text-[11px] font-medium px-2 py-0.5 bg-primary text-primary-foreground uppercase tracking-wide">
                {p.deal_type === "Продажа" ? "Продажа" : "Аренда"}
              </span>
            </div>
            <div className="p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{p.address}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-base text-foreground">
                  {fmt(p.price)} ₽
                  {p.deal_type !== "Продажа" && (
                    <span className="text-xs font-normal text-muted-foreground">/мес</span>
                  )}
                </span>
                <div className="flex items-center gap-1 text-muted-foreground text-xs">
                  <Maximize className="w-3 h-3" />
                  {p.area} м²
                </div>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="px-1.5 py-0.5 bg-secondary">{p.class}</span>
                <span className="truncate">{p.type}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
