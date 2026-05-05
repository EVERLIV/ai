// Loader for Yandex Maps JS API v3
// Requires VITE_YANDEX_MAPS_API_KEY in .env

let loadPromise: Promise<any> | null = null;

export function loadYandexMaps(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  // @ts-ignore
  if (window.ymaps3) return Promise.resolve((window as any).ymaps3);
  if (loadPromise) return loadPromise;

  const apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY as string | undefined;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-ymaps3="true"]');
    const onReady = async () => {
      try {
        // @ts-ignore
        const ymaps3 = (window as any).ymaps3;
        if (!ymaps3) return reject(new Error("Yandex Maps not available"));
        await ymaps3.ready;
        resolve(ymaps3);
      } catch (e) {
        reject(e);
      }
    };

    if (existing) {
      existing.addEventListener("load", onReady);
      existing.addEventListener("error", () => reject(new Error("Failed to load Yandex Maps")));
      return;
    }

    const script = document.createElement("script");
    const lang = "ru_RU";
    const params = new URLSearchParams({ lang });
    if (apiKey) params.set("apikey", apiKey);
    script.src = `https://api-maps.yandex.ru/v3/?${params.toString()}`;
    script.async = true;
    script.defer = true;
    script.dataset.ymaps3 = "true";
    script.addEventListener("load", onReady);
    script.addEventListener("error", () => reject(new Error("Failed to load Yandex Maps")));
    document.head.appendChild(script);
  });

  return loadPromise;
}

export const IRKUTSK_CENTER_LNGLAT: [number, number] = [104.2807, 52.2869];
