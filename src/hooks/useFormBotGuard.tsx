import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import {
  isRecaptchaEnabled,
  RECAPTCHA_ACTION,
  RECAPTCHA_SCRIPT_ID,
  RECAPTCHA_SITE_KEY,
  recaptchaScriptSrc,
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

function loadRecaptchaScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (!RECAPTCHA_SITE_KEY) return Promise.resolve();
  if (window.grecaptcha?.execute) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(RECAPTCHA_SCRIPT_ID);
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("reCAPTCHA script failed")),
        { once: true },
      );
      if (window.grecaptcha?.execute) {
        resolve();
      }
      return;
    }

    const script = document.createElement("script");
    script.id = RECAPTCHA_SCRIPT_ID;
    script.src = recaptchaScriptSrc(RECAPTCHA_SITE_KEY);
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("reCAPTCHA script failed"));
    document.head.appendChild(script);
  }).catch((e) => {
    scriptPromise = null;
    throw e;
  });

  return scriptPromise;
}

const TOKEN_TIMEOUT_MS = 12_000;

function executeRecaptcha(): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error("reCAPTCHA timeout"));
    }, TOKEN_TIMEOUT_MS);

    const finish = (fn: () => void) => {
      clearTimeout(timeout);
      try {
        fn();
      } catch (e) {
        reject(e instanceof Error ? e : new Error("reCAPTCHA failed"));
      }
    };

    loadRecaptchaScript()
      .then(() => {
        if (!window.grecaptcha) {
          finish(() => reject(new Error("reCAPTCHA unavailable")));
          return;
        }
        window.grecaptcha.ready(() => {
          window
            .grecaptcha!.execute(RECAPTCHA_SITE_KEY, {
              action: RECAPTCHA_ACTION,
            })
            .then((token) => {
              finish(() => {
                if (!token) reject(new Error("Empty reCAPTCHA token"));
                else resolve(token);
              });
            })
            .catch((e) => {
              finish(() =>
                reject(
                  e instanceof Error ? e : new Error("reCAPTCHA execute failed"),
                ),
              );
            });
        });
      })
      .catch((e) => {
        finish(() =>
          reject(e instanceof Error ? e : new Error("reCAPTCHA load failed")),
        );
      });
  });
}

const FormBotGuardInner = forwardRef<FormBotGuardHandle>(
  function FormBotGuardInner(_props, ref) {
    const honeypotRef = useRef<HTMLInputElement>(null);
    const captchaEnabled = isRecaptchaEnabled();

    useImperativeHandle(
      ref,
      () => ({
        getHoneypot: () => honeypotRef.current?.value?.trim() || "",
        ensureToken: () => executeRecaptcha(),
        reset: () => {
          if (honeypotRef.current) honeypotRef.current.value = "";
        },
      }),
      [],
    );

    useEffect(() => {
      if (!captchaEnabled) return;
      let cancelled = false;
      loadRecaptchaScript().catch((e) => {
        if (!cancelled) console.warn("reCAPTCHA load error:", e);
      });
      return () => {
        cancelled = true;
      };
    }, [captchaEnabled]);

    return (
      <div className="space-y-2">
        <input
          ref={honeypotRef}
          type="text"
          name="hp_field_ac"
          tabIndex={-1}
          autoComplete="off"
          aria-hidden
          className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden opacity-0 pointer-events-none"
        />
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

    if (!isRecaptchaEnabled()) {
      return { website: "", captchaToken: null };
    }

    try {
      const captchaToken = await ref.current!.ensureToken();
      if (!captchaToken) {
        throw new BotGuardError("Подтвердите, что вы не робот");
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
