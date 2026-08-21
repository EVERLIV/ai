import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { fetchModerationQueue } from "@/lib/adminModeration";
import { fetchMyPropertiesApi } from "@/lib/userPropertyApi";
import { fetchMembershipApi } from "@/lib/agencyApi";
import type { Tables } from "@/integrations/supabase/types";
export type MyProperty = Tables<"properties">;

export function useMyProperties() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-properties", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const membership = await fetchMembershipApi(user!.id);
      const data = await fetchMyPropertiesApi(user!.id, membership?.agency_id);
      return data as MyProperty[];
    },
  });
}

export function useModerationQueue() {
  return useQuery({
    queryKey: ["moderation-queue"],
    queryFn: fetchModerationQueue,
    staleTime: 0,
    refetchOnMount: "always",
  });
}