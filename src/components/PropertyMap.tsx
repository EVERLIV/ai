import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Eye, MapPin } from "lucide-react";
import StreetViewModal from "./StreetViewModal";

const IRKUTSK_CENTER: [number, number] = [104.2807, 52.2869];

const MAP_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    "carto-light": {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
        "https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
        "https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
        "https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png",
      ],
      tileSize: 256,
      attribution: "© OpenStreetMap, © CARTO",
    },
  },
  layers: [{ id: "carto-light", type: "raster", source: "carto-light" }],
};

interface PropertyMapProps {
  address: string;
  district?: string;
  lat?: number | null;
  lng?: number | null;
  height?: number;
}

export default function PropertyMap({ address, district, lat, lng, height = 320 }: PropertyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [streetOpen, setStreetOpen] = useState(false);

  const hasCoords =
    typeof lat === "number" &&
    typeof lng === "number" &&
    !Number.isNaN(lat) &&
    !Number.isNaN(lng) &&
    !(lat === 0 && lng === 0);
  const center: [number, number] = hasCoords ? [lng!, lat!] : IRKUTSK_CENTER;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center,
      zoom: hasCoords ? 15 : 11,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    map.scrollZoom.disable();

    if (hasCoords) {
      const el = document.createElement("div");
      el.className = "pm-pin";
      el.innerHTML = `
        <span class="pm-pin__pulse"></span>
        <span class="pm-pin__dot">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
        </span>
      `;
      new maplibregl.Marker({ element: el, anchor: "bottom" }).setLngLat(center).addTo(map);
    }

    mapRef.current = map;
    return () => {
      map.remove();
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
          z-index: 2;
        }
        .pm-pin__dot > svg { transform: rotate(45deg); }
        .pm-pin__pulse {
          position: absolute;
          left: 50%;
          bottom: 0;
          width: 32px;
          height: 32px;
          margin-left: -16px;
          background: hsl(0, 72%, 51%);
          border-radius: 50%;
          opacity: 0.45;
          animation: pmPinPulse 1.8s ease-out infinite;
        }
        @keyframes pmPinPulse {
          0%   { transform: scale(0.6); opacity: 0.55; }
          70%  { transform: scale(1.8); opacity: 0; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        .maplibregl-ctrl-attrib { font-size: 10px; }
      `}</style>
    </div>
  );
}
