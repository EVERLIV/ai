import { useQuery } from "@tanstack/react-query";
import { supabasePublic } from "@/integrations/supabase/client";

/**
 * Уникальные district со всех активных объявлений (жильё / коммерция / земля).
 * Лёгкий select — чтобы фильтры каталога не зависели только от текущего сегмента.
 */
export function usePropertyDistricts() {
  return useQuery({
    queryKey: ["property-districts"],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabasePublic
        .from("properties")
        .select("district")
        .eq("is_active", true)
        .not("district", "is", null)
        .neq("district", "")
        .limit(5000);
      if (error) throw error;
      const set = new Set<string>();
      for (const row of data || []) {
        const d = typeof row.district === "string" ? row.district.trim() : "";
        if (d && d !== "—" && d !== "-") set.add(d);
      }
      return Array.from(set).sort((a, b) => a.localeCompare(b, "ru"));
    },
  });
}
