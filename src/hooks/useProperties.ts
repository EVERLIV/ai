import { useQuery } from "@tanstack/react-query";
import type { PropertySegment } from "@/config/propertySegments";
import { supabasePublic } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { isCommercialLand } from "@/lib/propertyTypeFamilies";

export type DbProperty = Tables<"properties">;

type UsePropertiesOptions = {
  segment?: PropertySegment;
};

function mergeById(a: DbProperty[], b: DbProperty[]): DbProperty[] {
  const map = new Map<string, DbProperty>();
  for (const row of [...a, ...b]) map.set(row.id, row);
  return Array.from(map.values()).sort(
    (x, y) =>
      new Date(y.created_at).getTime() - new Date(x.created_at).getTime(),
  );
}

export function useProperties(options: UsePropertiesOptions = {}) {
  return useQuery({
    queryKey: ["properties", options.segment ?? "all"],
    queryFn: async () => {
      if (options.segment === "residential") {
        // Жилой каталог + вся коммерческая земля в разделе «Участок»
        const [residentialRes, commercialLandRes] = await Promise.all([
          supabasePublic
            .from("properties")
            .select("*")
            .eq("is_active", true)
            .eq("segment", "residential")
            .order("created_at", { ascending: false }),
          supabasePublic
            .from("properties")
            .select("*")
            .eq("is_active", true)
            .eq("segment", "commercial")
            .eq("type", "Земля")
            .order("created_at", { ascending: false }),
        ]);
        if (residentialRes.error) throw residentialRes.error;
        if (commercialLandRes.error) throw commercialLandRes.error;

        const residential = (residentialRes.data || []) as DbProperty[];
        const commercialLand = (
          (commercialLandRes.data || []) as DbProperty[]
        ).filter((p) => isCommercialLand(p));
        return mergeById(residential, commercialLand);
      }

      let query = supabasePublic
        .from("properties")
        .select("*")
        .eq("is_active", true);
      if (options.segment) query = query.eq("segment", options.segment);
      const { data, error } = await query.order("created_at", {
        ascending: false,
      });
      if (error) throw error;
      return data as DbProperty[];
    },
  });
}

export function useAllActiveProperties() {
  return useQuery({
    queryKey: ["properties", "all-active"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabasePublic
        .from("properties")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(4000);
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
