import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";
import { fetchModerationQueue } from "@/lib/adminModeration";
import { fetchMembershipApi } from "@/lib/agencyApi";
import { fetchMyDeveloperApi } from "@/lib/developerApi";
import { fetchMyPropertiesApi } from "@/lib/userPropertyApi";
export type MyProperty = Tables<"properties">;

export function useMyProperties() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-properties", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [membership, developer] = await Promise.all([
        fetchMembershipApi(user?.id),
        fetchMyDeveloperApi(user!.id).catch(() => null),
      ]);
      const data = await fetchMyPropertiesApi(
        user!.id,
        membership?.agency_id,
        developer?.id,
      );
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
