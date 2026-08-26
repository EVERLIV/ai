const SESSION_KEY = "ac_analytics_session";

export function getAnalyticsSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `s_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `s_${Date.now()}`;
  }
}

export type AnalyticsEventType =
  | "page_view"
  | "property_view"
  | "section_view";

export type TrackPayload = {
  event_type: AnalyticsEventType;
  path?: string | null;
  section?: string | null;
  property_id?: string | null;
  user_id?: string | null;
  meta?: Record<string, unknown>;
};
