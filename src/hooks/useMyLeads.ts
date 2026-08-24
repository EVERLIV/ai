import { useQuery } from "@tanstack/react-query";
import { useMyAgency } from "@/hooks/useAgency";
import { useAuth } from "@/hooks/useAuth";
import {
  type CabinetLeadRow,
  type CabinetPropertyLite,
  fetchLeadsForPropertyIdsApi,
  fetchMyPropertiesLiteApi,
  fetchNewLeadsCountApi,
} from "@/lib/userPropertyApi";

export type LeadsDateRange = "today" | "7d" | "30d" | "all";

export type LeadPropertyInfo = {
  id: string;
  address: string;
  type: string;
  area: number;
  price: number;
  cover_photo: string | null;
  listing_manager_id: string | null;
  managerName: string | null;
};

function toPropertyInfo(p: CabinetPropertyLite): LeadPropertyInfo {
  const extras = p.extras || {};
  const name =
    typeof extras.agent_name === "string" && extras.agent_name.trim()
      ? extras.agent_name.trim()
      : null;
  return {
    id: p.id,
    address: p.address,
    type: p.type,
    area: p.area,
    price: p.price,
    cover_photo: p.cover_photo,
    listing_manager_id: p.listing_manager_id,
    managerName: p.listing_manager_id ? name : null,
  };
}

export function sinceIso(range: LeadsDateRange): string | undefined {
  if (range === "all") return undefined;
  const now = new Date();
  if (range === "today") {
    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).toISOString();
  }
  const days = range === "7d" ? 7 : 30;
  return new Date(now.getTime() - days * 86400000).toISOString();
}

export function useMyLeadProperties() {
  const { user } = useAuth();
  const { data: myAgency } = useMyAgency();
  const agencyId = myAgency?.agency.id;

  return useQuery({
    queryKey: ["my-lead-properties", user?.id, agencyId],
    enabled: !!user,
    staleTime: 60_000,
    queryFn: async () => {
      const rows = await fetchMyPropertiesLiteApi(user!.id, agencyId);
      const byId: Record<string, LeadPropertyInfo> = {};
      for (const p of rows) byId[p.id] = toPropertyInfo(p);
      return { list: Object.values(byId), byId };
    },
  });
}

export function useNewLeadsCount() {
  const { user } = useAuth();
  const { data: props, isSuccess } = useMyLeadProperties();

  return useQuery({
    queryKey: ["my-leads-new-count", user?.id, props?.list.length ?? 0],
    enabled: !!user && isSuccess,
    staleTime: 15_000,
    refetchInterval: 30_000,
    queryFn: async () => {
      if (!props?.list.length) return 0;
      return fetchNewLeadsCountApi(props.list.map((p) => p.id));
    },
  });
}

export function useMyLeadsInbox(dateRange: LeadsDateRange) {
  const { user } = useAuth();
  const { data: props, isSuccess } = useMyLeadProperties();

  return useQuery({
    queryKey: ["my-leads", user?.id, dateRange, props?.list.length ?? 0],
    enabled: !!user && isSuccess,
    staleTime: 15_000,
    refetchInterval: 30_000,
    queryFn: async () => {
      if (!props?.list.length) {
        return { leads: [] as CabinetLeadRow[], properties: props?.byId ?? {} };
      }
      const leads = await fetchLeadsForPropertyIdsApi(
        props.list.map((p) => p.id),
        { since: sinceIso(dateRange) },
      );
      return { leads, properties: props.byId };
    },
  });
}

export function formatLeadBadge(count: number): string {
  if (count > 99) return "99+";
  return String(count);
}
