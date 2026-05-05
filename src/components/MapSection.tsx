import { useEffect, useMemo, useRef, useState } from "react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useProperties, type DbProperty } from "@/hooks/useProperties";
import { List, Map as MapIcon, MapPin, ArrowRight, Eye, X } from "lucide-react";
import { Link } from "react-router-dom";
import { getPropertyCover } from "@/lib/propertyImages";
import { getCoords, hasStreetView, type Coords } from "@/lib/propertyGeo";
import { loadYandexMaps, IRKUTSK_CENTER_LNGLAT } from "@/lib/yandexMaps";
import StreetViewModal from "./StreetViewModal";

export default function MapSection() {
  const { ref, isVisible } = useScrollReveal();
  const [view, setView] = useState<"map" | "list">("map");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeDistrict, setActiveDistrict] = useState<string>("Все");
  const [streetViewFor, setStreetViewFor] = useState<DbProperty | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const ymapsRef = useRef<any>(null);
  const markersRef = useRef<Map<string, { marker: any; el: HTMLElement }>>(new Map());
  const [mapReady, setMapReady] = useState(false);

  const { data: properties = [] } = useProperties();

  const filtered = useMemo(
    () => (activeDistrict === "Все" ? properties : properties.filter((p) => p.district === activeDistrict)),
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

  // ---- Init Yandex Map ----
  useEffect(() => {
    if (view !== "map" || !containerRef.current || mapRef.current) return;
    let cancelled = false;
    let map: any = null;

    loadYandexMaps()
      .then((ymaps3) => {
        if (cancelled || !containerRef.current) return;
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
      .catch((e) => console.error("Yandex Maps load failed:", e));

    return () => {
      cancelled = true;
      markersRef.current.clear();
      try { map?.destroy?.(); } catch {}
      mapRef.current = null;
      ymapsRef.current = null;
      setMapReady(false);
    };
  }, [view]);

  // ---- Sync markers ----
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

    withCoords.forEach((p) => {
      const c = getCoords(p)!;
      points.push(c);

      const el = document.createElement("button");
      el.type = "button";
      el.className = `ms-pin${activeId === p.id ? " is-active" : ""}`;
      el.setAttribute("aria-label", p.address);
      el.innerHTML = `
        <span class="ms-pin__dot">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
        </span>
      `;
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        setActiveId(p.id);
        map.update({ location: { center: [c.lng, c.lat], zoom: 14, duration: 400 } });
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
  }, [withCoords, mapReady]);

  useEffect(() => {
    markersRef.current.forEach(({ el }, id) => {
      el.classList.toggle("is-active", id === activeId);
    });
  }, [activeId]);

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
        .ms-pin {
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
          transition: transform 180ms cubic-bezier(.2,.8,.2,1);
        }
        .ms-pin__dot {
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
        .ms-pin__dot > svg { transform: rotate(45deg); }
        .ms-pin:hover { transform: translate(-50%, -100%) scale(1.08); z-index: 5; }
        .ms-pin.is-active { z-index: 10; transform: translate(-50%, -100%) scale(1.18); }
        .ms-pin.is-active .ms-pin__dot {
          background: hsl(220, 25%, 10%);
          box-shadow: 0 6px 16px rgba(0,0,0,0.35), 0 0 0 4px hsl(0, 72%, 51% / 0.25);
        }
      `}</style>
    </section>
  );
}

function PropertyCard({
  p, onClose, onStreetView,
}: { p: DbProperty; onClose: () => void; onStreetView: () => void }) {
  const showStreetView = hasStreetView(p);
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
        {showStreetView && (
          <button
            onClick={onStreetView}
            className="absolute bottom-2 right-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-foreground/90 backdrop-blur text-background text-[10px] font-semibold hover:bg-foreground transition-colors"
          >
            <Eye className="w-3 h-3" /> Вид с улицы
          </button>
        )}
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
          {showStreetView && (
            <button
              onClick={onStreetView}
              className="flex-1 inline-flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-semibold bg-muted text-foreground hover:bg-muted/70 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" /> Улица
            </button>
          )}
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
