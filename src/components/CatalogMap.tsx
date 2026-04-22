import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { Link } from "react-router-dom";
import type { DbProperty } from "@/hooks/useProperties";
import { MapPin, Maximize2, X, List } from "lucide-react";
import { getPropertyCover } from "@/lib/propertyImages";

const IRKUTSK_CENTER: [number, number] = [104.2807, 52.2869];

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

type Coords = { lng: number; lat: number };

function getCoords(p: DbProperty): Coords | null {
  const lat = (p as any).lat;
  const lng = (p as any).lng;
  if (typeof lat === "number" && typeof lng === "number" && !Number.isNaN(lat) && !Number.isNaN(lng)) {
    return { lat, lng };
  }
  return null;
}

export default function CatalogMap({ properties }: { properties: DbProperty[] }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(true);
  const markersRef = useRef<Record<string, mapboxgl.Marker>>({});

  // Init map (no Mapbox token needed — using CARTO raster tiles)
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    mapboxgl.accessToken = "no-token-needed";
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: GRAY_STYLE,
      center: IRKUTSK_CENTER,
      zoom: 11,
      attributionControl: true,
      scrollZoom: false,
      doubleClickZoom: true,
      touchZoomRotate: true,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current = {};
    };
  }, []);

  useEffect(() => {
    if (activeId && !properties.find((p) => p.id === activeId)) {
      setActiveId(null);
    }
  }, [properties, activeId]);

  // Sync markers + auto-fit
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const visibleIds = new Set(properties.map((p) => p.id));
    Object.keys(markersRef.current).forEach((id) => {
      if (!visibleIds.has(id)) {
        markersRef.current[id]?.remove();
        delete markersRef.current[id];
      }
    });

    const bounds = new mapboxgl.LngLatBounds();
    let hasPoints = 0;

    properties.forEach((p) => {
      const c = getCoords(p);
      if (!c) return;
      bounds.extend([c.lng, c.lat]);
      hasPoints++;

      if (markersRef.current[p.id]) {
        const el = markersRef.current[p.id].getElement();
        el.classList.toggle("is-active", activeId === p.id);
        return;
      }

      const el = document.createElement("button");
      el.type = "button";
      el.className = `price-pin ${activeId === p.id ? "is-active" : ""}`;
      const price = Number(p.price);
      const compact =
        price >= 1_000_000 ? `${(price / 1_000_000).toFixed(price >= 10_000_000 ? 0 : 1)}M`
        : price >= 1_000 ? `${Math.round(price / 1000)}k`
        : `${price}`;
      el.textContent = `${compact} ₽`;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        setActiveId(p.id);
        map.easeTo({ center: [c.lng, c.lat], duration: 400 });
      });

      const marker = new mapboxgl.Marker({ element: el, anchor: "bottom" })
        .setLngLat([c.lng, c.lat])
        .addTo(map);
      markersRef.current[p.id] = marker;
    });

    if (hasPoints >= 2) {
      try {
        map.fitBounds(bounds, { padding: 80, maxZoom: 14, duration: 600 });
      } catch { }
    } else if (hasPoints === 1) {
      const only = properties.find((p) => getCoords(p));
      const c = only ? getCoords(only) : null;
      if (c) map.easeTo({ center: [c.lng, c.lat], zoom: 14, duration: 600 });
    } else {
      map.easeTo({ center: IRKUTSK_CENTER, zoom: 11, duration: 600 });
    }
  }, [properties, activeId]);

  const activeProperty = useMemo(
    () => properties.find((p) => p.id === activeId) || null,
    [activeId, properties]
  );

  const focusProperty = (p: DbProperty) => {
    const map = mapRef.current;
    const c = getCoords(p);
    if (!map || !c) {
      setActiveId(p.id);
      return;
    }
    setActiveId(p.id);
    map.easeTo({ center: [c.lng, c.lat], zoom: Math.max(map.getZoom(), 13), duration: 500 });
  };

  const withCoords = properties.filter(getCoords).length;

  return (
    <div className="relative flex h-[calc(100vh-180px)] min-h-[520px] bg-card overflow-hidden">
      <aside className="hidden lg:flex w-[360px] xl:w-[400px] shrink-0 flex-col border-r border-border overflow-hidden">
        <div className="px-4 py-2.5 border-b border-border text-[11px] text-muted-foreground">
          <strong className="text-foreground">{properties.length}</strong> объектов · {withCoords} на карте
        </div>
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {properties.map((p) => (
            <MapListItem key={p.id} p={p} active={activeId === p.id} onClick={() => focusProperty(p)} />
          ))}
          {properties.length === 0 && (
            <div className="p-6 text-center text-xs text-muted-foreground">Нет объектов</div>
          )}
        </div>
      </aside>

      <div className="flex-1 relative bg-muted">
        <div ref={mapContainer} className="absolute inset-0" />

        {activeProperty && (
          <div className="hidden lg:block absolute bottom-4 left-4 w-[320px] z-10 animate-fade-in-up">
            <ActiveCard p={activeProperty} onClose={() => setActiveId(null)} />
          </div>
        )}

        <div className="lg:hidden absolute inset-x-0 bottom-0 z-10">
          <button
            onClick={() => setListOpen((v) => !v)}
            className="w-full bg-card border-t border-border px-4 py-2 flex items-center justify-between text-xs"
          >
            <span className="font-medium text-foreground">
              {properties.length} объектов
            </span>
            <span className="flex items-center gap-1 text-primary font-medium">
              <List className="w-3.5 h-3.5" />
              {listOpen ? "Скрыть" : "Список"}
            </span>
          </button>

          {!listOpen && activeProperty && (
            <div className="bg-card border-t border-border p-3 animate-fade-in-up">
              <ActiveCard p={activeProperty} onClose={() => setActiveId(null)} compact />
            </div>
          )}

          {listOpen && (
            <div className="bg-card border-t border-border">
              <div className="flex gap-2 overflow-x-auto p-3 snap-x snap-mandatory scrollbar-none">
                {properties.slice(0, 30).map((p) => (
                  <button
                    key={p.id}
                    onClick={() => focusProperty(p)}
                    className={`shrink-0 snap-start w-[260px] text-left bg-background border ${
                      activeId === p.id ? "border-primary" : "border-border"
                    } overflow-hidden transition-colors`}
                  >
                    <MobileCard p={p} />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .price-pin {
          font-family: 'Inter', system-ui, sans-serif;
          font-size: 11px;
          font-weight: 700;
          color: hsl(220, 25%, 10%);
          background: #fff;
          border: 1px solid hsl(220, 25%, 10%);
          padding: 4px 8px;
          cursor: pointer;
          white-space: nowrap;
          transform: translateY(0);
          transition: transform 160ms ease, background 160ms ease, color 160ms ease;
          line-height: 1;
        }
        .price-pin:hover {
          background: hsl(220, 25%, 10%);
          color: #fff;
          z-index: 5;
        }
        .price-pin.is-active {
          background: hsl(0, 72%, 51%);
          color: #fff;
          border-color: hsl(0, 72%, 51%);
          z-index: 10;
          transform: translateY(-2px) scale(1.05);
        }
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { scrollbar-width: none; }
      `}</style>
    </div>
  );
}

function MapListItem({ p, active, onClick }: { p: DbProperty; active: boolean; onClick: () => void }) {
  const hasCoords = getCoords(p) !== null;
  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 flex gap-3 transition-colors ${
        active ? "bg-primary/5" : "hover:bg-muted/60"
      }`}
    >
      <div className="w-20 h-20 shrink-0 bg-muted overflow-hidden">
        <img
          src={getPropertyCover(p.cover_photo, p.type)}
          alt={p.address}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="px-1.5 py-0.5 bg-primary text-primary-foreground text-[9px] font-semibold uppercase tracking-wide">
            {p.deal_type}
          </span>
          <span className="text-[10px] text-muted-foreground">{p.type}</span>
          {!hasCoords && (
            <span className="text-[9px] text-muted-foreground/70 italic">без координат</span>
          )}
        </div>
        <div className="font-display text-sm font-bold text-foreground truncate">
          {Number(p.price).toLocaleString("ru-RU")} ₽
          {p.deal_type === "Аренда" && <span className="text-[10px] font-normal text-muted-foreground">/мес</span>}
        </div>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground truncate">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{p.address}</span>
        </div>
        <div className="text-[11px] text-foreground mt-0.5 flex items-center gap-1">
          <Maximize2 className="w-3 h-3 text-muted-foreground" /> {p.area} м²
        </div>
      </div>
    </button>
  );
}

function ActiveCard({ p, onClose, compact = false }: { p: DbProperty; onClose: () => void; compact?: boolean }) {
  return (
    <div className="bg-card border border-border overflow-hidden">
      <div className="flex">
        <div className={`${compact ? "w-24 h-24" : "w-28 h-28"} shrink-0 bg-muted overflow-hidden`}>
          <img
            src={getPropertyCover(p.cover_photo, p.type)}
            alt={p.address}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0 p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="px-1.5 py-0.5 bg-primary text-primary-foreground text-[9px] font-semibold uppercase tracking-wide">
                  {p.deal_type}
                </span>
                <span className="text-[10px] text-muted-foreground">{p.type}</span>
              </div>
              <div className="font-display text-base font-bold text-foreground truncate">
                {Number(p.price).toLocaleString("ru-RU")} ₽
                {p.deal_type === "Аренда" && <span className="text-[10px] font-normal text-muted-foreground">/мес</span>}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground truncate">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{p.address}</span>
              </div>
              <div className="text-[11px] text-foreground mt-0.5">{p.area} м² · {p.district}</div>
            </div>
            <button onClick={onClose} className="p-1 -mr-1 -mt-1 text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <Link
            to={`/property/${p.id}`}
            className="mt-2 inline-flex w-full justify-center px-3 py-1.5 bg-primary text-primary-foreground text-[11px] font-semibold hover:opacity-90 transition-opacity"
          >
            Открыть карточку
          </Link>
        </div>
      </div>
    </div>
  );
}

function MobileCard({ p }: { p: DbProperty }) {
  return (
    <>
      <div className="h-28 bg-muted overflow-hidden">
        <img
          src={getPropertyCover(p.cover_photo, p.type)}
          alt={p.address}
          loading="lazy"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-2.5">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="px-1.5 py-0.5 bg-primary text-primary-foreground text-[9px] font-semibold uppercase tracking-wide">
            {p.deal_type}
          </span>
          <span className="text-[10px] text-muted-foreground">{p.type}</span>
        </div>
        <div className="font-display text-sm font-bold text-foreground truncate">
          {Number(p.price).toLocaleString("ru-RU")} ₽
        </div>
        <div className="text-[10px] text-muted-foreground truncate">{p.address}</div>
      </div>
    </>
  );
}
