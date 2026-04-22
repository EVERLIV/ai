import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useProperties } from "@/hooks/useProperties";
import { List, Map as MapIcon, KeyRound } from "lucide-react";
import { Link } from "react-router-dom";

const TOKEN_KEY = "mapbox_public_token";
const GEOCACHE_KEY = "mapbox_geocache_v1";
const IRKUTSK_CENTER: [number, number] = [104.2807, 52.2869];

// Strict grayscale style matching the project palette
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

type GeoCache = Record<string, { lng: number; lat: number } | null>;

function loadCache(): GeoCache {
  try {
    return JSON.parse(localStorage.getItem(GEOCACHE_KEY) || "{}");
  } catch {
    return {};
  }
}
function saveCache(c: GeoCache) {
  try {
    localStorage.setItem(GEOCACHE_KEY, JSON.stringify(c));
  } catch {}
}

async function geocode(address: string, token: string): Promise<{ lng: number; lat: number } | null> {
  const q = encodeURIComponent(`${address}, Иркутск, Россия`);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json?access_token=${token}&limit=1&language=ru&country=ru&proximity=${IRKUTSK_CENTER[0]},${IRKUTSK_CENTER[1]}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const f = data.features?.[0];
    if (!f) return null;
    return { lng: f.center[0], lat: f.center[1] };
  } catch {
    return null;
  }
}

