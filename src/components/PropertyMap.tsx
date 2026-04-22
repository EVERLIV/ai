import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { KeyRound, MapPin } from "lucide-react";

const TOKEN_KEY = "mapbox_public_token";
const GEOCACHE_KEY = "mapbox_geocache_v1";
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
    "labels": {
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

type Coords = { lng: number; lat: number };
type GeoCache = Record<string, Coords | null>;

function loadCache(): GeoCache {
  try { return JSON.parse(localStorage.getItem(GEOCACHE_KEY) || "{}"); } catch { return {}; }
}
function saveCache(c: GeoCache) {
  try { localStorage.setItem(GEOCACHE_KEY, JSON.stringify(c)); } catch {}
}
async function geocode(address: string, token: string): Promise<Coords | null> {
  const q = encodeURIComponent(`${address}, Иркутск, Россия`);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json?access_token=${token}&limit=1&language=ru&country=ru&proximity=${IRKUTSK_CENTER[0]},${IRKUTSK_CENTER[1]}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const f = data.features?.[0];
    if (!f) return null;
    return { lng: f.center[0], lat: f.center[1] };
  } catch { return null; }
}

interface PropertyMapProps {
  address: string;
  district?: string;
  height?: number;
}

export default function PropertyMap({ address, district, height = 320 }: PropertyMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [token, setToken] = useState<string>(() => localStorage.getItem(TOKEN_KEY) || "");
  const [tokenInput, setTokenInput] = useState("");
  const [coords, setCoords] = useState<Coords | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Geocode address
  useEffect(() => {
    if (!token || !address) return;
    let cancelled = false;
    const cache = loadCache();
    const key = address.trim();

    const cached = cache[key];
    if (cached) {
      setCoords(cached);
      return;
    }

    (async () => {
      const c = await geocode(key, token);
      if (cancelled) return;
      cache[key] = c;
      saveCache(cache);
      if (c) setCoords(c);
      else setError("Не удалось определить координаты адреса");
    })();

    return () => { cancelled = true; };
  }, [address, token]);

  // Init map
  useEffect(() => {
    if (!token || !containerRef.current || mapRef.current) return;
    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: GRAY_STYLE,
      center: coords ? [coords.lng, coords.lat] : IRKUTSK_CENTER,
      zoom: coords ? 15 : 11,
      attributionControl: true,
      scrollZoom: false, // зум только кнопками
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
  }, [token]);

  // Place / update marker when coords arrive
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !coords) return;

    const place = () => {
      if (markerRef.current) {
        markerRef.current.setLngLat([coords.lng, coords.lat]);
      } else {
        const el = document.createElement("div");
        el.className = "property-pin-wrap";
        el.innerHTML = `
          <div class="property-pin-pulse"></div>
          <div class="property-pin"></div>
        `;
        markerRef.current = new mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat([coords.lng, coords.lat])
          .addTo(map);
      }
      map.easeTo({ center: [coords.lng, coords.lat], zoom: 15, duration: 600 });
    };

    if (map.isStyleLoaded()) place();
    else map.once("load", place);
  }, [coords]);

  const handleSaveToken = () => {
    const t = tokenInput.trim();
    if (!t.startsWith("pk.")) return;
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
  };

  if (!token) {
    return (
      <div className="bg-card border border-border p-5" style={{ minHeight: height }}>
        <div className="flex items-center gap-2 mb-2 text-foreground">
          <KeyRound className="w-4 h-4" />
          <h3 className="font-semibold text-sm uppercase tracking-wider">Подключите карту</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-3">
          Введите публичный токен Mapbox (pk.…) — получить бесплатно на{" "}
          <a href="https://account.mapbox.com/access-tokens/" target="_blank" rel="noreferrer" className="text-primary hover:underline">
            account.mapbox.com
          </a>. Токен сохраняется только в вашем браузере.
        </p>
        <div className="flex gap-2">
          <input
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="pk.eyJ1Ijoi..."
            className="flex-1 px-3 py-2 text-sm bg-background border border-border focus:outline-none focus:border-primary"
          />
          <button
            onClick={handleSaveToken}
            className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Подключить
          </button>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="w-3.5 h-3.5 text-primary" /> {address}
          {district && <span>· {district}</span>}
        </div>
      </div>
    );
  }

  return (
    <div className="relative bg-muted overflow-hidden" style={{ height }}>
      <div ref={containerRef} className="absolute inset-0" />
      {!coords && !error && (
        <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground bg-background/40 backdrop-blur-sm">
          Определяем местоположение…
        </div>
      )}
      {error && (
        <div className="absolute bottom-3 left-3 right-3 px-3 py-2 bg-card border border-border text-xs text-muted-foreground">
          {error}
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
