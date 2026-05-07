import { useState } from "react";
import { usePropertyUnits, type PropertyUnit } from "@/hooks/usePropertyUnits";
import { Layers, ChevronLeft, ChevronRight, X, ImageIcon } from "lucide-react";
import { getDefaultPropertyImage } from "@/lib/propertyImages";

interface Props {
  propertyId: string;
}

const STATUS_LABEL: Record<string, { text: string; cls: string }> = {
  available: { text: "Свободно", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  reserved: { text: "Бронь", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  occupied: { text: "Занято", cls: "bg-muted text-muted-foreground border-border" },
};

export default function PropertyUnitsTable({ propertyId }: Props) {
  const { data: units = [], isLoading } = usePropertyUnits(propertyId);
  const [lightbox, setLightbox] = useState<{ photos: string[]; index: number; title: string } | null>(null);

  if (isLoading || units.length === 0) return null;

  const fmt = (n: number) => Number(n || 0).toLocaleString("ru-RU");

  const openLightbox = (u: PropertyUnit, index = 0) => {
    if (!u.photos || u.photos.length === 0) return;
    setLightbox({ photos: u.photos, index, title: u.name || "Помещение" });
  };

  const navLightbox = (delta: number) => {
    if (!lightbox) return;
    const next = (lightbox.index + delta + lightbox.photos.length) % lightbox.photos.length;
    setLightbox({ ...lightbox, index: next });
  };

  return (
    <section className="mb-8">
      <h2 className="font-display text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
        <Layers className="w-5 h-5 text-primary" /> Помещения в объекте
        <span className="text-sm font-normal text-muted-foreground">({units.length})</span>
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {units.map((u: PropertyUnit) => {
          const st = STATUS_LABEL[u.status] || STATUS_LABEL.available;
          const photos = u.photos || [];
          const cover = photos[0];
          return (
            <div
              key={u.id}
              className="group bg-card rounded-2xl border border-border overflow-hidden shadow-card hover:shadow-card-hover transition-all hover:-translate-y-0.5"
            >
              <button
                type="button"
                onClick={() => openLightbox(u, 0)}
                className="relative block w-full aspect-[4/3] bg-muted overflow-hidden"
              >
                {cover ? (
                  <img
                    src={cover}
                    alt={u.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    <ImageIcon className="w-10 h-10 opacity-40" />
                  </div>
                )}
                {photos.length > 1 && (
                  <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-card/85 backdrop-blur text-foreground text-[11px] font-medium">
                    +{photos.length - 1} фото
                  </span>
                )}
                <span className={`absolute top-2 left-2 inline-block px-2 py-0.5 rounded-full border text-[11px] font-medium ${st.cls}`}>
                  {st.text}
                </span>
              </button>

              {photos.length > 1 && (
                <div className="flex gap-1 px-3 pt-2 overflow-x-auto">
                  {photos.slice(0, 5).map((p, i) => (
                    <button
                      key={i}
                      onClick={() => openLightbox(u, i)}
                      className="shrink-0 w-12 h-9 rounded-md overflow-hidden border border-border hover:border-primary transition-colors"
                    >
                      <img src={p} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              <div className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-semibold text-foreground">{u.name || "—"}</div>
                  <div className="text-right shrink-0">
                    {Number(u.price) > 0 ? (
                      <div className="font-semibold text-foreground tabular-nums">{fmt(Number(u.price))} ₽</div>
                    ) : (
                      <div className="text-xs text-muted-foreground">по запросу</div>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {u.floor && <span>Этаж: <span className="text-foreground">{u.floor}</span></span>}
                  {Number(u.area) > 0 && <span>{fmt(Number(u.area))} м²</span>}
                  {u.purpose && <span>{u.purpose}</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-card flex items-center justify-center text-foreground hover:bg-muted transition-colors"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full bg-card text-foreground text-sm font-medium">
            {lightbox.title} · {lightbox.index + 1} / {lightbox.photos.length}
          </div>
          {lightbox.photos.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); navLightbox(-1); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-card flex items-center justify-center text-foreground hover:bg-muted transition-colors"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); navLightbox(1); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-card flex items-center justify-center text-foreground hover:bg-muted transition-colors"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
          <img
            src={lightbox.photos[lightbox.index]}
            alt=""
            onClick={(e) => e.stopPropagation()}
            className="max-w-[92vw] max-h-[88vh] object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}
    </section>
  );
}
