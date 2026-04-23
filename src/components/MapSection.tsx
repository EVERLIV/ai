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

type Cluster = {
  key: string;
  lat: number;
  lng: number;
  items: DbProperty[];
};

export default function MapSection() {
  const { ref, isVisible } = useScrollReveal();
  const [view, setView] = useState<"map" | "list">("map");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeClusterKey, setActiveClusterKey] = useState<string | null>(null);
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

  // Group by rounded coordinate (~11m precision) OR by exact address.
  const clusters = useMemo<Cluster[]>(() => {
    const map = new Map<string, Cluster>();
    withCoords.forEach((p) => {
      const c = getCoords(p)!;
      // round to 4 decimals (~11m) to merge same-building markers
      const key = `${c.lat.toFixed(4)}_${c.lng.toFixed(4)}`;
      const existing = map.get(key);
      if (existing) {
        existing.items.push(p);
      } else {
        map.set(key, { key, lat: c.lat, lng: c.lng, items: [p] });
      }
    });
    return Array.from(map.values());
  }, [withCoords]);

  const activeCluster = useMemo(
    () => clusters.find((c) => c.key === activeClusterKey) || null,
    [clusters, activeClusterKey]
  );

  const districts = useMemo(() => {
    const counts = new Map<string, number>();
    properties.forEach((p) => {
      if (p.district) counts.set(p.district, (counts.get(p.district) || 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [properties]);

  // (single-property card uses activeCluster.items[0])


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

  // Render markers + fit bounds (one marker per cluster)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const place = () => {
      // Clear old markers
      Object.values(markersRef.current).forEach((m) => m.remove());
      markersRef.current = {};

      if (clusters.length === 0) return;

      const bounds = new mapboxgl.LngLatBounds();

      clusters.forEach((cluster) => {
        const count = cluster.items.length;
        const minPrice = Math.min(...cluster.items.map((i) => Number(i.price) || 0));
        const el = document.createElement("div");
        el.className = "ms-pin-wrap";
        const badge = count > 1
          ? `<div class="ms-pin-count">${count}</div>`
          : "";
        el.innerHTML = `
          <div class="ms-pin-pulse"></div>
          <div class="ms-pin">
            <span>${count > 1 ? `от ` : ""}${Math.round(minPrice / 1000)}к</span>
          </div>
          ${badge}
          <div class="ms-pin-tip"></div>
        `;
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          setActiveClusterKey(cluster.key);
          setActiveId(count === 1 ? cluster.items[0].id : null);
          map.easeTo({ center: [cluster.lng, cluster.lat], zoom: Math.max(map.getZoom(), 13), duration: 500 });
        });

        const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
          .setLngLat([cluster.lng, cluster.lat])
          .addTo(map);
        markersRef.current[cluster.key] = marker;
        bounds.extend([cluster.lng, cluster.lat]);
      });

      if (clusters.length > 1) {
        map.fitBounds(bounds, { padding: 80, maxZoom: 13, duration: 700 });
      } else if (clusters.length === 1) {
        map.easeTo({ center: [clusters[0].lng, clusters[0].lat], zoom: 14 });
      }
    };

    if (map.isStyleLoaded()) place();
    else map.once("load", place);
  }, [clusters]);

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

                {/* Active cluster overlay */}
                {activeCluster && (
                  <div className="absolute left-4 bottom-4 right-4 sm:right-auto sm:max-w-[340px] z-10 animate-fade-in">
                    <div className="bg-card rounded-xl shadow-card-hover overflow-hidden border border-border">
                      {activeCluster.items.length === 1 ? (
                        (() => {
                          const p = activeCluster.items[0];
                          return (
                            <>
                              <div className="relative h-32 bg-muted">
                                <img
                                  src={getPropertyCover(p.cover_photo, p.type)}
                                  alt={p.address}
                                  className="w-full h-full object-cover"
                                />
                                <button
                                  onClick={() => { setActiveClusterKey(null); setActiveId(null); }}
                                  className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/90 backdrop-blur text-foreground flex items-center justify-center hover:bg-background transition-colors text-lg leading-none"
                                  aria-label="Закрыть"
                                >
                                  ×
                                </button>
                                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold uppercase tracking-wide">
                                  {p.type}
                                </span>
                              </div>
                              <div className="p-3">
                                <div className="flex items-baseline justify-between gap-2 mb-1">
                                  <span className="font-display text-lg font-bold text-foreground">
                                    {Number(p.price).toLocaleString("ru-RU")} ₽
                                    {p.deal_type === "Аренда" && (
                                      <span className="text-xs font-normal text-muted-foreground">/мес</span>
                                    )}
                                  </span>
                                  <span className="text-xs text-muted-foreground shrink-0">{p.area} м²</span>
                                </div>
                                <div className="flex items-start gap-1 text-xs text-muted-foreground mb-3">
                                  <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
                                  <span className="line-clamp-2">{p.address}</span>
                                </div>
                                <Link
                                  to={`/property/${p.id}`}
                                  className="block w-full text-center py-2 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                                >
                                  Подробнее
                                </Link>
                              </div>
                            </>
                          );
                        })()
                      ) : (
                        <>
                          <div className="flex items-start justify-between gap-2 px-3 pt-3 pb-2 border-b border-border">
                            <div className="min-w-0">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-0.5">
                                {activeCluster.items.length} объектов на адресе
                              </p>
                              <p className="text-xs font-medium text-foreground line-clamp-2 flex items-start gap-1">
                                <MapPin className="w-3 h-3 shrink-0 mt-0.5 text-muted-foreground" />
                                {activeCluster.items[0].address}
                              </p>
                            </div>
                            <button
                              onClick={() => { setActiveClusterKey(null); setActiveId(null); }}
                              className="w-7 h-7 rounded-full bg-muted text-foreground flex items-center justify-center hover:bg-muted/80 transition-colors text-lg leading-none shrink-0"
                              aria-label="Закрыть"
                            >
                              ×
                            </button>
                          </div>
                          <div className="max-h-[280px] overflow-y-auto divide-y divide-border">
                            {activeCluster.items.map((p) => (
                              <Link
                                key={p.id}
                                to={`/property/${p.id}`}
                                className="flex items-center gap-2.5 p-2.5 hover:bg-muted/50 transition-colors"
                              >
                                <div className="w-12 h-12 rounded-md overflow-hidden bg-muted shrink-0">
                                  <img
                                    src={getPropertyCover(p.cover_photo, p.type)}
                                    alt={p.address}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-xs font-semibold text-foreground truncate">
                                    {Number(p.price).toLocaleString("ru-RU")} ₽
                                    {p.deal_type === "Аренда" && (
                                      <span className="text-[10px] font-normal text-muted-foreground">/мес</span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-muted-foreground truncate">
                                    {p.type} · {p.area} м²{p.floor ? ` · ${p.floor} эт.` : ""}
                                  </div>
                                </div>
                                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              </Link>
                            ))}
                          </div>
                        </>
                      )}
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

          {/* Districts sidebar — clickable filters */}
          <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-border p-4 space-y-1.5 overflow-y-auto max-h-[520px] bg-card">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                По районам
              </p>
              {activeDistrict !== "Все" && (
                <button
                  onClick={() => { setActiveDistrict("Все"); setActiveClusterKey(null); setActiveId(null); }}
                  className="text-[10px] text-primary hover:underline"
                >
                  Сбросить
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => { setActiveDistrict("Все"); setActiveClusterKey(null); setActiveId(null); }}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
                activeDistrict === "Все"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/40 text-foreground hover:bg-muted"
              }`}
            >
              <span className="flex items-center gap-2">
                <MapPin className={`w-3.5 h-3.5 ${activeDistrict === "Все" ? "text-primary-foreground" : "text-primary"}`} />
                Все районы
              </span>
              <span className="text-xs font-medium opacity-80">{properties.length}</span>
            </button>

            {districts.length === 0 ? (
              <p className="text-xs text-muted-foreground">Нет данных</p>
            ) : (
              districts.map(([name, count]) => {
                const active = activeDistrict === name;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => { setActiveDistrict(name); setActiveClusterKey(null); setActiveId(null); }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted/40 text-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <MapPin className={`w-3.5 h-3.5 ${active ? "text-primary-foreground" : "text-primary"}`} />
                      {name}
                    </span>
                    <span className="text-xs font-medium opacity-80">{count}</span>
                  </button>
                );
              })
            )}
            <Link
              to="/catalog"
              className="mt-3 flex items-center justify-center gap-1 w-full py-2.5 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Все объекты <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        /* The wrapper's BOTTOM edge sits on the geo coordinate (anchor:"bottom").
           So the pin tip must be at the wrapper's bottom. */
        .ms-pin-wrap {
          position: relative;
          width: 56px;
          height: 56px;
          cursor: pointer;
          pointer-events: auto;
        }
        .ms-pin {
          position: absolute;
          left: 50%;
          top: 4px;
          transform: translateX(-50%);
          z-index: 2;
          min-width: 44px;
          height: 28px;
          padding: 0 9px;
          background: hsl(0 72% 51%);
          color: #fff;
          font-family: Inter, sans-serif;
          font-size: 11px;
          font-weight: 700;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #fff;
          border-radius: 999px;
          box-shadow: 0 4px 14px hsl(0 72% 51% / 0.4);
          transition: transform 0.18s ease;
          white-space: nowrap;
        }
        /* Triangle tip — its tip aligns exactly with wrapper bottom (0px). */
        .ms-pin-tip {
          position: absolute;
          left: 50%;
          bottom: 0;
          transform: translate(-50%, 0);
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 10px solid hsl(0 72% 51%);
          filter: drop-shadow(0 1px 0 #fff);
          z-index: 1;
        }
        .ms-pin-wrap:hover .ms-pin {
          transform: translateX(-50%) translateY(-2px) scale(1.05);
        }
        .ms-pin-count {
          position: absolute;
          top: -2px;
          right: 2px;
          z-index: 3;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          border-radius: 999px;
          background: hsl(45 90% 50%);
          color: hsl(0 0% 10%);
          font-family: Inter, sans-serif;
          font-size: 10px;
          font-weight: 800;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #fff;
          box-shadow: 0 2px 6px rgb(0 0 0 / 0.2);
        }
        .ms-pin-pulse {
          position: absolute;
          left: 50%;
          bottom: 4px;
          transform: translate(-50%, 0);
          width: 18px;
          height: 18px;
          background: hsl(0 72% 51%);
          border-radius: 50%;
          opacity: 0.45;
          animation: msPinPulse 2s ease-out infinite;
          z-index: 0;
        }
        @keyframes msPinPulse {
          0%   { transform: translate(-50%, 0) scale(0.6); opacity: 0.55; }
          70%  { transform: translate(-50%, 0) scale(2.4); opacity: 0; }
          100% { transform: translate(-50%, 0) scale(2.4); opacity: 0; }
        }
        /* Make Mapbox NavigationControl look in-system */
        .mapboxgl-ctrl-group {
          border-radius: 10px !important;
          overflow: hidden;
          box-shadow: 0 4px 14px rgb(0 0 0 / 0.08) !important;
        }
      `}</style>
    </section>
  );
}
