import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useProperties, type DbProperty } from "@/hooks/useProperties";
import { List, Map as MapIcon, MapPin, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { getPropertyCover } from "@/lib/propertyImages";

const IRKUTSK_CENTER: L.LatLngTuple = [52.2869, 104.2807];

function getCoords(p: DbProperty): { lat: number; lng: number } | null {
  const lat = (p as any).lat;
  const lng = (p as any).lng;
  if (typeof lat === "number" && typeof lng === "number" && !Number.isNaN(lat) && !Number.isNaN(lng)) {
    return { lat, lng };
  }
  return null;
}

// Extract a street key from an address (text before first comma, normalized).
// Used for street-level grouping at lower zoom levels.
function getStreetKey(address: string): string {
  if (!address) return "—";
  return address.split(",")[0].trim().toLowerCase().replace(/\s+/g, " ");
}

function formatPrice(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)} млн`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}к`;
  return `${value}`;
}

export default function MapSection() {
  const { ref, isVisible } = useScrollReveal();
  const [view, setView] = useState<"map" | "list">("map");
  const [activeProperty, setActiveProperty] = useState<DbProperty | null>(null);
  const [activeDistrict, setActiveDistrict] = useState<string>("Все");

  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);

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

  // ---- Init map (once per view switch to "map") ----
  useEffect(() => {
    if (view !== "map" || !mapContainer.current || mapRef.current) return;

    const map = L.map(mapContainer.current, {
      center: IRKUTSK_CENTER,
      zoom: 12,
      scrollWheelZoom: false, // controls only via buttons / pinch / dblclick
      zoomControl: true,
      attributionControl: true,
      preferCanvas: false,
    });

    // CartoDB Positron — clean, low-POI tiles
    L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
      subdomains: "abcd",
      attribution: "© OpenStreetMap, © CARTO",
      maxZoom: 19,
    }).addTo(map);

    // Cluster group: street-level grouping. Big radius at low zoom, collapses near zoom 15+.
    const cluster = (L as any).markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      zoomToBoundsOnClick: false, // we handle this with flyTo
      removeOutsideVisibleBounds: true,
      maxClusterRadius: (zoom: number) => {
        if (zoom >= 15) return 1;   // basically every marker its own
        if (zoom >= 13) return 30;  // tight street-level clusters
        return 80;                   // city-scale
      },
      iconCreateFunction: (c: any) => {
        const count = c.getChildCount();
        return L.divIcon({
          html: `<div class="ms-cluster"><span>${count}</span></div>`,
          className: "ms-cluster-wrap",
          iconSize: [44, 44],
          iconAnchor: [22, 22],
        });
      },
      // Spiderfy distance for same-coord markers
      spiderfyDistanceMultiplier: 1.6,
    }) as L.MarkerClusterGroup;

    // Custom click on cluster: smooth flyTo, no popup
    cluster.on("clusterclick", (e: any) => {
      const center = e.layer.getLatLng();
      const targetZoom = Math.min(map.getZoom() + 2, 17);
      map.flyTo(center, targetZoom, { duration: 0.6 });
    });

    map.addLayer(cluster);
    clusterGroupRef.current = cluster;
    mapRef.current = map;

    // Ensure correct sizing after mount
    setTimeout(() => map.invalidateSize(), 0);

    return () => {
      map.remove();
      mapRef.current = null;
      clusterGroupRef.current = null;
    };
  }, [view]);

  // ---- Sync markers when filtered data changes ----
  useEffect(() => {
    const map = mapRef.current;
    const cluster = clusterGroupRef.current;
    if (!map || !cluster) return;

    cluster.clearLayers();

    if (withCoords.length === 0) return;

    const markers: L.Marker[] = [];

    withCoords.forEach((p) => {
      const c = getCoords(p)!;
      const price = Number(p.price) || 0;
      const label = `от ${formatPrice(price)} ₽`;

      const icon = L.divIcon({
        html: `<button type="button" class="ms-pill" aria-label="${label}"><span>${label}</span></button>`,
        className: "ms-pill-wrap",
        iconSize: [0, 0], // sized by inner content
        iconAnchor: [0, 0],
      });

      const marker = L.marker([c.lat, c.lng], {
        icon,
        // Group markers on same street so MarkerCluster keeps them together at low zoom.
        // (Kept as metadata; clustering itself is distance-based by design.)
        // @ts-expect-error attach data
        _streetKey: getStreetKey(p.address),
      });

      marker.on("click", () => {
        setActiveProperty(p);
        // Toggle inverted state on this pill
        const el = (marker as any)._icon as HTMLElement | undefined;
        if (el) {
          document.querySelectorAll(".ms-pill-wrap.is-active").forEach((n) => n.classList.remove("is-active"));
          el.classList.add("is-active");
        }
        map.flyTo([c.lat, c.lng], Math.max(map.getZoom(), 15), { duration: 0.5 });
      });

      markers.push(marker);
    });

    cluster.addLayers(markers);

    // Fit bounds with padding once
    const group = L.featureGroup(markers);
    const bounds = group.getBounds();
    if (bounds.isValid()) {
      if (markers.length === 1) {
        map.flyTo(bounds.getCenter(), 15, { duration: 0.6 });
      } else {
        map.flyToBounds(bounds, { padding: [60, 60], duration: 0.7, maxZoom: 14 });
      }
    }
  }, [withCoords]);

  // Close active card if it's filtered out
  useEffect(() => {
    if (activeProperty && !filtered.find((p) => p.id === activeProperty.id)) {
      setActiveProperty(null);
    }
  }, [filtered, activeProperty]);

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
          {/* Map / List view */}
          <div className="flex-1 relative bg-muted min-h-[360px] lg:min-h-0">
            {view === "map" ? (
              <>
                <div ref={mapContainer} className="absolute inset-0" style={{ zIndex: 0 }} />

                {/* Active property card (desktop: floating; mobile: bottom sheet) */}
                {activeProperty && (
                  <div className="absolute left-3 right-3 bottom-3 sm:right-auto sm:max-w-[340px] z-[400] animate-fade-in-up">
                    <PropertyCard p={activeProperty} onClose={() => setActiveProperty(null)} />
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
          <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-border bg-card lg:max-h-[520px] lg:overflow-y-auto">
            <div className="flex items-center justify-between px-3 sm:px-4 pt-3 sm:pt-4 pb-2">
              <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider">
                По районам
              </p>
              {activeDistrict !== "Все" && (
                <button
                  onClick={() => { setActiveDistrict("Все"); setActiveProperty(null); }}
                  className="text-[10px] text-primary hover:underline"
                >
                  Сбросить
                </button>
              )}
            </div>

            <div className="flex lg:flex-col gap-1.5 px-3 sm:px-4 pb-3 sm:pb-4 overflow-x-auto lg:overflow-x-visible scrollbar-thin">
              <button
                type="button"
                onClick={() => { setActiveDistrict("Все"); setActiveProperty(null); }}
                className={`shrink-0 lg:w-full flex items-center gap-2 lg:justify-between px-3 py-2 lg:py-2.5 rounded-lg text-xs sm:text-sm whitespace-nowrap transition-colors ${
                  activeDistrict === "Все"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/40 text-foreground hover:bg-muted"
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
                      onClick={() => { setActiveDistrict(name); setActiveProperty(null); }}
                      className={`shrink-0 lg:w-full flex items-center gap-2 lg:justify-between px-3 py-2 lg:py-2.5 rounded-lg text-xs sm:text-sm whitespace-nowrap transition-colors ${
                        active
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted/40 text-foreground hover:bg-muted"
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

      <style>{`
        /* ---- Pill price marker ---- */
        .ms-pill-wrap {
          background: transparent !important;
          border: 0 !important;
        }
        .ms-pill {
          /* Anchor visually centered on the geo-point */
          transform: translate(-50%, -50%);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 6px 12px;
          border-radius: 9999px;
          background: #ffffff;
          color: hsl(220 25% 12%);
          font-family: Inter, system-ui, sans-serif;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.01em;
          line-height: 1;
          white-space: nowrap;
          border: 1px solid hsl(220 15% 88%);
          box-shadow:
            0 2px 4px hsl(220 25% 10% / 0.08),
            0 6px 14px -6px hsl(220 25% 10% / 0.18);
          cursor: pointer;
          transition:
            transform 0.2s cubic-bezier(0.32, 0.72, 0, 1),
            background 0.2s ease,
            color 0.2s ease,
            box-shadow 0.2s ease;
        }
        .ms-pill:hover {
          transform: translate(-50%, -50%) scale(1.1);
          box-shadow:
            0 4px 10px hsl(220 25% 10% / 0.12),
            0 12px 24px -8px hsl(220 25% 10% / 0.28);
          z-index: 5;
        }
        .ms-pill-wrap.is-active .ms-pill {
          background: hsl(0 72% 51%);
          color: #ffffff;
          border-color: hsl(0 72% 45%);
          box-shadow:
            0 4px 10px hsl(0 72% 40% / 0.30),
            0 12px 26px -8px hsl(0 72% 35% / 0.45);
        }

        /* ---- Cluster (synced with brand: clean blue) ---- */
        .ms-cluster-wrap {
          background: transparent !important;
          border: 0 !important;
        }
        .ms-cluster {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: linear-gradient(145deg, hsl(212 90% 56%), hsl(218 88% 46%));
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: Inter, system-ui, sans-serif;
          font-size: 13px;
          font-weight: 700;
          border: 3px solid #fff;
          box-shadow:
            0 2px 6px hsl(218 60% 30% / 0.25),
            0 8px 18px -6px hsl(218 60% 30% / 0.35);
          cursor: pointer;
          transition: transform 0.2s cubic-bezier(0.32, 0.72, 0, 1), box-shadow 0.2s ease;
        }
        .ms-cluster:hover {
          transform: scale(1.08);
          box-shadow:
            0 4px 10px hsl(218 60% 30% / 0.3),
            0 14px 26px -8px hsl(218 60% 30% / 0.45);
        }

        /* ---- Cleanup default Leaflet cluster styles ---- */
        .marker-cluster-small,
        .marker-cluster-medium,
        .marker-cluster-large,
        .marker-cluster-small div,
        .marker-cluster-medium div,
        .marker-cluster-large div {
          background: transparent !important;
          color: transparent !important;
          box-shadow: none !important;
        }

        /* Spiderfy lines stay subtle */
        .leaflet-cluster-spider-leg {
          stroke: hsl(220 15% 60%) !important;
          stroke-opacity: 0.5 !important;
        }

        /* Leaflet zoom controls */
        .leaflet-bar a {
          border-radius: 6px !important;
        }
        .leaflet-control-zoom {
          border: 0 !important;
          box-shadow: 0 4px 14px rgb(0 0 0 / 0.08) !important;
        }
      `}</style>
    </section>
  );
}

function PropertyCard({ p, onClose }: { p: DbProperty; onClose: () => void }) {
  return (
    <div className="bg-card rounded-xl shadow-card-hover overflow-hidden border border-border">
      <div className="relative h-32 bg-muted">
        <img
          src={getPropertyCover(p.cover_photo, p.type)}
          alt={p.address}
          className="w-full h-full object-cover"
        />
        <button
          onClick={onClose}
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
    </div>
  );
}
