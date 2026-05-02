import { useEffect, useMemo, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useProperties, type DbProperty } from "@/hooks/useProperties";
import { List, Map as MapIcon, MapPin, ArrowRight, Eye, X } from "lucide-react";
import { Link } from "react-router-dom";
import { getPropertyCover } from "@/lib/propertyImages";
import StreetViewModal from "./StreetViewModal";

const IRKUTSK_CENTER: [number, number] = [104.2807, 52.2869];

type Coords = { lng: number; lat: number };

function getCoords(p: DbProperty): Coords | null {
  const lat = (p as any).lat;
  const lng = (p as any).lng;
  if (typeof lat === "number" && typeof lng === "number" && !Number.isNaN(lat) && !Number.isNaN(lng)) {
    return { lat, lng };
  }
  return null;
}

function formatPrice(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}k`;
  return `${value}`;
}

const MAP_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    "carto-light": {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
        "https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap, © CARTO",
    },
  },
  layers: [{ id: "carto-light", type: "raster", source: "carto-light" }],
};

export default function MapSection() {
  const { ref, isVisible } = useScrollReveal();
  const [view, setView] = useState<"map" | "list">("map");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeDistrict, setActiveDistrict] = useState<string>("Все");
  const [streetViewFor, setStreetViewFor] = useState<DbProperty | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map());
  const [mapReady, setMapReady] = useState(false);

  const { data: properties = [] } = useProperties();

  const filtered = useMemo(
    () => (activeDistrict === "Все"
      ? properties
      : properties.filter((p) => p.district === activeDistrict)),
    [properties, activeDistrict]
  );

  const withCoords = useMemo(() => filtered.filter((p) => getCoords(p) !== null), [filtered]);

  const districts = useMemo(() => {
    const counts = new Map<string, number>();
    properties.forEach((p) => {
      if (p.district) counts.set(p.district, (counts.get(p.district) || 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [properties]);

  const activeProperty = useMemo(
    () => filtered.find((p) => p.id === activeId) || null,
    [filtered, activeId]
  );

  // ---- Init MapLibre ----
  useEffect(() => {
    if (view !== "map" || !containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: IRKUTSK_CENTER,
      zoom: 11,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.scrollZoom.disable();

    map.on("load", () => setMapReady(true));
    mapRef.current = map;

    return () => {
      markersRef.current.forEach((m) => m.remove());
      markersRef.current.clear();
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [view]);

  // ---- Sync markers ----
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current.clear();

    const points: Coords[] = [];

    withCoords.forEach((p) => {
      const c = getCoords(p)!;
      points.push(c);

      const el = document.createElement("button");
      el.type = "button";
      el.className = `ms-price-pin${activeId === p.id ? " is-active" : ""}`;
      el.textContent = `${formatPrice(Number(p.price) || 0)} ₽`;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        setActiveId(p.id);
        map.flyTo({ center: [c.lng, c.lat], zoom: Math.max(map.getZoom(), 14), duration: 500 });
      });

      const marker = new maplibregl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([c.lng, c.lat])
        .addTo(map);
      markersRef.current.set(p.id, marker);
    });

    if (points.length >= 2) {
      const bounds = new maplibregl.LngLatBounds();
      points.forEach((c) => bounds.extend([c.lng, c.lat]));
      map.fitBounds(bounds, { padding: 60, maxZoom: 13, duration: 600 });
    } else if (points.length === 1) {
      map.flyTo({ center: [points[0].lng, points[0].lat], zoom: 14, duration: 600 });
    } else {
      map.flyTo({ center: IRKUTSK_CENTER, zoom: 11, duration: 600 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [withCoords, mapReady]);

  // Reflect active state without recreating
  useEffect(() => {
    markersRef.current.forEach((marker, id) => {
      const el = marker.getElement();
      el.classList.toggle("is-active", id === activeId);
    });
  }, [activeId]);

  // Reset active if filtered out
  useEffect(() => {
    if (activeId && !filtered.find((p) => p.id === activeId)) setActiveId(null);
  }, [filtered, activeId]);

  return (
    <section ref={ref} className="py-10 sm:py-16 bg-surface-warm">
      <div className={`container mx-auto px-3 sm:px-4 lg:px-8 ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}>
        <div className="flex items-end justify-between mb-5 sm:mb-8 flex-wrap gap-3">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-medium tracking-widest uppercase text-primary mb-1.5 sm:mb-2">
              Карта объектов
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
              Объекты на карте Иркутска
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {withCoords.length} объектов на карте · {filtered.length} всего{activeDistrict !== "Все" ? ` в районе «${activeDistrict}»` : ""}
            </p>
          </div>
          <div className="flex bg-card overflow-hidden border border-border rounded-lg shrink-0">
            <button
              onClick={() => setView("map")}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors ${
                view === "map" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MapIcon className="w-4 h-4" /> Карта
            </button>
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors ${
                view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="w-4 h-4" /> Список
            </button>
          </div>
        </div>

        <div className="bg-card overflow-hidden flex flex-col lg:flex-row rounded-xl sm:rounded-2xl shadow-card min-h-[420px] sm:min-h-[520px]">
          <div className="flex-1 relative bg-muted min-h-[360px] lg:min-h-0">
            {view === "map" ? (
              <>
                <div ref={containerRef} className="absolute inset-0" />

                {activeProperty && (
                  <div className="absolute left-3 right-3 bottom-3 sm:right-auto sm:max-w-[340px] z-[5] animate-fade-in-up">
                    <PropertyCard
                      p={activeProperty}
                      onClose={() => setActiveId(null)}
                      onStreetView={() => setStreetViewFor(activeProperty)}
                    />
                  </div>
                )}
              </>
            ) : (
              <div className="absolute inset-0 overflow-y-auto p-4 space-y-2">
                {withCoords.map((p) => (
                  <Link
                    key={p.id}
                    to={`/property/${p.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-background hover:bg-muted/50 transition-colors border border-border"
                  >
                    <div className="w-16 h-16 rounded-md overflow-hidden bg-muted shrink-0">
                      <img src={getPropertyCover(p.cover_photo, p.type)} alt={p.address} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-foreground truncate">
                        {Number(p.price).toLocaleString("ru-RU")} ₽
                        <span className="ml-2 text-xs font-normal text-muted-foreground">{p.area} м² · {p.type}</span>
                      </div>
                      <div className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {p.address}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-border bg-card lg:max-h-[520px] lg:overflow-y-auto">
            <div className="flex items-center justify-between px-3 sm:px-4 pt-3 sm:pt-4 pb-2">
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">По районам</p>
              {activeDistrict !== "Все" && (
                <button
                  onClick={() => { setActiveDistrict("Все"); setActiveId(null); }}
                  className="text-[10px] text-primary hover:underline"
                >
                  Сбросить
                </button>
              )}
            </div>

            <div className="flex lg:flex-col gap-1.5 px-3 sm:px-4 pb-3 sm:pb-4 overflow-x-auto lg:overflow-x-visible">
              <button
                type="button"
                onClick={() => { setActiveDistrict("Все"); setActiveId(null); }}
                className={`shrink-0 lg:w-full flex items-center gap-2 lg:justify-between px-3 py-2 lg:py-2.5 rounded-lg text-xs sm:text-sm whitespace-nowrap transition-colors ${
                  activeDistrict === "Все" ? "bg-primary text-primary-foreground" : "bg-muted/40 text-foreground hover:bg-muted"
                }`}
              >
                <span className="flex items-center gap-2">
                  <MapPin className={`w-3.5 h-3.5 ${activeDistrict === "Все" ? "text-primary-foreground" : "text-primary"}`} />
                  Все районы
                </span>
                <span className="text-[11px] font-medium opacity-80">{properties.length}</span>
              </button>

              {districts.length === 0 ? (
                <p className="text-xs text-muted-foreground px-1">Нет данных</p>
              ) : (
                districts.map(([name, count]) => {
                  const active = activeDistrict === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => { setActiveDistrict(name); setActiveId(null); }}
                      className={`shrink-0 lg:w-full flex items-center gap-2 lg:justify-between px-3 py-2 lg:py-2.5 rounded-lg text-xs sm:text-sm whitespace-nowrap transition-colors ${
                        active ? "bg-primary text-primary-foreground" : "bg-muted/40 text-foreground hover:bg-muted"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <MapPin className={`w-3.5 h-3.5 ${active ? "text-primary-foreground" : "text-primary"}`} />
                        {name}
                      </span>
                      <span className="text-[11px] font-medium opacity-80">{count}</span>
                    </button>
                  );
                })
              )}
            </div>

            <div className="px-3 sm:px-4 pb-4">
              <Link
                to="/catalog"
                className="flex items-center justify-center gap-1 w-full py-2.5 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Все объекты <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {streetViewFor && (() => {
        const c = getCoords(streetViewFor);
        if (!c) return null;
        return (
          <StreetViewModal
            lat={c.lat}
            lng={c.lng}
            address={streetViewFor.address}
            onClose={() => setStreetViewFor(null)}
          />
        );
      })()}

      <style>{`
        .ms-price-pin {
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 11px;
          font-weight: 700;
          color: hsl(220, 25%, 10%);
          background: #fff;
          border: 1px solid hsl(220, 25%, 10%);
          padding: 4px 8px;
          cursor: pointer;
          white-space: nowrap;
          transition: transform 160ms ease, background 160ms ease, color 160ms ease;
          line-height: 1;
          border-radius: 4px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.12);
        }
        .ms-price-pin:hover {
          background: hsl(220, 25%, 10%);
          color: #fff;
          z-index: 5;
        }
        .ms-price-pin.is-active {
          background: hsl(0, 72%, 51%);
          color: #fff;
          border-color: hsl(0, 72%, 51%);
          z-index: 10;
          transform: translateY(-2px) scale(1.05);
        }
        .maplibregl-ctrl-attrib { font-size: 10px; }
      `}</style>
    </section>
  );
}

