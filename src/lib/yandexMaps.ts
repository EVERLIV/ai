// Loader for Yandex Maps JS API v3
// Requires a valid VITE_YANDEX_MAPS_API_KEY (JavaScript API + MapKit)
//
// ВАЖНО: и fetch-проверка, и реальный <script src> одинаково режутся
// Referer-ограничением ключа в кабинете Яндекса — script-тег не в обход.
// Если в допустимых Referer'ах ключа нет localhost, карта на localhost
// будет падать в виджет-фолбэк всегда, сколько угодно раз, — это не баг
// кода, а ограничение ключа. Добавьте localhost / 127.0.0.1 в Referer'ы
// ключа в https://developer.tech.yandex.ru/, если нужна карта в dev.
// На домене из допустимых Referer'ов (dadatut.ru) всё работает штатно.
//
// Флаг неудачи живёт ограниченное время (FAIL_TTL_MS), а не всю сессию —
// одна случайная ошибка не блокирует карту насовсем.

let loadPromise: Promise<any> | null = null;
const FAIL_FLAG = "ymaps3_js_unavailable_until";
const FAIL_TTL_MS = 5 * 60 * 1000; // 5 минут — не сессия целиком

function isLocalhost(): boolean {
  if (typeof location === "undefined") return false;
  return (
    location.hostname === "localhost" ||
    location.hostname === "127.0.0.1" ||
    location.hostname.endsWith(".local")
  );
}

export function getYandexMapsApiKey(): string {
  return (
    (import.meta.env.VITE_YANDEX_MAPS_API_KEY as string | undefined)?.trim() ??
    ""
  );
}

export function hasYandexMapsApiKey(): boolean {
  return getYandexMapsApiKey().length > 0;
}

/** JS API недавно падал (невалидный ключ) — до истечения TTL сразу виджет. */
export function shouldUseYandexMapWidget(): boolean {
  if (typeof sessionStorage === "undefined") return !hasYandexMapsApiKey();
  if (!hasYandexMapsApiKey()) return true;
  const until = Number(sessionStorage.getItem(FAIL_FLAG) || 0);
  return until > Date.now();
}

/** Сбросить флаг неудачи вручную (например, после обновления ключа). */
export function resetYandexMapsFailure() {
  try {
    sessionStorage.removeItem(FAIL_FLAG);
  } catch {
    // ignore
  }
  loadPromise = null;
}

function markJsApiUnavailable() {
  try {
    sessionStorage.setItem(FAIL_FLAG, String(Date.now() + FAIL_TTL_MS));
  } catch {
    // ignore
  }
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
  const ymaps3 = (window as any).ymaps3;
  if (!ymaps3) throw new Error("Yandex Maps not available");
  await ymaps3.ready;
  configureYandexApiKeys(ymaps3);
  return ymaps3;
}

/**
 * Проверка ключа до вставки script (иначе 403 → шум в консоли).
 * При CORS-ограничениях возвращает null (= пробуем грузить script как раньше).
 */
async function probeMapsApiKey(
  apiKey: string,
): Promise<"ok" | "bad" | "unknown"> {
  try {
    const url = `https://api-maps.yandex.ru/v3/?${new URLSearchParams({
      apikey: apiKey,
      lang: "ru_RU",
    }).toString()}`;
    const res = await fetch(url, {
      method: "GET",
      mode: "cors",
      credentials: "omit",
      cache: "no-store",
    });
    if (res.status === 403 || res.status === 401) return "bad";
    if (res.ok) return "ok";
    return "unknown";
  } catch {
    // CORS / network — статус неизвестен, пусть пробует script
    return "unknown";
  }
}

export function loadYandexMaps(): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));
  if (shouldUseYandexMapWidget()) {
    return Promise.reject(new Error("Yandex Maps JS API unavailable"));
  }
  const apiKey = getYandexMapsApiKey();
  if (!apiKey) {
    markJsApiUnavailable();
    return Promise.reject(
      new Error("VITE_YANDEX_MAPS_API_KEY is not configured"),
    );
  }
  if ((window as any).ymaps3) {
    return resolveYmaps3();
  }
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const probe = await probeMapsApiKey(apiKey);
    if (probe === "bad") {
      markJsApiUnavailable();
      loadPromise = null;
      throw new Error(
        isLocalhost()
          ? "Ключ отклонён на localhost — проверьте, что localhost добавлен в Referer-ограничения ключа в кабинете Яндекса"
          : "Yandex Maps API key is invalid or forbidden",
      );
    }

    return await new Promise<any>((resolve, reject) => {
      const fail = (err: Error) => {
        markJsApiUnavailable();
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
      const params = new URLSearchParams({ lang: "ru_RU", apikey: apiKey });
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
  })();

  return loadPromise;
}

export const IRKUTSK_CENTER_LNGLAT: [number, number] = [104.2807, 52.2869];
