import {
  SERVICE_ROLE_KEY,
  SUPABASE_URL,
} from "@/integrations/supabase/adminClient";
import { ONLINE_WINDOW_MS } from "@/lib/adminAnalytics/presence";

export type PathCount = { path: string; count: number };
export type SectionCount = { section: string; count: number };
export type PropertyViewCount = {
  property_id: string;
  count: number;
};

export type AdminSiteStats = {
  onlineCount: number;
  pageViews24h: number;
  pageViews7d: number;
  propertyViews24h: number;
  propertyViews7d: number;
  topPaths: PathCount[];
  topSections: SectionCount[];
  topProperties: PropertyViewCount[];
};

type EventRow = {
  event_type: string;
  path: string | null;
  section: string | null;
  property_id: string | null;
  occurred_at: string;
};

const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
};

async function restGet(pathAndQuery: string): Promise<unknown> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${pathAndQuery}`, {
    headers: { ...headers, Prefer: "count=exact" },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

function countBy(
  rows: EventRow[],
  key: "path" | "section" | "property_id",
  limit = 8,
): { key: string; count: number }[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const v = r[key];
    if (!v) continue;
    map.set(v, (map.get(v) || 0) + 1);
  }
  return [...map.entries()]
    .map(([k, count]) => ({ key: k, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export async function fetchOnlineCount(): Promise<number> {
  const since = new Date(Date.now() - ONLINE_WINDOW_MS).toISOString();
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/site_presence?last_seen_at=gt.${encodeURIComponent(since)}&select=*`,
    {
      method: "HEAD",
      headers: { ...headers, Prefer: "count=exact" },
    },
  );
  const range = res.headers.get("content-range");
  if (range) {
    const m = range.match(/\/(\d+|\*)/);
    if (m && m[1] !== "*") return Number(m[1]) || 0;
  }
  const data = (await restGet(
    `site_presence?last_seen_at=gt.${encodeURIComponent(since)}&select=session_id`,
  )) as unknown[];
  return Array.isArray(data) ? data.length : 0;
}

export async function fetchAdminSiteStats(): Promise<AdminSiteStats> {
  const now = Date.now();
  const since7d = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
  const since24h = new Date(now - 24 * 60 * 60 * 1000).toISOString();

  const [onlineCount, eventsRaw] = await Promise.all([
    fetchOnlineCount(),
    restGet(
      `site_analytics_events?occurred_at=gte.${encodeURIComponent(since7d)}&select=event_type,path,section,property_id,occurred_at&order=occurred_at.desc&limit=5000`,
    ),
  ]);

  const events = (Array.isArray(eventsRaw) ? eventsRaw : []) as EventRow[];
  const in24h = events.filter((e) => e.occurred_at >= since24h);
  const pageViews24h = in24h.filter((e) => e.event_type === "page_view").length;
  const pageViews7d = events.filter((e) => e.event_type === "page_view").length;
  const propertyViews24h = in24h.filter(
    (e) => e.event_type === "property_view",
  ).length;
  const propertyViews7d = events.filter(
    (e) => e.event_type === "property_view",
  ).length;

  const topPaths = countBy(
    events.filter((e) => e.event_type === "page_view"),
    "path",
  ).map((x) => ({ path: x.key, count: x.count }));

  const topSections = countBy(events, "section").map((x) => ({
    section: x.key,
    count: x.count,
  }));

  const topProperties = countBy(
    events.filter((e) => e.event_type === "property_view"),
    "property_id",
  ).map((x) => ({ property_id: x.key, count: x.count }));

  return {
    onlineCount,
    pageViews24h,
    pageViews7d,
    propertyViews24h,
    propertyViews7d,
    topPaths,
    topSections,
    topProperties,
  };
}
