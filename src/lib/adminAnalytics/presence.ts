import {
  analyticsPost,
  isBrowserOffline,
  isNetworkFetchError,
} from "@/lib/adminAnalytics/fetch";
import { getAnalyticsSessionId } from "@/lib/adminAnalytics/session";

const HEARTBEAT_MS = 30_000;
const MAX_BACKOFF_MS = 5 * 60_000;

let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let inFlight = false;
let failStreak = 0;
let nextAllowedAt = 0;
let warnedOffline = false;

function backoffMs(streak: number): number {
  return Math.min(HEARTBEAT_MS * 2 ** Math.max(0, streak - 1), MAX_BACKOFF_MS);
}

export async function upsertPresence(opts?: {
  path?: string | null;
  userId?: string | null;
}): Promise<void> {
  if (typeof window === "undefined") return;
  if (isBrowserOffline()) return;
  if (inFlight) return;
  if (Date.now() < nextAllowedAt) return;

  const session_id = getAnalyticsSessionId();
  const path =
    opts?.path ??
    (typeof window !== "undefined" ? window.location.pathname : null);

  const row = {
    p_session_id: session_id,
    p_user_id: opts?.userId ?? null,
    p_path: path,
  };

  inFlight = true;
  try {
    const res = await analyticsPost("/rest/v1/rpc/upsert_site_presence", row);
    if (res.ok || res.status === 200 || res.status === 201) {
      failStreak = 0;
      nextAllowedAt = 0;
      warnedOffline = false;
      return;
    }
    failStreak += 1;
    nextAllowedAt = Date.now() + backoffMs(failStreak);
    if (import.meta.env.DEV) {
      console.warn(
        "presence upsert failed",
        res.status,
        await res.text().catch(() => ""),
      );
    }
  } catch (e) {
    failStreak += 1;
    nextAllowedAt = Date.now() + backoffMs(failStreak);
    if (import.meta.env.DEV && !isNetworkFetchError(e)) {
      console.warn("presence upsert failed", e);
    } else if (import.meta.env.DEV && !warnedOffline) {
      warnedOffline = true;
      console.warn(
        "presence paused after network error; will retry with backoff",
      );
    }
  } finally {
    inFlight = false;
  }
}

export function startPresenceHeartbeat(getOpts: () => {
  path?: string | null;
  userId?: string | null;
}): () => void {
  const tick = () => {
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      return;
    }
    void upsertPresence(getOpts());
  };

  tick();
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(tick, HEARTBEAT_MS);

  const onOnline = () => {
    failStreak = 0;
    nextAllowedAt = 0;
    warnedOffline = false;
    tick();
  };
  const onVisibility = () => {
    if (document.visibilityState === "visible") tick();
  };

  window.addEventListener("online", onOnline);
  document.addEventListener("visibilitychange", onVisibility);

  return () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
    window.removeEventListener("online", onOnline);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}

/** Онлайн = last_seen_at > now() - 2 мин */
export const ONLINE_WINDOW_MS = 2 * 60_000;
