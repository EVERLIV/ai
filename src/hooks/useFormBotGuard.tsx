import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { InvisibleSmartCaptcha } from "@yandex/smart-captcha";
import {
  isCaptchaEnabled,
  SMARTCAPTCHA_SITE_KEY,
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

const TOKEN_TIMEOUT_MS = 60_000;

type Pending = {
  resolve: (token: string) => void;
  reject: (err: Error) => void;
  timer: ReturnType<typeof setTimeout>;
  settled: boolean;
  /** Поколение запроса — игнор challenge-hidden от предыдущего запуска */
  gen: number;
};

const FormBotGuardInner = forwardRef<FormBotGuardHandle>(
  function FormBotGuardInner(_props, ref) {
    const honeypotRef = useRef<HTMLInputElement>(null);
    const captchaEnabled = isCaptchaEnabled();
    const [visible, setVisible] = useState(false);
    const [resetKey, setResetKey] = useState(0);
    const pendingRef = useRef<Pending | null>(null);
    const genRef = useRef(0);
    const successGenRef = useRef<number | null>(null);

    const settleReject = useCallback((err: Error, gen: number) => {
      const pending = pendingRef.current;
      if (!pending || pending.settled || pending.gen !== gen) return;
      if (successGenRef.current === gen) return;
      pending.settled = true;
      clearTimeout(pending.timer);
      pendingRef.current = null;
      pending.reject(err);
    }, []);

    const settleResolve = useCallback((token: string, gen: number) => {
      const pending = pendingRef.current;
      if (!pending || pending.settled || pending.gen !== gen) return;
      pending.settled = true;
      successGenRef.current = gen;
      clearTimeout(pending.timer);
      pendingRef.current = null;
      pending.resolve(token);
      setVisible(false);
    }, []);

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
            const timer = setTimeout(() => {
              settleReject(
                new Error("Не удалось пройти проверку. Попробуйте ещё раз."),
                gen,
              );
              setVisible(false);
            }, TOKEN_TIMEOUT_MS);

            pendingRef.current = { resolve, reject, timer, settled: false, gen };

            // Toggle visible to re-trigger InvisibleSmartCaptcha execute
            setVisible(false);
            requestAnimationFrame(() => {
              if (pendingRef.current?.gen === gen) setVisible(true);
            });
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
          setVisible(false);
          setResetKey((k) => k + 1);
        },
      }),
      [captchaEnabled, settleReject],
    );

    const handleSuccess = useCallback(
      (token: string) => {
        const gen = pendingRef.current?.gen ?? genRef.current;
        if (!token?.trim()) {
          settleReject(
            new Error("Не удалось пройти проверку. Попробуйте ещё раз."),
            gen,
          );
          setVisible(false);
          return;
        }
        settleResolve(token.trim(), gen);
      },
      [settleReject, settleResolve],
    );

    const handleChallengeHidden = useCallback(() => {
      const gen = pendingRef.current?.gen ?? genRef.current;
      setVisible(false);
      settleReject(new Error("Проверка отменена. Попробуйте ещё раз."), gen);
    }, [settleReject]);

    const handleNetworkError = useCallback(() => {
      const gen = pendingRef.current?.gen ?? genRef.current;
      setVisible(false);
      settleReject(
        new Error("Не удалось пройти проверку. Попробуйте ещё раз."),
        gen,
      );
    }, [settleReject]);

    const handleJavascriptError = useCallback(() => {
      const gen = pendingRef.current?.gen ?? genRef.current;
      setVisible(false);
      settleReject(
        new Error("Не удалось пройти проверку. Попробуйте ещё раз."),
        gen,
      );
    }, [settleReject]);

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
          <InvisibleSmartCaptcha
            key={resetKey}
            sitekey={SMARTCAPTCHA_SITE_KEY}
            visible={visible}
            hideShield
            language="ru"
            onSuccess={handleSuccess}
            onChallengeHidden={handleChallengeHidden}
            onNetworkError={handleNetworkError}
            onJavascriptError={handleJavascriptError}
          />
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
