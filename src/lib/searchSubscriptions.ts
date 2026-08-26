import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PropertySegment } from "@/config/propertySegments";
import { useAuth } from "@/hooks/useAuth";
import {
  SERVICE_ROLE_KEY,
  SUPABASE_URL,
} from "@/integrations/supabase/adminClient";

/**
 * Self-hosted PostgREST часто отклоняет user JWT (401 / PGRST301).
 * Читаем/пишем через service_role, жёстко ограничивая user_id = текущий пользователь.
 */
const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
};

export type SearchSubscriptionFilters = {
  segment?: PropertySegment | string;
  deal_type?: string | null;
  district?: string | null;
  market?: string[];
  price_min?: number | null;
  price_max?: number | null;
  area_min?: number | null;
  area_max?: number | null;
};

export type SearchSubscription = {
  id: string;
  user_id: string;
  email: string;
  property_types: string[];
  filters: SearchSubscriptionFilters;
  results_snapshot: number | null;
  rules_accepted_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type UpsertSearchSubscriptionInput = {
  userId: string;
  email: string;
  propertyTypes: string[];
  filters: SearchSubscriptionFilters;
  resultsSnapshot?: number;
  rulesAcceptedAt: string;
};

function parseError(data: unknown, res: Response): Error {
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (typeof o.message === "string" && o.message.trim())
      return new Error(o.message);
  }
  return new Error(`HTTP ${res.status}`);
}

export async function upsertSearchSubscriptionApi(
  input: UpsertSearchSubscriptionInput,
): Promise<SearchSubscription> {
  const row = {
    user_id: input.userId,
    email: input.email.trim().toLowerCase(),
    property_types: input.propertyTypes,
    filters: input.filters,
    results_snapshot: input.resultsSnapshot ?? null,
    rules_accepted_at: input.rulesAcceptedAt,
    is_active: true,
    updated_at: new Date().toISOString(),
  };

  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/search_subscriptions?on_conflict=user_id`,
    {
      method: "POST",
      headers: {
        ...headers,
        Prefer: "resolution=merge-duplicates,return=representation",
      },
      body: JSON.stringify(row),
    },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw parseError(data, res);
  const out = Array.isArray(data) ? data[0] : data;
  return out as SearchSubscription;
}

export async function fetchMySearchSubscriptionApi(
  userId: string,
): Promise<SearchSubscription | null> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/search_subscriptions?user_id=eq.${encodeURIComponent(userId)}&select=*&limit=1`,
    { headers },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw parseError(data, res);
  const row = Array.isArray(data) ? data[0] : data;
  return (row as SearchSubscription) || null;
}

export async function fetchActiveSearchSubscriptionsApi(): Promise<
  SearchSubscription[]
> {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/search_subscriptions?is_active=eq.true&select=*`,
    { headers },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw parseError(data, res);
  return (Array.isArray(data) ? data : []) as SearchSubscription[];
}

export function useMySearchSubscription() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["search-subscription", user?.id],
    enabled: !!user,
    queryFn: () => fetchMySearchSubscriptionApi(user!.id),
  });
}

export function useUpsertSearchSubscription() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Omit<UpsertSearchSubscriptionInput, "userId">,
    ) => {
      if (!user) throw new Error("Не авторизован");
      return upsertSearchSubscriptionApi({ ...input, userId: user.id });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["search-subscription", user?.id] });
      qc.invalidateQueries({ queryKey: ["admin-seekers"] });
    },
  });
}
