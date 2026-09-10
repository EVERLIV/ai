import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { SmartCaptcha } from "@yandex/smart-captcha";
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

const FormBotGuardInner = forwardRef<FormBotGuardHandle>(
  function FormBotGuardInner(_props, ref) {
    const honeypotRef = useRef<HTMLInputElement>(null);
    const captchaEnabled = isCaptchaEnabled();
    const [token, setToken] = useState("");
    const [resetKey, setResetKey] = useState(0);

    useImperativeHandle(
      ref,
      () => ({
        getHoneypot: () => honeypotRef.current?.value?.trim() || "",
        ensureToken: () => {
          if (!captchaEnabled || !SMARTCAPTCHA_SITE_KEY) {
            return Promise.reject(new Error("SmartCaptcha disabled"));
          }
          if (!token.trim()) {
            return Promise.reject(
              new Error("Подтвердите, что вы не робот"),
            );
          }
          return Promise.resolve(token.trim());
        },
        reset: () => {
          if (honeypotRef.current) honeypotRef.current.value = "";
          setToken("");
          setResetKey((k) => k + 1);
        },
      }),
      [captchaEnabled, token],
    );

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
          <div className="pt-1">
            <SmartCaptcha
              key={resetKey}
              sitekey={SMARTCAPTCHA_SITE_KEY}
              language="ru"
              onSuccess={setToken}
              onTokenExpired={() => setToken("")}
              onNetworkError={() => setToken("")}
            />
          </div>
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
        e instanceof Error
          ? e.message
          : "Не удалось проверить защиту. Попробуйте ещё раз.",
      );
    }
  }, []);

  const resetGuard = useCallback(() => {
    ref.current?.reset();
  }, []);

  return { BotGuard, ensureGuard, resetGuard };
}
