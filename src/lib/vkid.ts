import { getEdgeFunctionUrl } from "@/lib/edgeFunctions";
import { supabase } from "@/integrations/supabase/client";

/** App ID из кабинета VK ID (публичный). Секрет — только на сервере. */
export const VK_ID_APP_ID = Number(
  import.meta.env.VITE_VK_ID_APP_ID?.trim() || "0",
);

export function isVkidEnabled(): boolean {
  return Number.isFinite(VK_ID_APP_ID) && VK_ID_APP_ID > 0;
}

/** Trusted redirect из кабинета VK ID — тот же origin + /auth */
export function getVkidRedirectUrl(): string {
  if (typeof window === "undefined") return "https://dadatut.ru/auth";
  return `${window.location.origin}/auth`;
}

export type VkidSessionPayload = {
  access_token: string;
  user_id?: number | string;
  /** Тип аккаунта при регистрации через соцсеть (по умолчанию seeker) */
  account_type?: string;
  full_name?: string;
  phone?: string;
};

/**
 * Обмен VK access_token → сессия Supabase через edge function auth-vkid.
 * Нужны серверные секреты (см. docs/SETUP_VKID.md).
 */
export async function signInWithVkid(
  payload: VkidSessionPayload,
): Promise<void> {
  const url = getEdgeFunctionUrl("auth-vkid", "VITE_AUTH_VKID_URL");
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(25_000),
  });
  const data = (await resp.json().catch(() => ({}))) as {
    error?: string;
    token_hash?: string;
  };
  if (!resp.ok || !data.token_hash) {
    throw new Error(
      data.error ||
        (resp.status === 503
          ? "Вход через VK ещё не настроен на сервере"
          : `Ошибка входа через VK (${resp.status})`),
    );
  }

  const { error } = await supabase.auth.verifyOtp({
    type: "email",
    token_hash: data.token_hash,
  });
  if (error) throw error;
}
