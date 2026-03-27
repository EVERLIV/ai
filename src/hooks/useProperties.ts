import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type DbProperty = Tables<"properties">;

export function useProperties() {
  return useQuery({
    queryKey: ["properties"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as DbProperty[];
    },
  });
}

export function useProperty(id: string | undefined) {
  return useQuery({
    queryKey: ["property", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as DbProperty;
    },
  });
}