function PropertyCard({
  p,
  onClose,
  onStreetView,
}: {
  p: DbProperty;
  onClose: () => void;
  onStreetView: () => void;
}) {
  return (
    <div className="bg-card rounded-xl shadow-card-hover overflow-hidden border border-border">
      <div className="relative h-32 bg-muted">
        <img src={getPropertyCover(p.cover_photo, p.type)} alt={p.address} className="w-full h-full object-cover" />
        <button
          onClick={onClose}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/90 backdrop-blur text-foreground flex items-center justify-center hover:bg-background transition-colors"
          aria-label="Закрыть"
        >
          <X className="w-3.5 h-3.5" />
        </button>
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold uppercase tracking-wide">
          {p.type}
        </span>
        <button
          onClick={onStreetView}
          className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-foreground/90 backdrop-blur text-background text-[10px] font-semibold hover:bg-foreground transition-colors"
        >
          <Eye className="w-3 h-3" /> Вид с улицы
        </button>
      </div>
      <div className="p-3">
        <div className="flex items-baseline justify-between gap-2 mb-1">
          <span className="font-display text-lg font-bold text-foreground">
            {Number(p.price).toLocaleString("ru-RU")} ₽
            {p.deal_type === "Аренда" && <span className="text-xs font-normal text-muted-foreground">/мес</span>}
          </span>
          <span className="text-xs text-muted-foreground shrink-0">{p.area} м²</span>
        </div>
        <div className="flex items-start gap-1 text-xs text-muted-foreground mb-3">
          <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
          <span className="line-clamp-2">{p.address}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onStreetView}
            className="flex-1 inline-flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold bg-muted text-foreground hover:bg-muted/70 transition-colors"
          >
            <Eye className="w-3.5 h-3.5" /> Улица
          </button>
          <Link
            to={`/property/${p.id}`}
            className="flex-1 text-center py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Подробнее
          </Link>
        </div>
      </div>
    </div>
  );
}
