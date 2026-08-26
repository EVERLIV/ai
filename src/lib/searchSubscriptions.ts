import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PropertySegment } from "@/config/propertySegments";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

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

  const { data, error } = await supabase
    .from("search_subscriptions" as never)
    .upsert(row as never, { onConflict: "user_id" })
    .select("*")
    .single();

  if (error) throw error;
  return data as unknown as SearchSubscription;
}

export async function fetchMySearchSubscriptionApi(
  userId: string,
): Promise<SearchSubscription | null> {
  const { data, error } = await supabase
    .from("search_subscriptions" as never)
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data as unknown as SearchSubscription) || null;
}

export async function fetchActiveSearchSubscriptionsApi(): Promise<
  SearchSubscription[]
> {
  const { data, error } = await supabase
    .from("search_subscriptions" as never)
    .select("*")
    .eq("is_active", true);

  if (error) throw error;
  return (data || []) as unknown as SearchSubscription[];
}

export function useMySearchSubscription() {
  const { user, session } = useAuth();
  return useQuery({
    queryKey: ["search-subscription", user?.id],
    enabled: !!user && !!session?.access_token,
    queryFn: () => fetchMySearchSubscriptionApi(user!.id),
  });
}

export function useUpsertSearchSubscription() {
  const { user, session } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      input: Omit<UpsertSearchSubscriptionInput, "userId">,
    ) => {
      if (!user || !session?.access_token) throw new Error("Не авторизован");
      return upsertSearchSubscriptionApi({ ...input, userId: user.id });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["search-subscription", user?.id] });
      qc.invalidateQueries({ queryKey: ["admin-seekers"] });
    },
  });
}
