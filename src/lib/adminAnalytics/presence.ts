import {
  SERVICE_ROLE_KEY,
  SUPABASE_URL,
} from "@/integrations/supabase/adminClient";
import { getAnalyticsSessionId } from "@/lib/adminAnalytics/session";

const HEARTBEAT_MS = 30_000;

let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

export async function upsertPresence(opts?: {
  path?: string | null;
  userId?: string | null;
}): Promise<void> {
  const session_id = getAnalyticsSessionId();
  const path =
    opts?.path ??
    (typeof window !== "undefined" ? window.location.pathname : null);

  const row = {
    session_id,
    user_id: opts?.userId ?? null,
    last_seen_at: new Date().toISOString(),
    path,
  };

  // Raw REST upsert: избегаем 409 от insert + проблем onConflict в клиенте.
  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/site_presence?on_conflict=session_id`,
      {
        method: "POST",
        headers: {
          apikey: SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=minimal",
        },
        body: JSON.stringify(row),
      },
    );
    if (res.ok || res.status === 200 || res.status === 201) return;
    console.warn("presence upsert failed", res.status, await res.text().catch(() => ""));
  } catch (e) {
    console.warn("presence upsert failed", e);
  }
}

export function startPresenceHeartbeat(getOpts: () => {
  path?: string | null;
  userId?: string | null;
}): () => void {
  void upsertPresence(getOpts());
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(() => {
    void upsertPresence(getOpts());
  }, HEARTBEAT_MS);

  return () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  };
}

/** Онлайн = last_seen_at > now() - 2 мин */
export const ONLINE_WINDOW_MS = 2 * 60_000;
