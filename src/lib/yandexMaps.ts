// Loader for Yandex Maps JS API v3
// Requires VITE_YANDEX_MAPS_API_KEY in .env

let loadPromise: Promise<any> | null = null;

export function getYandexMapsApiKey(): string {
  return (
    (import.meta.env.VITE_YANDEX_MAPS_API_KEY as string | undefined)?.trim() ??
    ""
  );
}

export function hasYandexMapsApiKey(): boolean {
  return getYandexMapsApiKey().length > 0;
}

function configureYandexApiKeys(ymaps3: any) {
  const apiKey = getYandexMapsApiKey();
  try {
    ymaps3
      .getDefaultConfig?.()
      ?.setApikeys?.({ search: apiKey, suggest: apiKey });
  } catch {
    // ignore config errors — map may still work
  }
}

async function resolveYmaps3(): Promise<any> {
  // @ts-expect-error
  const ymaps3 = (window as any).ymaps3;
  if (!ymaps3) throw new Error("Yandex Maps not available");
  await ymaps3.ready;
  configureYandexApiKeys(ymaps3);
  return ymaps3;
}

export function loadYandexMaps(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  const apiKey = getYandexMapsApiKey();
  if (!apiKey) {
    return Promise.reject(
      new Error("VITE_YANDEX_MAPS_API_KEY is not configured"),
    );
  }
  // @ts-expect-error
  if ((window as any).ymaps3) {
    return resolveYmaps3();
  }
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const fail = (err: Error) => {
      loadPromise = null;
      reject(err);
    };
    const existing = document.querySelector<HTMLScriptElement>(
      'script[data-ymaps3="true"]',
    );
    const onReady = async () => {
      try {
        resolve(await resolveYmaps3());
      } catch (e) {
        fail(e instanceof Error ? e : new Error("Yandex Maps not available"));
      }
    };

    if (existing) {
      existing.addEventListener("load", onReady);
      existing.addEventListener("error", () =>
        fail(new Error("Failed to load Yandex Maps")),
      );
      if ((window as any).ymaps3) onReady();
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
    script.addEventListener("error", () =>
      fail(new Error("Failed to load Yandex Maps")),
    );
    document.head.appendChild(script);
  });

  return loadPromise;
}

export const IRKUTSK_CENTER_LNGLAT: [number, number] = [104.2807, 52.2869];
