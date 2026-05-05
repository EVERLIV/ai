import { useEffect, useRef, useState } from "react";
import { Eye, MapPin } from "lucide-react";
import StreetViewModal from "./StreetViewModal";
import { loadYandexMaps, IRKUTSK_CENTER_LNGLAT } from "@/lib/yandexMaps";

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
        const { YMap, YMapDefaultSchemeLayer, YMapDefaultFeaturesLayer, YMapMarker, YMapControls } = ymaps3;
        const { YMapZoomControl } = ymaps3.controls ?? {};

        map = new YMap(containerRef.current, {
          location: { center, zoom: hasCoords ? 16 : 11 },
          behaviors: ["drag", "pinchZoom", "mouseRotate", "mouseTilt"],
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
          el.innerHTML = `
            <span class="pm-pin__dot">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </span>
          `;
          map.addChild(new YMapMarker({ coordinates: center }, el));
        }

        mapRef.current = map;
      })
      .catch((e) => console.error("Yandex Maps load failed:", e));

    return () => {
      cancelled = true;
      try { map?.destroy?.(); } catch {}
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative bg-muted overflow-hidden rounded-xl" style={{ height }}>
      <div ref={containerRef} className="absolute inset-0" />

      {hasCoords && (
        <button
          type="button"
          onClick={() => setStreetOpen(true)}
          className="absolute bottom-3 left-3 z-[5] inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-foreground text-background text-xs font-semibold shadow-card-hover hover:opacity-90 transition-opacity"
        >
          <Eye className="w-3.5 h-3.5" /> Вид с улицы
        </button>
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

      <style>{`
        .pm-pin {
          position: relative;
          width: 32px;
          height: 40px;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          transform: translate(-50%, -100%);
          pointer-events: none;
        }
        .pm-pin__dot {
          position: relative;
          width: 32px;
          height: 32px;
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
        .pm-pin__dot > svg { transform: rotate(45deg); }
      `}</style>
    </div>
  );
}
