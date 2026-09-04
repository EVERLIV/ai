import { useEffect, useRef, useState } from "react";
import YandexMapFallback from "@/components/YandexMapFallback";
import type { DbProperty } from "@/hooks/useProperties";
import { buildPropertyDisplayTitle } from "@/lib/propertyCard";
import { getCoords, type Coords } from "@/lib/propertyGeo";
import { IRKUTSK_CENTER_LNGLAT, loadYandexMaps } from "@/lib/yandexMaps";

interface Props {
  properties: DbProperty[];
  activeId: string | null;
  onMarkerClick: (id: string) => void;
  onMarkerHover?: (id: string | null) => void;
}

export default function CatalogMiniMap({
  properties,
  activeId,
  onMarkerClick,
  onMarkerHover,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const ymapsRef = useRef<any>(null);
  const markersRef = useRef<Map<string, { marker: any; el: HTMLElement }>>(
    new Map(),
  );
  const [mapReady, setMapReady] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let map: any = null;

    loadYandexMaps()
      .then((ymaps3) => {
        if (cancelled || !containerRef.current) return;
        setMapFailed(false);
        ymapsRef.current = ymaps3;
        const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer } =
          ymaps3;

        map = new YMap(containerRef.current, {
          location: { center: IRKUTSK_CENTER_LNGLAT, zoom: 11 },
        });
        map.addChild(new YMapDefaultSchemeLayer({}));
        map.addChild(new YMapDefaultFeaturesLayer({}));
        mapRef.current = map;
        setMapReady(true);
      })
      .catch(() => {
        if (!cancelled) setMapFailed(true);
      });

    return () => {
      cancelled = true;
      markersRef.current.clear();
      try {
        map?.destroy?.();
      } catch {}
      mapRef.current = null;
      ymapsRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const ymaps3 = ymapsRef.current;
    if (!map || !ymaps3 || !mapReady) return;
    const { YMapMarker } = ymaps3;

    markersRef.current.forEach(({ marker }) => {
      try {
        map.removeChild(marker);
      } catch {}
    });
    markersRef.current.clear();

    const points: Coords[] = [];

    properties.forEach((p) => {
      const c = getCoords(p);
      if (!c) return;
      points.push(c);

      const el = document.createElement("button");
      el.type = "button";
      el.className = "cm-mini-pin";
      el.setAttribute("aria-label", buildPropertyDisplayTitle(p));
      el.innerHTML = `<span class="cm-mini-pin__dot"></span>`;

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        onMarkerClick(p.id);
      });
      el.addEventListener("mouseenter", () => onMarkerHover?.(p.id));
      el.addEventListener("mouseleave", () => onMarkerHover?.(null));

      const marker = new YMapMarker({ coordinates: [c.lng, c.lat] }, el);
      map.addChild(marker);
      markersRef.current.set(p.id, { marker, el });
    });

    markersRef.current.forEach(({ el }, id) => {
      el.classList.toggle("is-active", id === activeId);
    });

    if (points.length >= 2) {
      const lngs = points.map((p) => p.lng);
      const lats = points.map((p) => p.lat);
      try {
        map.update({
          location: {
            bounds: [
              [Math.min(...lngs), Math.min(...lats)],
              [Math.max(...lngs), Math.max(...lats)],
            ],
            duration: 400,
          },
        });
      } catch {
        map.update({
          location: { center: [points[0].lng, points[0].lat], zoom: 11 },
        });
      }
    } else if (points.length === 1) {
      map.update({
        location: {
          center: [points[0].lng, points[0].lat],
          zoom: 13,
          duration: 400,
        },
      });
    }
  }, [properties, mapReady, activeId, onMarkerClick, onMarkerHover]);

  useEffect(() => {
    markersRef.current.forEach(({ el }, id) => {
      el.classList.toggle("is-active", id === activeId);
    });
    const map = mapRef.current;
    if (!map || !activeId) return;
    const p = properties.find((x) => x.id === activeId);
    const c = p ? getCoords(p) : null;
    if (c) {
      map.update({
        location: { center: [c.lng, c.lat], zoom: 13, duration: 300 },
      });
    }
  }, [activeId, properties]);

  const withCoords = properties.filter((p) => getCoords(p));
  const fallbackPoints = withCoords
    .map((p) => getCoords(p)!)
    .map((c) => [c.lng, c.lat] as [number, number]);

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-muted">
      <div className="px-2 py-1.5 border-b border-border/60 text-[10px] text-muted-foreground">
        <strong className="text-foreground">{withCoords.length}</strong> на карте
      </div>
      <div className="relative h-[140px] 2xl:h-[160px]">
        <div ref={containerRef} className="absolute inset-0" />
        {mapFailed && (
          <YandexMapFallback
            center={fallbackPoints[0] ?? IRKUTSK_CENTER_LNGLAT}
            points={fallbackPoints}
            zoom={fallbackPoints.length > 1 ? 9 : 12}
            label="Карта выдачи"
          />
        )}
      </div>
      <style>{`
        .cm-mini-pin {
          border: none;
          background: transparent;
          padding: 0;
          cursor: pointer;
          transform: translate(-50%, -50%);
          transition: transform 160ms ease;
        }
        .cm-mini-pin__dot {
          display: block;
          width: 10px;
          height: 10px;
          border-radius: 9999px;
          background: hsl(var(--primary));
          border: 2px solid white;
          box-shadow: 0 1px 4px rgba(0,0,0,0.25);
        }
        .cm-mini-pin:hover { transform: translate(-50%, -50%) scale(1.2); z-index: 5; }
        .cm-mini-pin.is-active .cm-mini-pin__dot {
          width: 14px;
          height: 14px;
          background: hsl(0 72% 42%);
        }
      `}</style>
    </div>
  );
}
