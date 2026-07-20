import { useQuery } from "@tanstack/react-query";
import { fetchOwnerListingCard } from "@/lib/adminModeration";

export function useOwnerListingCard(ownerUserId?: string | null) {
  return useQuery({
    queryKey: ["owner-listing-card", ownerUserId],
    enabled: !!ownerUserId,
    queryFn: () => fetchOwnerListingCard(ownerUserId!),
    staleTime: 60_000,
  });
}
