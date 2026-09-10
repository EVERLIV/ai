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

type VkidWidgetError = {
  code?: string | number;
  text?: string;
  error?: string;
  error_description?: string;
  details?: unknown;
};

let configReady = false;

function randomPkceString(length = 64): string {
  const alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

function ensureVkidConfig() {
  if (!isVkidEnabled()) return;
  const redirectUrl = getVkidRedirectUrl();
  if (!configReady) {
    VKID.Config.init({
      app: VK_ID_APP_ID,
      redirectUrl,
      responseMode: VKID.ConfigResponseMode.Callback,
      source: VKID.ConfigSource.LOWCODE,
      scope: "email phone",
      state: randomPkceString(32),
      codeVerifier: randomPkceString(64),
    });
    configReady = true;
    return;
  }
  VKID.Config.update({ redirectUrl });
}

/** Ошибки, которые не нужно показывать пользователю (шум виджета / отмена). */
function isBenignVkidError(error: VkidWidgetError): boolean {
  const code = String(error.code ?? "").toLowerCase();
  const text = String(
    error.text || error.error || error.error_description || "",
  ).toLowerCase();
  const blob = `${code} ${text}`;

  return (
    code.includes("timeoutexceeded") ||
    code.includes("timeout") ||
    blob.includes("timeout") ||
    blob.includes("not authorized") ||
    blob.includes("not_authorized") ||
    blob.includes("newtabhasbeenclosed") ||
    blob.includes("closed") ||
    blob.includes("abort") ||
    blob.includes("cancel")
  );
}

function formatVkidError(error: unknown): string {
  if (!error || typeof error !== "object") {
    return "Не удалось загрузить вход через VK";
  }
  const e = error as VkidWidgetError;
  return (
    e.text ||
    e.error_description ||
    e.error ||
    (e.code != null ? `Ошибка VK ID (${e.code})` : "Ошибка виджета VK ID")
  );
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

    let alive = true;
    let oneTap: InstanceType<typeof VKID.OneTap> | null = null;
    const container = containerRef.current;

    const handleSuccess = async (payload: {
      code?: string;
      device_id?: string;
    }) => {
      if (!alive) return;
      const code = payload.code;
      const deviceId = payload.device_id;
      if (!code || !deviceId) {
        onErrorRef.current?.("VK ID: нет кода авторизации");
        return;
      }
      setBusy(true);
      try {
        const tokens = await VKID.Auth.exchangeCode(code, deviceId);
        if (!alive) return;
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
        if (!alive) return;
        onSuccessRef.current();
      } catch (err) {
        if (!alive) return;
        const msg =
          err instanceof Error ? err.message : "Не удалось войти через VK ID";
        onErrorRef.current?.(msg);
      } finally {
        if (alive) setBusy(false);
      }
    };

    const mount = () => {
      if (!alive || !containerRef.current) return;
      ensureVkidConfig();
      container.innerHTML = "";

      oneTap = new VKID.OneTap();
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
        .on(VKID.WidgetEvents.LOAD, () => {
          if (alive) setReady(true);
        })
        .on(VKID.WidgetEvents.ERROR, (error: unknown) => {
          if (!alive) return;
          const parsed = (error || {}) as VkidWidgetError;
          // Таймаут / размонтирование / «не авторизован в VK» — не пугаем toast'ом
          if (isBenignVkidError(parsed)) {
            console.warn("[VK ID]", parsed.code, parsed.text || parsed.error);
            setReady(true);
            return;
          }
          onErrorRef.current?.(formatVkidError(error));
        })
        .on(VKID.OneTapInternalEvents.LOGIN_SUCCESS, handleSuccess)
        .on(VKID.OneTapInternalEvents.NOT_AUTHORIZED, () => {
          // Обычная ситуация: нет сессии VK — кнопка всё равно показывает полный вход
          if (alive) setReady(true);
        });

      // Если LOAD не пришёл — всё равно убираем «Загрузка…»
      window.setTimeout(() => {
        if (alive) setReady(true);
      }, 2500);
    };

    // Даём React Strict Mode завершить первый unmount, иначе iframe ловит TimeoutExceeded
    const t = window.setTimeout(mount, 50);

    return () => {
      alive = false;
      window.clearTimeout(t);
      try {
        oneTap?.close?.();
      } catch {
        // ignore
      }
      oneTap = null;
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
