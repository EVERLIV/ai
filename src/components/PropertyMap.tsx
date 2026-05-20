import { useEffect, useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Eye, ExternalLink, MapPin, Building2 } from "lucide-react";
import StreetViewModal from "./StreetViewModal";
import { loadYandexMaps, IRKUTSK_CENTER_LNGLAT } from "@/lib/yandexMaps";
import YandexMapFallback from "./YandexMapFallback";

interface PropertyMapProps {
  address: string;
  district?: string;
  lat?: number | null;
  lng?: number | null;
  height?: number;
}

export default function PropertyMap({ address, district, lat, lng, height = 320 }: PropertyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const [streetOpen, setStreetOpen] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);

  const hasCoords =
    typeof lat === "number" &&
    typeof lng === "number" &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng) &&
    !(lat === 0 && lng === 0);
  const center: [number, number] = hasCoords ? [lng!, lat!] : IRKUTSK_CENTER_LNGLAT;

  useEffect(() => {
    let cancelled = false;
    let map: any = null;

    loadYandexMaps()
      .then((ymaps3) => {
        if (cancelled || !containerRef.current) return;
        setMapFailed(false);
        const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer, YMapMarker, YMapControls } = ymaps3;
        const { YMapZoomControl } = ymaps3.controls ?? {};

        map = new YMap(containerRef.current, {
          location: { center, zoom: hasCoords ? 16 : 11 },
          behaviors: ["drag", "pinchZoom"],
        });
        map.addChild(new YMapDefaultSchemeLayer({}));
        map.addChild(new YMapDefaultFeaturesLayer({}));

        if (YMapZoomControl) {
          const controls = new YMapControls({ position: "right" });
          controls.addChild(new YMapZoomControl({}));
          map.addChild(controls);
        }

        if (hasCoords) {
          const el = document.createElement("div");
          el.className = "pm-pin";
          const shortAddr = address.split(",").slice(0, 2).join(",").trim();
          const iconSvg = renderToStaticMarkup(
            <MapPin size={16} color="#fff" strokeWidth={2.5} />
          );
          el.innerHTML = `
            <div class="pm-pin__bubble">
              <span class="pm-pin__icon">${iconSvg}</span>
              <span class="pm-pin__text">${shortAddr}</span>
            </div>
            <div class="pm-pin__tail"></div>
          `;
          map.addChild(new YMapMarker({ coordinates: center }, el));
        }

        mapRef.current = map;
      })
      .catch((e) => {
        console.error("Yandex Maps load failed:", e);
        if (!cancelled) setMapFailed(true);
      });

    return () => {
      cancelled = true;
      try { map?.destroy?.(); } catch {}
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const yandexUrl = hasCoords
    ? `https://yandex.ru/maps/?ll=${lng},${lat}&z=16&pt=${lng},${lat},pm2rdm`
    : null;

  return (
    <div className="space-y-3">
      <div className="relative bg-muted overflow-hidden rounded-xl" style={{ height }}>
        <div ref={containerRef} className="absolute inset-0" style={{ filter: "grayscale(0.6) contrast(0.92) brightness(1.08)" }} />

        {mapFailed && (
          <YandexMapFallback
            center={center}
            points={hasCoords ? [center] : []}
            zoom={hasCoords ? 16 : 11}
            label={`Карта: ${address}`}
          />
        )}

        {!hasCoords && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground bg-background/60 backdrop-blur-sm pointer-events-none">
            <MapPin className="w-5 h-5 text-primary" />
            <span>Координаты для этого объекта не указаны</span>
            <span className="text-[10px] opacity-70">
              {address}
              {district && ` · ${district}`}
            </span>
          </div>
        )}

        {streetOpen && hasCoords && (
          <StreetViewModal lat={lat!} lng={lng!} address={address} onClose={() => setStreetOpen(false)} />
        )}
      </div>

      {hasCoords && (
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setStreetOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <Eye className="w-3.5 h-3.5" /> Вид с улицы
          </button>
          {yandexUrl && (
            <a
              href={yandexUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card text-xs font-semibold text-foreground hover:bg-muted transition-colors"
            >
              Открыть в Яндекс Картах <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      <style>{`
        .pm-pin {
          display: flex;
          flex-direction: column;
          align-items: center;
          transform: translate(-50%, -100%);
          pointer-events: none;
          filter: drop-shadow(0 4px 12px rgba(0,0,0,0.28));
        }
        .pm-pin__bubble {
          display: flex;
          align-items: center;
          gap: 5px;
          background: #c0392b;
          color: #fff;
          font-size: 12px;
          font-weight: 600;
          font-family: system-ui, -apple-system, sans-serif;
          padding: 6px 10px 6px 8px;
          white-space: nowrap;
          letter-spacing: 0.01em;
          line-height: 1;
          border-radius: 2px;
        }
        .pm-pin__icon {
          display: flex;
          align-items: center;
          opacity: 0.9;
          flex-shrink: 0;
        }
        .pm-pin__text {
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .pm-pin__tail {
          width: 0;
          height: 0;
          border-left: 7px solid transparent;
          border-right: 7px solid transparent;
          border-top: 8px solid #c0392b;
        }
      `}</style>
    </div>
  );
}