export default function MapSection() {
  const { ref, isVisible } = useScrollReveal();
  const [view, setView] = useState<"map" | "list">("map");
  const [token, setToken] = useState<string>(() => localStorage.getItem(TOKEN_KEY) || "");
  const [tokenInput, setTokenInput] = useState("");
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const { data: properties = [] } = useProperties();

  const districts = useMemo(() => {
    const counts = new Map<string, number>();
    properties.forEach((p) => {
      if (p.district) counts.set(p.district, (counts.get(p.district) || 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [properties]);

  // Init map
  useEffect(() => {
    if (!token || !mapContainer.current || mapRef.current) return;
    mapboxgl.accessToken = token;
    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: GRAY_STYLE,
      center: IRKUTSK_CENTER,
      zoom: 11,
      attributionControl: true,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [token]);

  // Geocode + add clustered source/layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !token || properties.length === 0) return;

    let cancelled = false;
    const cache = loadCache();

    const run = async () => {
      if (!map.isStyleLoaded()) {
        await new Promise<void>((r) => map.once("load", () => r()));
      }
      if (cancelled) return;

      const features: GeoJSON.Feature<GeoJSON.Point>[] = [];
      const bounds = new mapboxgl.LngLatBounds();

      const updateSource = () => {
        const data: GeoJSON.FeatureCollection<GeoJSON.Point> = {
          type: "FeatureCollection",
          features,
        };
        const src = map.getSource("properties") as mapboxgl.GeoJSONSource | undefined;
        if (src) {
          src.setData(data);
        } else {
          map.addSource("properties", {
            type: "geojson",
            data,
            cluster: true,
            clusterMaxZoom: 14,
            clusterRadius: 50,
          });

          map.addLayer({
            id: "clusters",
            type: "circle",
            source: "properties",
            filter: ["has", "point_count"],
            paint: {
              "circle-color": "hsl(0, 72%, 51%)",
              "circle-radius": ["step", ["get", "point_count"], 16, 10, 22, 50, 28],
              "circle-stroke-width": 2,
              "circle-stroke-color": "#ffffff",
            },
          });

          map.addLayer({
            id: "cluster-count",
            type: "symbol",
            source: "properties",
            filter: ["has", "point_count"],
            layout: {
              "text-field": ["get", "point_count_abbreviated"],
              "text-font": ["Open Sans Semibold", "Arial Unicode MS Bold"],
              "text-size": 12,
            },
            paint: { "text-color": "#ffffff" },
          });

          map.addLayer({
            id: "unclustered-point",
            type: "circle",
            source: "properties",
            filter: ["!", ["has", "point_count"]],
            paint: {
              "circle-color": "hsl(0, 72%, 51%)",
              "circle-radius": 6,
              "circle-stroke-width": 2,
              "circle-stroke-color": "#ffffff",
            },
          });

          map.on("click", "clusters", (e) => {
            const f = map.queryRenderedFeatures(e.point, { layers: ["clusters"] })[0];
            const clusterId = f.properties?.cluster_id;
            const source = map.getSource("properties") as mapboxgl.GeoJSONSource;
            source.getClusterExpansionZoom(clusterId, (err, zoom) => {
              if (err) return;
              map.easeTo({
                center: (f.geometry as GeoJSON.Point).coordinates as [number, number],
                zoom,
              });
            });
          });

          map.on("click", "unclustered-point", (e) => {
            const f = e.features?.[0];
            if (!f) return;
            const p = f.properties as {
              address: string; type: string; area: number; class: string; price: number; id: string;
            };
            const coords = (f.geometry as GeoJSON.Point).coordinates as [number, number];
            new mapboxgl.Popup({ offset: 12, closeButton: false })
              .setLngLat(coords)
              .setHTML(
                `<div style="font-family: Inter, sans-serif; min-width: 180px;">
                  <div style="font-weight:600; font-size:13px; color:#1a1a1a; margin-bottom:4px;">${p.address}</div>
                  <div style="font-size:12px; color:#666; margin-bottom:6px;">${p.type} · ${p.area} м² · ${p.class} класс</div>
                  <div style="font-weight:600; font-size:13px; color:#1a1a1a;">${Number(p.price).toLocaleString("ru-RU")} ₽</div>
                  <a href="/property/${p.id}" style="display:inline-block; margin-top:6px; font-size:12px; color:hsl(0 72% 51%); text-decoration:none;">Подробнее →</a>
                </div>`
              )
              .addTo(map);
          });

          ["clusters", "unclustered-point"].forEach((id) => {
            map.on("mouseenter", id, () => (map.getCanvas().style.cursor = "pointer"));
            map.on("mouseleave", id, () => (map.getCanvas().style.cursor = ""));
          });
        }
      };

      // First pass: use cached coords for instant render
      for (const p of properties) {
        const key = p.address?.trim();
        if (!key) continue;
        const cached = cache[key];
        if (cached) {
          features.push({
            type: "Feature",
            geometry: { type: "Point", coordinates: [cached.lng, cached.lat] },
            properties: { id: p.id, address: p.address, type: p.type, area: p.area, class: p.class, price: p.price },
          });
          bounds.extend([cached.lng, cached.lat]);
        }
      }
      updateSource();
      if (features.length > 1) {
        map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 600 });
      }

      // Second pass: geocode missing addresses
      for (const p of properties) {
        if (cancelled) return;
        const key = p.address?.trim();
        if (!key || cache[key] !== undefined) continue;
        const coords = await geocode(key, token);
        cache[key] = coords;
        saveCache(cache);
        await new Promise((r) => setTimeout(r, 120));
        if (cancelled) return;
        if (!coords) continue;
        features.push({
          type: "Feature",
          geometry: { type: "Point", coordinates: [coords.lng, coords.lat] },
          properties: { id: p.id, address: p.address, type: p.type, area: p.area, class: p.class, price: p.price },
        });
        bounds.extend([coords.lng, coords.lat]);
        updateSource();
      }

      if (features.length > 1 && !cancelled) {
        map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 600 });
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [properties, token]);

  const handleSaveToken = () => {
    const t = tokenInput.trim();
    if (!t.startsWith("pk.")) return;
    localStorage.setItem(TOKEN_KEY, t);
    setToken(t);
  };

  return (
    <section ref={ref} className="py-16 bg-surface-warm">
      <div className={`container mx-auto px-4 lg:px-8 ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}>
        <div className="flex items-end justify-between mb-8">
          <h2 className="font-display text-3xl font-bold text-foreground">Объекты на карте Иркутска</h2>
          <div className="flex bg-card overflow-hidden border border-border">
            <button
              onClick={() => setView("map")}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${view === "map" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              <MapIcon className="w-4 h-4" /> Карта
            </button>
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              <List className="w-4 h-4" /> Список
            </button>
          </div>
        </div>

        <div className="bg-card overflow-hidden flex flex-col lg:flex-row" style={{ minHeight: 480 }}>
          <div className="flex-1 relative bg-muted">
            {!token ? (
              <div className="absolute inset-0 flex items-center justify-center p-8">
                <div className="max-w-md w-full bg-card p-6 border border-border">
                  <div className="flex items-center gap-2 mb-3 text-foreground">
                    <KeyRound className="w-4 h-4" />
                    <h3 className="font-semibold text-sm uppercase tracking-wider">Подключите Mapbox</h3>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Введите ваш публичный токен Mapbox (pk.…). Получить бесплатно:{" "}
                    <a
                      href="https://account.mapbox.com/access-tokens/"
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:underline"
                    >
                      account.mapbox.com
                    </a>
                    . Токен сохраняется только в вашем браузере.
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
                </div>
              </div>
            ) : (
              <div ref={mapContainer} className="absolute inset-0" />
            )}
          </div>

          <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-border p-4 space-y-2 overflow-y-auto max-h-[480px]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">По районам</p>
              {token && (
                <button
                  onClick={() => {
                    localStorage.removeItem(TOKEN_KEY);
                    setToken("");
                  }}
                  className="text-[10px] text-muted-foreground hover:text-foreground uppercase tracking-wider"
                >
                  Сменить токен
                </button>
              )}
            </div>
            {districts.length === 0 ? (
              <div className="text-sm text-muted-foreground">Нет данных</div>
            ) : (
              districts.map(([name, count]) => (
                <div
                  key={name}
                  className="flex items-center justify-between px-3 py-2.5 hover:bg-muted transition-colors cursor-pointer text-sm text-foreground border-b border-border last:border-b-0"
                >
                  <span>{name}</span>
                  <span className="text-xs text-muted-foreground">{count}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
