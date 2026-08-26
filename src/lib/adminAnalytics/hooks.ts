import { useQuery } from "@tanstack/react-query";
import {
  fetchAdminSiteStats,
  fetchOnlineCount,
} from "@/lib/adminAnalytics/queries";

export function useAdminOnlineCount(enabled = true) {
  return useQuery({
    queryKey: ["admin-online-count"],
    queryFn: fetchOnlineCount,
    enabled,
    refetchInterval: 15_000,
  });
}

export function useAdminSiteStats(enabled = true) {
  return useQuery({
    queryKey: ["admin-site-stats"],
    queryFn: fetchAdminSiteStats,
    enabled,
    refetchInterval: 30_000,
  });
}
