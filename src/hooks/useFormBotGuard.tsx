import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import {
  isTurnstileEnabled,
  TURNSTILE_SCRIPT_ID,
  TURNSTILE_SCRIPT_SRC,
  TURNSTILE_SITE_KEY,
  type BotGuardPayload,
} from "@/lib/botGuard";

export class BotGuardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BotGuardError";
  }
}

export type FormBotGuardHandle = {
  getHoneypot: () => string;
  ensureToken: () => Promise<string>;
  reset: () => void;
};

let scriptPromise: Promise<void> | null = null;

function loadTurnstileScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (window.turnstile) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(TURNSTILE_SCRIPT_ID);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Turnstile script failed")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = TURNSTILE_SCRIPT_ID;
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Turnstile script failed"));
    document.head.appendChild(script);
  }).catch((e) => {
    scriptPromise = null;
    throw e;
  });

  return scriptPromise;
}

const TOKEN_TIMEOUT_MS = 12_000;

const FormBotGuardInner = forwardRef<FormBotGuardHandle>(
  function FormBotGuardInner(_props, ref) {
    const honeypotRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<string | null>(null);
    const tokenRef = useRef<string | null>(null);
    const pendingRef = useRef<{
      resolve: (token: string) => void;
      reject: (error: Error) => void;
    } | null>(null);
    const captchaEnabled = isTurnstileEnabled();

    const settleToken = useCallback((next: string) => {
      tokenRef.current = next;
      pendingRef.current?.resolve(next);
      pendingRef.current = null;
    }, []);

    const clearToken = useCallback((message?: string) => {
      tokenRef.current = null;
      if (message && pendingRef.current) {
        pendingRef.current.reject(new Error(message));
        pendingRef.current = null;
      }
    }, []);

    useImperativeHandle(
      ref,
      () => ({
        getHoneypot: () => honeypotRef.current?.value?.trim() || "",
        ensureToken: () => {
          if (tokenRef.current) return Promise.resolve(tokenRef.current);
          if (!widgetIdRef.current || !window.turnstile) {
            return Promise.reject(new Error("Turnstile unavailable"));
          }

          return new Promise<string>((resolve, reject) => {
            const timeout = setTimeout(() => {
              pendingRef.current = null;
              reject(new Error("Turnstile timeout"));
            }, TOKEN_TIMEOUT_MS);

            pendingRef.current = {
              resolve: (token) => {
                clearTimeout(timeout);
                resolve(token);
              },
              reject: (error) => {
                clearTimeout(timeout);
                reject(error);
              },
            };

            try {
              window.turnstile!.reset(widgetIdRef.current!);
            } catch (e) {
              clearTimeout(timeout);
              pendingRef.current = null;
              reject(
                e instanceof Error ? e : new Error("Turnstile reset failed"),
              );
            }
          });
        },
        reset: () => {
          if (honeypotRef.current) honeypotRef.current.value = "";
          tokenRef.current = null;
          pendingRef.current = null;
          if (widgetIdRef.current && window.turnstile) {
            try {
              window.turnstile.reset(widgetIdRef.current);
            } catch {
              /* empty */
            }
          }
        },
      }),
      [],
    );

    useEffect(() => {
      if (!captchaEnabled || !containerRef.current) return;
      let cancelled = false;

      loadTurnstileScript()
        .then(() => {
          if (cancelled || !containerRef.current || !window.turnstile) return;
          if (widgetIdRef.current) {
            try {
              window.turnstile.remove(widgetIdRef.current);
            } catch {
              /* empty */
            }
          }

          widgetIdRef.current = window.turnstile.render(containerRef.current, {
            sitekey: TURNSTILE_SITE_KEY,
            theme: "light",
            size: "flexible",
            callback: settleToken,
            "expired-callback": () => clearToken("Turnstile expired"),
            "error-callback": () => clearToken("Turnstile error"),
          });
        })
        .catch((e) => console.warn("Turnstile load error:", e));

      return () => {
        cancelled = true;
        if (widgetIdRef.current && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch {
            /* empty */
          }
          widgetIdRef.current = null;
        }
      };
    }, [captchaEnabled, settleToken, clearToken]);

    return (
      <div className="space-y-2">
        <input
          ref={honeypotRef}
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden opacity-0 pointer-events-none"
        />
        {captchaEnabled ? (
          <div className="rounded-md border border-input bg-muted/20 px-2 py-1.5">
            <div
              ref={containerRef}
              className="flex min-h-[65px] w-full items-center justify-center overflow-hidden [&_iframe]:max-w-full"
            />
          </div>
        ) : null}
      </div>
    );
  },
);

export function useFormBotGuard() {
  const ref = useRef<FormBotGuardHandle>(null);

  const BotGuard = useCallback(
    () => <FormBotGuardInner ref={ref} />,
    [],
  );

  const ensureGuard = useCallback(async (): Promise<BotGuardPayload> => {
    const website = ref.current?.getHoneypot() ?? "";
    if (website) {
      throw new BotGuardError("bot");
    }

    if (!isTurnstileEnabled()) {
      return { website: "", captchaToken: null };
    }

    try {
      const captchaToken = await ref.current!.ensureToken();
      if (!captchaToken) {
        throw new BotGuardError(
          "Подтвердите, что вы не робот",
        );
      }
      return { website: "", captchaToken };
    } catch (e) {
      if (e instanceof BotGuardError) throw e;
      throw new BotGuardError(
        "Не удалось проверить защиту. Попробуйте ещё раз.",
      );
    }
  }, []);

  const resetGuard = useCallback(() => {
    ref.current?.reset();
  }, []);

  return { BotGuard, ensureGuard, resetGuard };
}
