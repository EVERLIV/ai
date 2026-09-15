import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { useSmartCaptchaLoader } from "@yandex/smart-captcha";
import {
  isCaptchaEnabled,
  SMARTCAPTCHA_SITE_KEY,
  type BotGuardPayload,
} from "@/lib/botGuard";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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

const TOKEN_TIMEOUT_MS = 60_000;

type Pending = {
  resolve: (token: string) => void;
  reject: (err: Error) => void;
  timer: ReturnType<typeof setTimeout>;
  settled: boolean;
  gen: number;
};

function isHostBlockedMessage(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes("cannot be used in the host") ||
    m.includes("allowed hosts") ||
    m.includes("список разрешённых") ||
    m.includes("список разрешенных")
  );
}

function hostBlockedHint(): string {
  const host =
    typeof window !== "undefined" ? window.location.host : "этом хосте";
  return `Капча недоступна на «${host}». В Yandex Cloud → SmartCaptcha добавьте хост в разрешённые домены (для локалки: localhost:8080).`;
}

/**
 * Попап «Я не робот» с Checkbox SmartCaptcha.
 * Docs: https://yandex.cloud/docs/smartcaptcha/concepts/react
 * Хост обязан быть в allowed-sites ключа.
 */
const FormBotGuardInner = forwardRef<FormBotGuardHandle>(
  function FormBotGuardInner(_props, ref) {
    const honeypotRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const captchaEnabled = isCaptchaEnabled();

    const [open, setOpen] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [widgetReady, setWidgetReady] = useState(false);
    const pendingRef = useRef<Pending | null>(null);
    const genRef = useRef(0);
    const successGenRef = useRef<number | null>(null);

    const settleRejectRef = useRef<(err: Error, gen: number) => void>(() => {});
    const settleResolveRef = useRef<(token: string, gen: number) => void>(
      () => {},
    );

    const closePopup = useCallback(() => {
      setOpen(false);
      setWidgetReady(false);
    }, []);

    const settleReject = useCallback(
      (err: Error, gen: number) => {
        const pending = pendingRef.current;
        if (!pending || pending.settled || pending.gen !== gen) return;
        if (successGenRef.current === gen) return;
        pending.settled = true;
        clearTimeout(pending.timer);
        pendingRef.current = null;
        pending.reject(err);
        closePopup();
      },
      [closePopup],
    );

    const settleResolve = useCallback(
      (token: string, gen: number) => {
        const pending = pendingRef.current;
        if (!pending || pending.settled || pending.gen !== gen) return;
        pending.settled = true;
        successGenRef.current = gen;
        clearTimeout(pending.timer);
        pendingRef.current = null;
        pending.resolve(token);
        closePopup();
      },
      [closePopup],
    );

    settleRejectRef.current = settleReject;
    settleResolveRef.current = settleResolve;

    const smartCaptcha = useSmartCaptchaLoader(undefined, (error) => {
      const msg = error?.message || "";
      if (isHostBlockedMessage(msg)) {
        setLoadError(hostBlockedHint());
        return;
      }
      const gen = pendingRef.current?.gen ?? genRef.current;
      settleRejectRef.current(
        new Error("Не удалось пройти проверку. Попробуйте ещё раз."),
        gen,
      );
    });

    // Рендер виджета после открытия диалога (портал уже в DOM)
    useEffect(() => {
      if (!open || !smartCaptcha || !SMARTCAPTCHA_SITE_KEY) return;

      let cancelled = false;
      let widgetId: number | undefined;
      const unsubs: Array<() => void> = [];

      const timer = window.setTimeout(() => {
        if (cancelled || !containerRef.current) return;

        try {
          widgetId = smartCaptcha.render(containerRef.current, {
            sitekey: SMARTCAPTCHA_SITE_KEY,
            hl: "ru",
            callback: (token: string) => {
              const gen = pendingRef.current?.gen ?? genRef.current;
              if (!token?.trim()) {
                settleRejectRef.current(
                  new Error("Не удалось пройти проверку. Попробуйте ещё раз."),
                  gen,
                );
                return;
              }
              settleResolveRef.current(token.trim(), gen);
            },
          });

          unsubs.push(
            smartCaptcha.subscribe(widgetId, "success", (token) => {
              const gen = pendingRef.current?.gen ?? genRef.current;
              const value = typeof token === "string" ? token : "";
              if (!value.trim()) {
                settleRejectRef.current(
                  new Error("Не удалось пройти проверку. Попробуйте ещё раз."),
                  gen,
                );
                return;
              }
              settleResolveRef.current(value.trim(), gen);
            }),
          );
          unsubs.push(
            smartCaptcha.subscribe(widgetId, "network-error", () => {
              const gen = pendingRef.current?.gen ?? genRef.current;
              settleRejectRef.current(
                new Error("Не удалось пройти проверку. Попробуйте ещё раз."),
                gen,
              );
            }),
          );
          unsubs.push(
            smartCaptcha.subscribe(widgetId, "javascript-error", (error) => {
              const msg =
                error && typeof error === "object" && "message" in error
                  ? String((error as { message?: string }).message || "")
                  : "";
              if (isHostBlockedMessage(msg)) {
                setLoadError(hostBlockedHint());
                return;
              }
              const gen = pendingRef.current?.gen ?? genRef.current;
              settleRejectRef.current(
                new Error("Не удалось пройти проверку. Попробуйте ещё раз."),
                gen,
              );
            }),
          );

          if (!cancelled) setWidgetReady(true);
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          setLoadError(
            isHostBlockedMessage(msg)
              ? hostBlockedHint()
              : "Не удалось загрузить капчу. Попробуйте ещё раз.",
          );
        }
      }, 80);

      return () => {
        cancelled = true;
        window.clearTimeout(timer);
        unsubs.forEach((fn) => {
          try {
            fn();
          } catch {
            /* ignore */
          }
        });
        if (typeof widgetId === "number") {
          try {
            smartCaptcha.destroy(widgetId);
          } catch {
            /* ignore */
          }
        }
        setWidgetReady(false);
      };
    }, [open, smartCaptcha]);

    // Яндекс часто кидает Uncaught Error про host вне subscribe
    useEffect(() => {
      if (!open) return;
      const onError = (event: ErrorEvent) => {
        const msg = event.message || event.error?.message || "";
        if (!isHostBlockedMessage(msg)) return;
        setLoadError(hostBlockedHint());
      };
      window.addEventListener("error", onError);
      return () => window.removeEventListener("error", onError);
    }, [open]);

    useImperativeHandle(
      ref,
      () => ({
        getHoneypot: () => honeypotRef.current?.value?.trim() || "",
        ensureToken: () => {
          if (!captchaEnabled || !SMARTCAPTCHA_SITE_KEY) {
            return Promise.reject(new Error("SmartCaptcha disabled"));
          }
          return new Promise<string>((resolve, reject) => {
            const prev = pendingRef.current;
            if (prev && !prev.settled) {
              prev.settled = true;
              clearTimeout(prev.timer);
              prev.reject(new Error("SmartCaptcha superseded"));
            }

            const gen = ++genRef.current;
            successGenRef.current = null;
            setLoadError(null);
            const timer = setTimeout(() => {
              settleReject(
                new Error("Не удалось пройти проверку. Попробуйте ещё раз."),
                gen,
              );
            }, TOKEN_TIMEOUT_MS);

            pendingRef.current = { resolve, reject, timer, settled: false, gen };
            setOpen(true);
          });
        },
        reset: () => {
          const pending = pendingRef.current;
          if (pending && !pending.settled) {
            pending.settled = true;
            clearTimeout(pending.timer);
            pendingRef.current = null;
          }
          successGenRef.current = null;
          if (honeypotRef.current) honeypotRef.current.value = "";
          setLoadError(null);
          setOpen(false);
          setWidgetReady(false);
        },
      }),
      [captchaEnabled, settleReject],
    );

    const handleOpenChange = useCallback(
      (next: boolean) => {
        if (next) {
          setOpen(true);
          return;
        }
        const gen = pendingRef.current?.gen ?? genRef.current;
        settleReject(new Error("Проверка отменена. Попробуйте ещё раз."), gen);
        setOpen(false);
        setLoadError(null);
      },
      [settleReject],
    );

    return (
      <div className="contents">
        <input
          ref={honeypotRef}
          type="text"
          name="hp_field_ac"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden opacity-0 pointer-events-none"
        />
        {captchaEnabled && SMARTCAPTCHA_SITE_KEY ? (
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent
              className="w-[min(100%,24rem)] max-w-[24rem] gap-4 overflow-visible p-5 sm:rounded-xl"
              overlayClassName="bg-black/50"
              onPointerDownOutside={(e) => e.preventDefault()}
              onInteractOutside={(e) => e.preventDefault()}
            >
              <DialogHeader className="space-y-1.5 pr-6 text-left">
                <DialogTitle className="text-base font-semibold">
                  Я не робот
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Отметьте галочку, чтобы продолжить
                </DialogDescription>
              </DialogHeader>

              {loadError ? (
                <p className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                  {loadError}
                </p>
              ) : (
                <div className="relative flex min-h-[102px] w-full items-center justify-center overflow-visible py-1">
                  {!widgetReady && (
                    <span className="absolute text-sm text-muted-foreground">
                      Загрузка…
                    </span>
                  )}
                  <div
                    ref={containerRef}
                    className="smart-captcha relative z-[1] w-full min-w-[300px]"
                    style={{ minHeight: 102 }}
                  />
                </div>
              )}
            </DialogContent>
          </Dialog>
        ) : null}
      </div>
    );
  },
);

export function useFormBotGuard() {
  const ref = useRef<FormBotGuardHandle>(null);

  const BotGuard = useCallback(() => <FormBotGuardInner ref={ref} />, []);

  const ensureGuard = useCallback(async (): Promise<BotGuardPayload> => {
    const website = ref.current?.getHoneypot() ?? "";
    if (website) {
      throw new BotGuardError("bot");
    }

    if (!isCaptchaEnabled()) {
      return { website: "", captchaToken: null };
    }

    try {
      const captchaToken = await ref.current!.ensureToken();
      if (!captchaToken) {
        throw new BotGuardError(
          "Не удалось пройти проверку. Попробуйте ещё раз.",
        );
      }
      return { website: "", captchaToken };
    } catch (e) {
      if (e instanceof BotGuardError) throw e;
      throw new BotGuardError(
        e instanceof Error
          ? e.message
          : "Не удалось пройти проверку. Попробуйте ещё раз.",
      );
    }
  }, []);

  const resetGuard = useCallback(() => {
    ref.current?.reset();
  }, []);

  return { BotGuard, ensureGuard, resetGuard };
}
