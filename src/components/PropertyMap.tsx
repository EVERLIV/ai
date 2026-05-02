import { useCallback, useRef } from "react";
import { GoogleMap, useJsApiLoader, OverlayView } from "@react-google-maps/api";
import { MapPin } from "lucide-react";

const IRKUTSK_CENTER = { lat: 52.2869, lng: 104.2807 };
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string;

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

interface PropertyMapProps {
  address: string;
  district?: string;
  lat?: number | null;
  lng?: number | null;
  height?: number;
}

export default function PropertyMap({ address, district, lat, lng, height = 320 }: PropertyMapProps) {
  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
  });
  const mapRef = useRef<google.maps.Map | null>(null);

  const hasCoords = typeof lat === "number" && typeof lng === "number" && !Number.isNaN(lat) && !Number.isNaN(lng);
  const center = hasCoords ? { lat: lat!, lng: lng! } : IRKUTSK_CENTER;

  const onLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);
  const onUnmount = useCallback(() => {
    mapRef.current = null;
  }, []);

  return (
    <div className="relative bg-muted overflow-hidden" style={{ height }}>
      {isLoaded ? (
        <GoogleMap
          mapContainerClassName="absolute inset-0"
          center={center}
          zoom={hasCoords ? 15 : 11}
          options={MAP_OPTIONS}
          onLoad={onLoad}
          onUnmount={onUnmount}
        >
          {hasCoords && (
            <OverlayView
              position={center}
              mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
              getPixelPositionOffset={(w, h) => ({ x: -w / 2, y: -h / 2 })}
            >
              <div className="property-pin-wrap">
                <div className="property-pin-pulse" />
                <div className="property-pin" />
              </div>
            </OverlayView>
          )}
        </GoogleMap>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
          Загрузка карты…
        </div>
      )}

      {!hasCoords && isLoaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground bg-background/60 backdrop-blur-sm pointer-events-none">
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
