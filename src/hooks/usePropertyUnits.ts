import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type PropertyUnit = Tables<"property_units">;

export function usePropertyUnits(propertyId: string | undefined) {
  return useQuery({
    queryKey: ["property-units", propertyId],
    enabled: !!propertyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("property_units")
        .select("*")
        .eq("property_id", propertyId!)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as PropertyUnit[];
    },
  });
}

export function useUpsertUnit(propertyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (unit: Partial<PropertyUnit> & { id?: string }) => {
      if (unit.id) {
        const { id, ...patch } = unit;
        const { error } = await supabase.from("property_units").update(patch).eq("id", id);
        if (error) throw error;
      } else {
        const payload: TablesInsert<"property_units"> = {
          property_id: propertyId,
          name: unit.name || "",
          floor: unit.floor || "",
          area: Number(unit.area || 0),
          price: Number(unit.price || 0),
          price_per_m2: Number(unit.price_per_m2 || 0),
          purpose: unit.purpose || "",
          status: unit.status || "available",
          description: unit.description || "",
          sort_order: Number(unit.sort_order || 0),
        };
        const { error } = await supabase.from("property_units").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["property-units", propertyId] }),
  });
}

export function useDeleteUnit(propertyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("property_units").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["property-units", propertyId] }),
  });
}
