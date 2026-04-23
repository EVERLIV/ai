import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useProperties, type DbProperty } from "@/hooks/useProperties";
import { List, Map as MapIcon, MapPin, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { getPropertyCover } from "@/lib/propertyImages";

const IRKUTSK_CENTER: [number, number] = [104.2807, 52.2869];

// Token-less raster style — CARTO Positron tiles
const GRAY_STYLE: mapboxgl.Style = {
  version: 8,
  sources: {
    "raster-tiles": {
      type: "raster",
      tiles: [
        "https://cartodb-basemaps-a.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}.png",
        "https://cartodb-basemaps-b.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}.png",
        "https://cartodb-basemaps-c.global.ssl.fastly.net/light_nolabels/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap, © CARTO",
    },
    labels: {
      type: "raster",
      tiles: [
        "https://cartodb-basemaps-a.global.ssl.fastly.net/light_only_labels/{z}/{x}/{y}.png",
        "https://cartodb-basemaps-b.global.ssl.fastly.net/light_only_labels/{z}/{x}/{y}.png",
        "https://cartodb-basemaps-c.global.ssl.fastly.net/light_only_labels/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
    },
  },
  layers: [
    { id: "bg", type: "background", paint: { "background-color": "#f5f3ef" } },
    { id: "tiles", type: "raster", source: "raster-tiles" },
    { id: "tile-labels", type: "raster", source: "labels" },
  ],
};

function getCoords(p: DbProperty): { lat: number; lng: number } | null {
  const lat = (p as any).lat;
  const lng = (p as any).lng;
  if (typeof lat === "number" && typeof lng === "number" && !Number.isNaN(lat) && !Number.isNaN(lng)) {
    return { lat, lng };
  }
  return null;
}

export default function MapSection() {
  const { ref, isVisible } = useScrollReveal();
  const [view, setView] = useState<"map" | "list">("map");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeDistrict, setActiveDistrict] = useState<string>("Все");
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<Record<string, mapboxgl.Marker>>({});

  const { data: properties = [] } = useProperties();

  const filtered = useMemo(
    () => (activeDistrict === "Все"
      ? properties
      : properties.filter((p) => p.district === activeDistrict)),
    [properties, activeDistrict]
  );

  const withCoords = useMemo(
    () => filtered.filter((p) => getCoords(p) !== null),
    [filtered]
  );

  const districts = useMemo(() => {
    const counts = new Map<string, number>();
    properties.forEach((p) => {
      if (p.district) counts.set(p.district, (counts.get(p.district) || 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [properties]);

  const activeProperty = useMemo(
    () => withCoords.find((p) => p.id === activeId) || null,
    [withCoords, activeId]
  );

  // Init map — once. Wheel zoom is disabled, controls only via buttons / dblclick.
  useEffect(() => {
    if (!mapContainer.current || mapRef.current || view !== "map") return;
    mapboxgl.accessToken = "no-token-needed";
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: GRAY_STYLE,
      center: IRKUTSK_CENTER,
      zoom: 9,
      attributionControl: true,
      scrollZoom: false,
      boxZoom: false,
      dragRotate: false,
      touchZoomRotate: false,
      touchPitch: false,
      doubleClickZoom: true,
    });
    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false, visualizePitch: false }),
      "top-right"
    );
    mapRef.current = map;

    return () => {
      Object.values(markersRef.current).forEach((m) => m.remove());
      markersRef.current = {};
      map.remove();
      mapRef.current = null;
    };
  }, [view]);

  // Render markers + fit bounds
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const place = () => {
      // Clear old markers
      Object.values(markersRef.current).forEach((m) => m.remove());
      markersRef.current = {};

      if (withCoords.length === 0) return;

      const bounds = new mapboxgl.LngLatBounds();

      withCoords.forEach((p) => {
        const c = getCoords(p)!;
        const el = document.createElement("div");
        el.className = "ms-pin-wrap";
        el.innerHTML = `
          <div class="ms-pin-pulse"></div>
          <div class="ms-pin">
            <span>${Math.round(Number(p.price) / 1000)}к</span>
          </div>
          <div class="ms-pin-tip"></div>
        `;
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          setActiveId(p.id);
          map.easeTo({ center: [c.lng, c.lat], zoom: Math.max(map.getZoom(), 13), duration: 500 });
        });

        // anchor "bottom" -> the very bottom of the element sits on the coord.
        // Our element's bottom is the tip of the pin pointer.
        const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([c.lng, c.lat])
          .addTo(map);
        markersRef.current[p.id] = marker;
        bounds.extend([c.lng, c.lat]);
      });

      if (withCoords.length > 1) {
        map.fitBounds(bounds, { padding: 80, maxZoom: 13, duration: 700 });
      } else if (withCoords.length === 1) {
        const c = getCoords(withCoords[0])!;
        map.easeTo({ center: [c.lng, c.lat], zoom: 14 });
      }
    };

    if (map.isStyleLoaded()) place();
    else map.once("load", place);
  }, [withCoords]);

  return (
    <section ref={ref} className="py-16 bg-surface-warm">
      <div className={`container mx-auto px-4 lg:px-8 ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}>
        <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
          <div>
            <p className="text-xs font-medium tracking-widest uppercase text-primary mb-2">
              Карта объектов
            </p>
            <h2 className="font-display text-3xl font-bold text-foreground">
              Объекты на карте Иркутска
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {withCoords.length} объектов на карте · {filtered.length} всего{activeDistrict !== "Все" ? ` в районе «${activeDistrict}»` : ""}
            </p>
          </div>
          <div className="flex bg-card overflow-hidden border border-border rounded-lg">
            <button
              onClick={() => setView("map")}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
                view === "map" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MapIcon className="w-4 h-4" /> Карта
            </button>
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${
                view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="w-4 h-4" /> Список
            </button>
          </div>
        </div>

        <div
          className="bg-card overflow-hidden flex flex-col lg:flex-row rounded-2xl shadow-card"
          style={{ minHeight: 520 }}
        >
          {/* Map / List view */}
          <div className="flex-1 relative bg-muted">
            {view === "map" ? (
              <>
                <div ref={mapContainer} className="absolute inset-0" />

                {/* Active property card overlay */}
                {activeProperty && (
                  <div className="absolute left-4 bottom-4 right-4 sm:right-auto sm:max-w-[320px] z-10 animate-fade-in">
                    <div className="bg-card rounded-xl shadow-card-hover overflow-hidden border border-border">
                      <div className="relative h-32 bg-muted">
                        <img
                          src={getPropertyCover(activeProperty.cover_photo, activeProperty.type)}
                          alt={activeProperty.address}
                          className="w-full h-full object-cover"
                        />
                        <button
                          onClick={() => setActiveId(null)}
                          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/90 backdrop-blur text-foreground flex items-center justify-center hover:bg-background transition-colors text-lg leading-none"
                          aria-label="Закрыть"
                        >
                          ×
                        </button>
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold uppercase tracking-wide">
                          {activeProperty.type}
                        </span>
                      </div>
                      <div className="p-3">
                        <div className="flex items-baseline justify-between gap-2 mb-1">
                          <span className="font-display text-lg font-bold text-foreground">
                            {Number(activeProperty.price).toLocaleString("ru-RU")} ₽
                            {activeProperty.deal_type === "Аренда" && (
                              <span className="text-xs font-normal text-muted-foreground">/мес</span>
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {activeProperty.area} м²
                          </span>
                        </div>
                        <div className="flex items-start gap-1 text-xs text-muted-foreground mb-3">
                          <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
                          <span className="line-clamp-2">{activeProperty.address}</span>
                        </div>
                        <Link
                          to={`/property/${activeProperty.id}`}
                          className="block w-full text-center py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                        >
                          Подробнее
                        </Link>
                      </div>
                    </div>
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
                      <img
                        src={getPropertyCover(p.cover_photo, p.type)}
                        alt={p.address}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-foreground truncate">
                        {Number(p.price).toLocaleString("ru-RU")} ₽
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          {p.area} м² · {p.type}
                        </span>
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

          {/* Districts sidebar */}
          <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-border p-4 space-y-2 overflow-y-auto max-h-[520px] bg-card">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              По районам
            </p>
            {districts.length === 0 ? (
              <p className="text-xs text-muted-foreground">Нет данных</p>
            ) : (
              districts.map(([name, count]) => (
                <div
                  key={name}
                  className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted/40 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <MapPin className="w-3.5 h-3.5 text-primary" />
                    {name}
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">{count}</span>
                </div>
              ))
            )}
            <Link
              to="/catalog"
              className="mt-3 flex items-center justify-center gap-1 w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Все объекты <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        .ms-pin-wrap {
          position: relative;
          width: 44px;
          height: 56px;
          cursor: pointer;
          display: flex;
          align-items: flex-end;
          justify-content: center;
        }
        .ms-pin {
          position: relative;
          z-index: 2;
          min-width: 44px;
          height: 30px;
          padding: 0 8px;
          background: hsl(0 72% 51%);
          color: #fff;
          font-family: Inter, sans-serif;
          font-size: 11px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #fff;
          border-radius: 999px;
          box-shadow: 0 4px 14px hsl(0 72% 51% / 0.35);
          transition: transform 0.2s ease;
        }
        .ms-pin:after {
          content: "";
          position: absolute;
          bottom: -7px;
          left: 50%;
          transform: translateX(-50%) rotate(45deg);
          width: 10px;
          height: 10px;
          background: hsl(0 72% 51%);
          border-right: 2px solid #fff;
          border-bottom: 2px solid #fff;
        }
        .ms-pin-wrap:hover .ms-pin {
          transform: translateY(-3px) scale(1.05);
        }
        .ms-pin-pulse {
          position: absolute;
          bottom: 4px;
          left: 50%;
          transform: translateX(-50%);
          width: 30px;
          height: 30px;
          background: hsl(0 72% 51%);
          border-radius: 50%;
          opacity: 0.35;
          animation: msPinPulse 2s ease-out infinite;
        }
        @keyframes msPinPulse {
          0%   { transform: translateX(-50%) scale(0.6); opacity: 0.5; }
          70%  { transform: translateX(-50%) scale(2); opacity: 0; }
          100% { transform: translateX(-50%) scale(2); opacity: 0; }
        }
      `}</style>
    </section>
  );
}
