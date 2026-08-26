import { supabasePublic } from "@/integrations/supabase/client";
import {
  getAnalyticsSessionId,
  type TrackPayload,
} from "@/lib/adminAnalytics/session";

const DEBOUNCE_MS = 800;
let lastPageKey = "";
let lastPageAt = 0;

export async function insertAnalyticsEvent(
  payload: TrackPayload,
): Promise<void> {
  const session_id = getAnalyticsSessionId();
  const { error } = await supabasePublic
    .from("site_analytics_events" as never)
    .insert({
      event_type: payload.event_type,
      path: payload.path ?? null,
      section: payload.section ?? null,
      property_id: payload.property_id ?? null,
      user_id: payload.user_id ?? null,
      session_id,
      meta: payload.meta ?? {},
    } as never);

  if (error) {
    console.warn("analytics insert failed", error.message);
  }
}

export function trackPageView(
  path: string,
  opts?: { userId?: string | null; section?: string | null },
): void {
  const key = `${path}|${opts?.section || ""}`;
  const now = Date.now();
  if (key === lastPageKey && now - lastPageAt < DEBOUNCE_MS) return;
  lastPageKey = key;
  lastPageAt = now;

  void insertAnalyticsEvent({
    event_type: "page_view",
    path,
    section: opts?.section ?? inferSection(path),
    user_id: opts?.userId ?? null,
  });
}

export function trackSectionView(
  section: string,
  opts?: { path?: string; userId?: string | null },
): void {
  void insertAnalyticsEvent({
    event_type: "section_view",
    section,
    path: opts?.path ?? (typeof window !== "undefined" ? window.location.pathname : null),
    user_id: opts?.userId ?? null,
  });
}

export function trackPropertyView(
  propertyId: string,
  opts?: { path?: string; userId?: string | null },
): void {
  if (!propertyId) return;
  void insertAnalyticsEvent({
    event_type: "property_view",
    property_id: propertyId,
    path: opts?.path ?? (typeof window !== "undefined" ? window.location.pathname : null),
    section: "property",
    user_id: opts?.userId ?? null,
  });
}

function inferSection(path: string): string {
  if (path.startsWith("/property/")) return "property";
  if (path.startsWith("/zhilaya")) return "residential";
  if (path.startsWith("/zemlya") || path.startsWith("/land")) return "land";
  if (path.startsWith("/catalog") || path === "/") return "commercial";
  if (path.startsWith("/offices")) return "offices";
  if (path.startsWith("/retail")) return "retail";
  if (path.startsWith("/warehouses")) return "warehouses";
  if (path.startsWith("/dashboard")) return "admin";
  if (path.startsWith("/account")) return "account";
  return "other";
}
