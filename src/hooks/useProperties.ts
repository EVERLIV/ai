import { useQuery } from "@tanstack/react-query";
import { supabasePublic } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { PropertySegment } from "@/config/propertySegments";

export type DbProperty = Tables<"properties">;

type UsePropertiesOptions = {
  segment?: PropertySegment;
};

export function useProperties(options: UsePropertiesOptions = {}) {
  return useQuery({
    queryKey: ["properties", options.segment ?? "all"],
    queryFn: async () => {
      let query = supabasePublic
        .from("properties")
        .select("*")
        .eq("is_active", true);
      if (options.segment) query = query.eq("segment", options.segment);
      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data as DbProperty[];
    },
  });
}

export function useCommercialProperties() {
  return useProperties({ segment: "commercial" });
}

export function useResidentialProperties() {
  return useProperties({ segment: "residential" });
}

/**
 * Число активных объектов в каталоге. Используется в карточке агента
 * агентства — запрашивает только счётчик, без самих строк.
 */
export function useActivePropertiesCount() {
  return useQuery({
    queryKey: ["properties-count"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { count, error } = await supabasePublic
        .from("properties")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true);
      if (error) throw error;
      return count ?? 0;
    },
  });
}

export function useProperty(id: string | undefined) {
  return useQuery({
    queryKey: ["property", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabasePublic
        .from("properties")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as DbProperty;
    },
  });
}
