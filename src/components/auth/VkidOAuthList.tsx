import * as VKID from "@vkid/sdk";
import { useEffect, useRef, useState } from "react";
import {
  getVkidRedirectUrl,
  isVkidEnabled,
  signInWithVkid,
  VK_ID_APP_ID,
} from "@/lib/vkid";

type Props = {
  /** Вызывается после успешной сессии Supabase */
  onSuccess: () => void;
  onError?: (message: string) => void;
  /** account_type для новых пользователей (регистрация) */
  accountType?: string | null;
  className?: string;
};

let configReady = false;

function ensureVkidConfig() {
  if (configReady || !isVkidEnabled()) return;
  VKID.Config.init({
    app: VK_ID_APP_ID,
    redirectUrl: getVkidRedirectUrl(),
    responseMode: VKID.ConfigResponseMode.Callback,
    source: VKID.ConfigSource.LOWCODE,
    scope: "email phone",
  });
  configReady = true;
}

/**
 * VK ID One Tap («Продолжить как…»).
 * Документация: https://id.vk.ru/about/business/go/docs/en
 */
export default function VkidOAuthList({
  onSuccess,
  onError,
  accountType,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const accountTypeRef = useRef(accountType);
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  accountTypeRef.current = accountType;
  onSuccessRef.current = onSuccess;
  onErrorRef.current = onError;

  useEffect(() => {
    if (!isVkidEnabled() || !containerRef.current) return;

    ensureVkidConfig();
    VKID.Config.update({ redirectUrl: getVkidRedirectUrl() });

    const container = containerRef.current;
    container.innerHTML = "";

    const oneTap = new VKID.OneTap();

    const handleSuccess = async (payload: {
      code?: string;
      device_id?: string;
    }) => {
      const code = payload.code;
      const deviceId = payload.device_id;
      if (!code || !deviceId) {
        onErrorRef.current?.("VK ID: нет кода авторизации");
        return;
      }
      setBusy(true);
      try {
        const tokens = await VKID.Auth.exchangeCode(code, deviceId);
        let fullName = "";
        let phone = "";
        try {
          const info = await VKID.Auth.userInfo(tokens.access_token);
          const u = info.user;
          fullName = [u.first_name, u.last_name].filter(Boolean).join(" ");
          phone = u.phone || "";
        } catch {
          // email/phone могут быть недоступны без scope — не блокируем вход
        }
        await signInWithVkid({
          access_token: tokens.access_token,
          user_id: tokens.user_id,
          account_type: accountTypeRef.current || "seeker",
          full_name: fullName || undefined,
          phone: phone || undefined,
        });
        onSuccessRef.current();
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Не удалось войти через VK ID";
        onErrorRef.current?.(msg);
      } finally {
        setBusy(false);
      }
    };

    oneTap
      .render({
        container,
        showAlternativeLogin: true,
        styles: {
          height: 44,
          borderRadius: 8,
        },
        scheme: VKID.Scheme.LIGHT,
        lang: VKID.Languages.RUS,
      })
      .on(VKID.WidgetEvents.ERROR, (error: unknown) => {
        const msg =
          typeof error === "object" &&
          error &&
          "error" in error &&
          typeof (error as { error: string }).error === "string"
            ? (error as { error: string }).error
            : "Ошибка виджета VK ID";
        onErrorRef.current?.(msg);
      })
      .on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, handleSuccess);

    setReady(true);

    return () => {
      container.innerHTML = "";
    };
  }, []);

  if (!isVkidEnabled()) return null;

  return (
    <div className={className}>
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-[11px] uppercase tracking-wide">
          <span className="bg-background px-3 text-muted-foreground">
            или через
          </span>
        </div>
      </div>
      <div
        ref={containerRef}
        className={`mx-auto w-full max-w-[360px] min-h-[44px] ${
          busy ? "pointer-events-none opacity-60" : ""
        }`}
        aria-busy={busy}
      />
      {busy && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Входим…
        </p>
      )}
      {!ready && !busy && (
        <p className="text-center text-xs text-muted-foreground">
          Загрузка VK ID…
        </p>
      )}
    </div>
  );
}
