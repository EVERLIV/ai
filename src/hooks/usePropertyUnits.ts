import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabaseAdmin } from "@/integrations/supabase/adminClient";
import type { Tables, TablesInsert } from "@/integrations/supabase/types";

export type PropertyUnit = Tables<"property_units">;

/**
 * Self-hosted PostgREST часто отклоняет user JWT (401).
 * Читаем/пишем через service_role по property_id.
 */
export function usePropertyUnits(propertyId: string | undefined) {
  return useQuery({
    queryKey: ["property-units", propertyId],
    enabled: !!propertyId,
    queryFn: async () => {
      const { data, error } = await supabaseAdmin.db.select(
        "property_units",
        `select=*&property_id=eq.${propertyId}&order=sort_order.asc,created_at.asc`,
      );
      if (error) {
        const msg =
          typeof error === "object" && error && "message" in error
            ? String((error as { message?: string }).message)
            : "Не удалось загрузить юниты";
        throw new Error(msg);
      }
      return (Array.isArray(data) ? data : []) as PropertyUnit[];
    },
  });
}

export function useUpsertUnit(propertyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (unit: Partial<PropertyUnit> & { id?: string }) => {
      if (unit.id) {
        const { id, ...patch } = unit;
        const { error } = await supabaseAdmin.db.update(
          "property_units",
          `id=eq.${id}`,
          patch,
        );
        if (error) {
          throw new Error(
            typeof error === "object" && error && "message" in error
              ? String((error as { message?: string }).message)
              : "Не удалось обновить юнит",
          );
        }
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
          photos: unit.photos || [],
        };
        const { error } = await supabaseAdmin.db.insert(
          "property_units",
          payload,
        );
        if (error) {
          throw new Error(
            typeof error === "object" && error && "message" in error
              ? String((error as { message?: string }).message)
              : "Не удалось создать юнит",
          );
        }
      }
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["property-units", propertyId] }),
  });
}

export function useDeleteUnit(propertyId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabaseAdmin.db.delete(
        "property_units",
        `id=eq.${id}`,
      );
      if (error) {
        throw new Error(
          typeof error === "object" && error && "message" in error
            ? String((error as { message?: string }).message)
            : "Не удалось удалить юнит",
        );
      }
    },
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["property-units", propertyId] }),
  });
}
