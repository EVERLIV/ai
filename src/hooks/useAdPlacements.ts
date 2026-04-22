import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type DbAdPlacement = Tables<"ad_placements">;

/** Все активные позиции с данными об объекте — для публичного каталога */
export function useAdPlacementsWithProperty() {
  return useQuery({
    queryKey: ["ad_placements_with_property"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_placements")
        .select("*, property:properties!ad_placements_property_id_fkey(id,address,district,type,cover_photo,photos)")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(2000);
      if (error) throw error;
      return (data || []) as (DbAdPlacement & {
        property: Pick<Tables<"properties">, "id" | "address" | "district" | "type" | "cover_photo" | "photos"> | null;
      })[];
    },
  });
}

/** Позиции конкретного объекта (для админки внутри карточки) */
export function useAdPlacementsByProperty(propertyId: string | undefined) {
  return useQuery({
    queryKey: ["ad_placements_by_property", propertyId],
    enabled: !!propertyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_placements")
        .select("*")
        .eq("property_id", propertyId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as DbAdPlacement[];
    },
  });
}

/** Все позиции (для отдельного раздела «Реклама» в админке) */
export function useAllAdPlacements() {
  return useQuery({
    queryKey: ["all_ad_placements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ad_placements")
        .select("*, property:properties!ad_placements_property_id_fkey(id,address,district,type)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });
}

export function useUpsertAdPlacement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: TablesInsert<"ad_placements"> & { id?: string }) => {
      if (payload.id) {
        const { id, ...rest } = payload;
        const { error } = await supabase
          .from("ad_placements")
          .update(rest as TablesUpdate<"ad_placements">)
          .eq("id", id);
        if (error) throw error;
        return id;
      }
      const { data, error } = await supabase
        .from("ad_placements")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ad_placements_by_property"] });
      qc.invalidateQueries({ queryKey: ["ad_placements_with_property"] });
      qc.invalidateQueries({ queryKey: ["all_ad_placements"] });
    },
  });
}

export function useDeleteAdPlacement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("ad_placements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ad_placements_by_property"] });
      qc.invalidateQueries({ queryKey: ["ad_placements_with_property"] });
      qc.invalidateQueries({ queryKey: ["all_ad_placements"] });
    },
  });
}
