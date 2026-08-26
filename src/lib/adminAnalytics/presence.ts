import { supabasePublic } from "@/integrations/supabase/client";
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

  const { error: insertError } = await supabasePublic
    .from("site_presence" as never)
    .insert(row as never);

  if (!insertError) return;

  const { error: updateError } = await supabasePublic
    .from("site_presence" as never)
    .update({
      user_id: row.user_id,
      last_seen_at: row.last_seen_at,
      path: row.path,
    } as never)
    .eq("session_id", session_id);

  if (updateError) {
    console.warn("presence upsert failed", updateError.message);
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
