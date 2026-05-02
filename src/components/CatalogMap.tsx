import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { GoogleMap, useJsApiLoader, OverlayView } from "@react-google-maps/api";
import { Link } from "react-router-dom";
import type { DbProperty } from "@/hooks/useProperties";
import { MapPin, Maximize2, X, List } from "lucide-react";
import { getPropertyCover } from "@/lib/propertyImages";

const IRKUTSK_CENTER = { lat: 52.2869, lng: 104.2807 };
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

type Coords = { lng: number; lat: number };

function getCoords(p: DbProperty): Coords | null {
  const lat = (p as any).lat;
  const lng = (p as any).lng;
  if (typeof lat === "number" && typeof lng === "number" && !Number.isNaN(lat) && !Number.isNaN(lng)) {
    return { lat, lng };
  }
  return null;
}

// Subtle light gray map style (Google Maps native)
const MAP_STYLES: google.maps.MapTypeStyle[] = [
  { elementType: "geometry", stylers: [{ color: "#f5f3ef" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6b6b6b" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f5f3ef" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "off" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#dfe7ec" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#7d97a6" }] },
];

const MAP_OPTIONS: google.maps.MapOptions = {
  styles: MAP_STYLES,
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: false,
  scrollwheel: false,
  clickableIcons: false,
  gestureHandling: "cooperative",
};

export default function CatalogMap({ properties }: { properties: DbProperty[] }) {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });
  const mapRef = useRef<google.maps.Map | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(true);

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);
  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  useEffect(() => {
    if (activeId && !properties.find((p) => p.id === activeId)) {
      setActiveId(null);
    }
  }, [properties, activeId]);

  // Auto-fit bounds when properties change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isLoaded) return;
    const points = properties.map(getCoords).filter(Boolean) as Coords[];
    if (points.length >= 2) {
      const bounds = new google.maps.LatLngBounds();
      points.forEach((c) => bounds.extend(c));
      map.fitBounds(bounds, 80);
    } else if (points.length === 1) {
      map.panTo(points[0]);
      map.setZoom(14);
    } else {
      map.panTo(IRKUTSK_CENTER);
      map.setZoom(11);
    }
  }, [properties, isLoaded]);

  const activeProperty = useMemo(
    () => properties.find((p) => p.id === activeId) || null,
    [activeId, properties]
  );

  const focusProperty = (p: DbProperty) => {
    const c = getCoords(p);
    setActiveId(p.id);
    const map = mapRef.current;
    if (map && c) {
      map.panTo(c);
      map.setZoom(Math.max(map.getZoom() ?? 13, 13));
    }
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
        {!isLoaded ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
            Загрузка карты…
          </div>
        ) : (
          <GoogleMap
            mapContainerClassName="absolute inset-0"
            center={IRKUTSK_CENTER}
            zoom={11}
            options={MAP_OPTIONS}
            onLoad={onLoad}
            onUnmount={onUnmount}
          >
            {properties.map((p) => {
              const c = getCoords(p);
              if (!c) return null;
              const price = Number(p.price);
              const compact =
                price >= 1_000_000 ? `${(price / 1_000_000).toFixed(price >= 10_000_000 ? 0 : 1)}M`
                : price >= 1_000 ? `${Math.round(price / 1000)}k`
                : `${price}`;
              const isActive = activeId === p.id;
              return (
                <OverlayView
                  key={p.id}
                  position={c}
                  mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                  getPixelPositionOffset={(w, h) => ({ x: -w / 2, y: -h })}
                >
                  <button
                    type="button"
                    className={`price-pin ${isActive ? "is-active" : ""}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      focusProperty(p);
                    }}
                  >
                    {compact} ₽
                  </button>
                </OverlayView>
              );
            })}
          </GoogleMap>
        )}

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
            <span className="font-medium text-foreground">{properties.length} объектов</span>
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
