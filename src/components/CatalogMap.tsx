import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { DbProperty } from "@/hooks/useProperties";
import { MapPin, Maximize2, X, List, Eye } from "lucide-react";
import { getPropertyCover } from "@/lib/propertyImages";
import { getCoords, hasStreetView, type Coords } from "@/lib/propertyGeo";
import { loadYandexMaps, IRKUTSK_CENTER_LNGLAT } from "@/lib/yandexMaps";
import StreetViewModal from "./StreetViewModal";
import YandexMapFallback from "./YandexMapFallback";

export default function CatalogMap({ properties }: { properties: DbProperty[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const ymapsRef = useRef<any>(null);
  const markersRef = useRef<Map<string, { marker: any; el: HTMLElement }>>(new Map());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const [streetViewFor, setStreetViewFor] = useState<DbProperty | null>(null);

  useEffect(() => {
    let cancelled = false;
    let map: any = null;

    loadYandexMaps()
      .then((ymaps3) => {
        if (cancelled || !containerRef.current) return;
        setMapFailed(false);
        ymapsRef.current = ymaps3;
        const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer, YMapControls } = ymaps3;
        const { YMapZoomControl } = ymaps3.controls ?? {};

        map = new YMap(containerRef.current, {
          location: { center: IRKUTSK_CENTER_LNGLAT, zoom: 11 },
        });
        map.addChild(new YMapDefaultSchemeLayer({}));
        map.addChild(new YMapDefaultFeaturesLayer({}));
        if (YMapZoomControl) {
          const controls = new YMapControls({ position: "right" });
          controls.addChild(new YMapZoomControl({}));
          map.addChild(controls);
        }
        mapRef.current = map;
        setMapReady(true);
      })
      .catch((e) => {
        console.error("Yandex Maps load failed:", e);
        if (!cancelled) setMapFailed(true);
      });

    return () => {
      cancelled = true;
      markersRef.current.clear();
      try { map?.destroy?.(); } catch {}
      mapRef.current = null;
      ymapsRef.current = null;
    };
  }, []);

  // Sync markers
  useEffect(() => {
    const map = mapRef.current;
    const ymaps3 = ymapsRef.current;
    if (!map || !ymaps3 || !mapReady) return;
    const { YMapMarker } = ymaps3;

    markersRef.current.forEach(({ marker }) => {
      try { map.removeChild(marker); } catch {}
    });
    markersRef.current.clear();

    const points: Coords[] = [];

    properties.forEach((p) => {
      const c = getCoords(p);
      if (!c) return;
      points.push(c);

      const el = document.createElement("button");
      el.type = "button";
      el.className = `cm-pin${activeId === p.id ? " is-active" : ""}`;
      el.setAttribute("aria-label", p.address);
      el.innerHTML = `
        <span class="cm-pin__dot">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        </span>
      `;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        focusProperty(p);
      });

      const marker = new YMapMarker({ coordinates: [c.lng, c.lat] }, el);
      map.addChild(marker);
      markersRef.current.set(p.id, { marker, el });
    });

    if (points.length >= 2) {
      const lngs = points.map((p) => p.lng);
      const lats = points.map((p) => p.lat);
      const bounds: [[number, number], [number, number]] = [
        [Math.min(...lngs), Math.min(...lats)],
        [Math.max(...lngs), Math.max(...lats)],
      ];
      try {
        map.update({ location: { bounds, duration: 500 } });
      } catch {
        map.update({ location: { center: [points[0].lng, points[0].lat], zoom: 12 } });
      }
    } else if (points.length === 1) {
      map.update({ location: { center: [points[0].lng, points[0].lat], zoom: 14, duration: 500 } });
    } else {
      map.update({ location: { center: IRKUTSK_CENTER_LNGLAT, zoom: 11, duration: 500 } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [properties, mapReady]);

  // Active state toggle
  useEffect(() => {
    markersRef.current.forEach(({ el }, id) => {
      el.classList.toggle("is-active", id === activeId);
    });
  }, [activeId]);

  useEffect(() => {
    if (activeId && !properties.find((p) => p.id === activeId)) setActiveId(null);
  }, [properties, activeId]);

  const activeProperty = useMemo(
    () => properties.find((p) => p.id === activeId) || null,
    [activeId, properties]
  );

  const focusProperty = (p: DbProperty) => {
    const c = getCoords(p);
    setActiveId(p.id);
    const map = mapRef.current;
    if (map && c) {
      map.update({ location: { center: [c.lng, c.lat], zoom: 14, duration: 400 } });
    }
  };

  const withCoords = properties.filter(getCoords).length;
  const fallbackPoints = properties
    .map((p) => getCoords(p))
    .filter((c): c is Coords => c !== null)
    .map((c) => [c.lng, c.lat] as [number, number]);

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
        <div ref={containerRef} className="absolute inset-0" />

        {mapFailed && (
          <YandexMapFallback
            center={fallbackPoints[0] ?? IRKUTSK_CENTER_LNGLAT}
            points={fallbackPoints}
            zoom={fallbackPoints.length > 1 ? 9 : 14}
            label="Карта каталога объектов"
          />
        )}

        {activeProperty && (
          <div className="hidden lg:block absolute bottom-4 left-4 w-[320px] z-10 animate-fade-in-up">
            <ActiveCard
              p={activeProperty}
              onClose={() => setActiveId(null)}
              onStreetView={() => setStreetViewFor(activeProperty)}
            />
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
              <ActiveCard
                p={activeProperty}
                onClose={() => setActiveId(null)}
                onStreetView={() => setStreetViewFor(activeProperty)}
                compact
              />
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
        .cm-pin {
          background: transparent;
          border: 0;
          padding: 0;
          cursor: pointer;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          width: 30px;
          height: 38px;
          transform: translate(-50%, -100%);
          transition: transform 160ms ease;
        }
        .cm-pin__dot {
          width: 30px;
          height: 30px;
          border-radius: 50% 50% 50% 0;
          background: hsl(0, 72%, 51%);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(-45deg);
          border: 2px solid #fff;
          box-shadow: 0 4px 10px rgba(0,0,0,0.25), 0 1px 2px rgba(0,0,0,0.15);
        }
        .cm-pin__dot > svg { transform: rotate(45deg); }
        .cm-pin:hover { transform: translate(-50%, -100%) scale(1.08); z-index: 5; }
        .cm-pin.is-active { z-index: 10; transform: translate(-50%, -100%) scale(1.18); }
        .cm-pin.is-active .cm-pin__dot {
          background: hsl(220, 25%, 10%);
          box-shadow: 0 6px 16px rgba(0,0,0,0.35), 0 0 0 4px hsl(0, 72%, 51% / 0.25);
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
        <img src={getPropertyCover(p.cover_photo, p.type)} alt={p.address} loading="lazy" className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="px-1.5 py-0.5 bg-primary text-primary-foreground text-[9px] font-semibold uppercase tracking-wide">
            {p.deal_type}
          </span>
          <span className="text-[10px] text-muted-foreground">{p.type}</span>
          {!hasCoords && <span className="text-[9px] text-muted-foreground/70 italic">без координат</span>}
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

function ActiveCard({
  p, onClose, onStreetView, compact = false,
}: { p: DbProperty; onClose: () => void; onStreetView: () => void; compact?: boolean }) {
  const showStreetView = hasStreetView(p);
  return (
    <div className="bg-card border border-border overflow-hidden">
      <div className="flex">
        <div className={`${compact ? "w-24 h-24" : "w-28 h-28"} shrink-0 bg-muted overflow-hidden`}>
          <img src={getPropertyCover(p.cover_photo, p.type)} alt={p.address} loading="lazy" className="w-full h-full object-cover" />
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
          <div className="mt-2 flex gap-1.5">
            {showStreetView && (
              <button onClick={onStreetView} className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 bg-muted text-foreground text-[11px] font-semibold hover:bg-muted/70 transition-colors">
                <Eye className="w-3 h-3" /> Улица
              </button>
            )}
            <Link to={`/property/${p.id}`} className="flex-1 inline-flex justify-center px-3 py-1.5 bg-primary text-primary-foreground text-[11px] font-semibold hover:opacity-90 transition-opacity">
              Карточка
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileCard({ p }: { p: DbProperty }) {
  return (
    <>
      <div className="h-28 bg-muted overflow-hidden">
        <img src={getPropertyCover(p.cover_photo, p.type)} alt={p.address} loading="lazy" className="w-full h-full object-cover" />
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
