import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapPin } from "lucide-react";

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

interface PropertyMapProps {
  address: string;
  district?: string;
  lat?: number | null;
  lng?: number | null;
  height?: number;
}

export default function PropertyMap({ address, district, lat, lng, height = 320 }: PropertyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  const hasCoords = typeof lat === "number" && typeof lng === "number" && !Number.isNaN(lat) && !Number.isNaN(lng);

  // Init map (no Mapbox token needed — using CARTO raster tiles)
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    // mapbox-gl requires SOME accessToken string; raster style ignores it
    mapboxgl.accessToken = "no-token-needed";
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: GRAY_STYLE,
      center: hasCoords ? [lng!, lat!] : IRKUTSK_CENTER,
      zoom: hasCoords ? 15 : 11,
      attributionControl: true,
      scrollZoom: false,
      doubleClickZoom: true,
      touchZoomRotate: true,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;

    return () => {
      markerRef.current?.remove();
      markerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Place / update marker when coords change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !hasCoords) return;

    const place = () => {
      if (markerRef.current) {
        markerRef.current.setLngLat([lng!, lat!]);
      } else {
        const el = document.createElement("div");
        el.className = "property-pin-wrap";
        el.innerHTML = `
          <div class="property-pin-pulse"></div>
          <div class="property-pin"></div>
        `;
        markerRef.current = new mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat([lng!, lat!])
          .addTo(map);
      }
      map.easeTo({ center: [lng!, lat!], zoom: 15, duration: 600 });
    };

    if (map.isStyleLoaded()) place();
    else map.once("load", place);
  }, [lat, lng, hasCoords]);

  return (
    <div className="relative bg-muted overflow-hidden" style={{ height }}>
      <div ref={containerRef} className="absolute inset-0" />
      {!hasCoords && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground bg-background/60 backdrop-blur-sm">
          <MapPin className="w-5 h-5 text-primary" />
          <span>Координаты для этого объекта не указаны</span>
          <span className="text-[10px] opacity-70">{address}{district && ` · ${district}`}</span>
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
          z-index: 2;
        }
        .property-pin-pulse {
          position: absolute;
          inset: 0;
          width: 28px;
          height: 28px;
          background: hsl(0, 72%, 51%);
          opacity: 0.45;
          animation: propertyPinPulse 1.8s ease-out infinite;
        }
        @keyframes propertyPinPulse {
          0%   { transform: scale(0.6); opacity: 0.55; }
          70%  { transform: scale(1.8); opacity: 0; }
          100% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
