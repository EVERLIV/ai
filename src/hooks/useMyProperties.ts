import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Tables } from "@/integrations/supabase/types";

export type MyProperty = Tables<"properties">;

export function useMyProperties() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-properties", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("submitted_by", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as MyProperty[];
    },
  });
}

export function useModerationQueue() {
  return useQuery({
    queryKey: ["moderation-queue"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select(`
          *,
          submitter:profiles!properties_submitted_by_fkey(id, full_name, email, phone, avatar_url)
        `)
        .eq("moderation_status", "on_moderation")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}
