import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MapPin } from "lucide-react";

const IRKUTSK_CENTER: [number, number] = [104.2807, 52.2869];

// Free CartoDB Positron raster tiles — clean light style, no API key
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

  const hasCoords =
    typeof lat === "number" && typeof lng === "number" && !Number.isNaN(lat) && !Number.isNaN(lng);
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
      el.className = "property-pin-wrap";
      el.innerHTML = `<div class="property-pin-pulse"></div><div class="property-pin"></div>`;
      new maplibregl.Marker({ element: el, anchor: "center" }).setLngLat(center).addTo(map);
    }

    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative bg-muted overflow-hidden" style={{ height }}>
      <div ref={containerRef} className="absolute inset-0" />

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

      <style>{`
        .property-pin-wrap {
          position: relative;
          width: 28px;
          height: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
        }
        .property-pin {
          position: relative;
          width: 16px;
          height: 16px;
          background: hsl(0, 72%, 51%);
          border: 3px solid #fff;
          border-radius: 50%;
          z-index: 2;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }
        .property-pin-pulse {
          position: absolute;
          inset: 0;
          width: 28px;
          height: 28px;
          background: hsl(0, 72%, 51%);
          border-radius: 50%;
          opacity: 0.45;
          animation: propertyPinPulse 1.8s ease-out infinite;
        }
        @keyframes propertyPinPulse {
          0%   { transform: scale(0.6); opacity: 0.55; }
          70%  { transform: scale(1.8); opacity: 0; }
          100% { transform: scale(1.8); opacity: 0; }
        }
        .maplibregl-ctrl-attrib { font-size: 10px; }
      `}</style>
    </div>
  );
}
