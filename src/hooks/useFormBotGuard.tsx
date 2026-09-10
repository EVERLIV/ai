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

const TOKEN_TIMEOUT_MS = 45_000;

const FormBotGuardInner = forwardRef<FormBotGuardHandle>(
  function FormBotGuardInner(_props, ref) {
    const honeypotRef = useRef<HTMLInputElement>(null);
    const captchaEnabled = isCaptchaEnabled();
    const [visible, setVisible] = useState(false);
    const [resetKey, setResetKey] = useState(0);
    const pendingRef = useRef<{
      resolve: (token: string) => void;
      reject: (err: Error) => void;
      timer: ReturnType<typeof setTimeout>;
    } | null>(null);

    const clearPending = useCallback((err?: Error) => {
      const pending = pendingRef.current;
      if (!pending) return;
      clearTimeout(pending.timer);
      pendingRef.current = null;
      if (err) pending.reject(err);
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
            clearPending();
            const timer = setTimeout(() => {
              pendingRef.current = null;
              setVisible(false);
              reject(new Error("SmartCaptcha timeout"));
            }, TOKEN_TIMEOUT_MS);
            pendingRef.current = { resolve, reject, timer };
            // remount + visible, чтобы InvisibleSmartCaptcha снова вызвал execute
            setResetKey((k) => k + 1);
            setVisible(true);
          });
        },
        reset: () => {
          if (honeypotRef.current) honeypotRef.current.value = "";
          clearPending();
          setVisible(false);
          setResetKey((k) => k + 1);
        },
      }),
      [captchaEnabled, clearPending],
    );

    const handleSuccess = useCallback(
      (token: string) => {
        const pending = pendingRef.current;
        if (pending) {
          clearTimeout(pending.timer);
          pendingRef.current = null;
          pending.resolve(token);
        }
        setVisible(false);
      },
      [],
    );

    const handleChallengeHidden = useCallback(() => {
      setVisible(false);
      clearPending(new Error("SmartCaptcha cancelled"));
    }, [clearPending]);

    const handleNetworkError = useCallback(() => {
      setVisible(false);
      clearPending(new Error("SmartCaptcha network error"));
    }, [clearPending]);

    const handleJavascriptError = useCallback(() => {
      setVisible(false);
      clearPending(new Error("SmartCaptcha error"));
    }, [clearPending]);

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
        {captchaEnabled && SMARTCAPTCHA_SITE_KEY ? (
          <InvisibleSmartCaptcha
            key={resetKey}
            sitekey={SMARTCAPTCHA_SITE_KEY}
            visible={visible}
            onSuccess={handleSuccess}
            onChallengeHidden={handleChallengeHidden}
            onNetworkError={handleNetworkError}
            onJavascriptError={handleJavascriptError}
            language="ru"
            hideShield={false}
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
