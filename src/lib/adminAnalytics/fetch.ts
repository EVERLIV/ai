/** Общий fetch для публичной аналитики/presence: таймаут + ключи. */

import { SUPABASE_URL } from "@/integrations/supabase/adminClient";

export const ANALYTICS_SUPABASE_URL = SUPABASE_URL;
export const ANALYTICS_FETCH_TIMEOUT_MS = 8_000;

function anonKey(): string {
  return import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "";
}

export function analyticsHeaders(
  extra?: Record<string, string>,
): HeadersInit {
  const key = anonKey();
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    ...extra,
  };
}

export function isNetworkFetchError(e: unknown): boolean {
  if (e instanceof DOMException && e.name === "AbortError") return true;
  if (e instanceof TypeError) return true;
  if (e instanceof Error) {
    const m = e.message.toLowerCase();
    return (
      m.includes("failed to fetch") ||
      m.includes("network") ||
      m.includes("aborted") ||
      m.includes("timeout")
    );
  }
  return false;
}

export async function analyticsFetch(
  path: string,
  init: RequestInit & { timeoutMs?: number } = {},
): Promise<Response> {
  const { timeoutMs = ANALYTICS_FETCH_TIMEOUT_MS, ...rest } = init;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(`${ANALYTICS_SUPABASE_URL}${path}`, {
      ...rest,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

export async function analyticsPost(
  path: string,
  body: unknown,
  prefer?: string,
): Promise<Response> {
  const preferHeaders = prefer ? { Prefer: prefer } : undefined;
  return analyticsFetch(path, {
    method: "POST",
    headers: analyticsHeaders(preferHeaders),
    body: JSON.stringify(body),
  });
}

export function isBrowserOffline(): boolean {
  return typeof navigator !== "undefined" && navigator.onLine === false;
}
