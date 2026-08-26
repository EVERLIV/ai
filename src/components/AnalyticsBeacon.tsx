import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import {
  startPresenceHeartbeat,
  trackPageView,
  trackPropertyView,
} from "@/lib/adminAnalytics";

/** Клиентский трекер: пишет events + presence. UI статистики — только в админке. */
export default function AnalyticsBeacon() {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const path = location.pathname + location.search;
    trackPageView(location.pathname, { userId: user?.id ?? null });

    const m = location.pathname.match(/^\/property\/([^/]+)/);
    if (m?.[1]) {
      trackPropertyView(m[1], {
        path: location.pathname,
        userId: user?.id ?? null,
      });
    }

    void path;
  }, [location.pathname, location.search, user?.id]);

  useEffect(() => {
    return startPresenceHeartbeat(() => ({
      path: window.location.pathname,
      userId: user?.id ?? null,
    }));
  }, [user?.id]);

  return null;
}
