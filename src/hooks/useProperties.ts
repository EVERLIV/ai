import { useQuery } from "@tanstack/react-query";
import type { PropertySegment } from "@/config/propertySegments";
import { supabasePublic } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type DbProperty = Tables<"properties">;

type UsePropertiesOptions = {
  segment?: PropertySegment;
};

async function fetchBySegment(segment: PropertySegment): Promise<DbProperty[]> {
  const { data, error } = await supabasePublic
    .from("properties")
    .select("*")
    .eq("is_active", true)
    .eq("segment", segment)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as DbProperty[];
}

/** Пока на VPS не добавлен enum land — грузим по type Земля/Участок */
async function fetchLandByTypeFallback(): Promise<DbProperty[]> {
  const { data, error } = await supabasePublic
    .from("properties")
    .select("*")
    .eq("is_active", true)
    .in("type", ["Земля", "Участок"])
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []) as DbProperty[];
}

function isInvalidLandSegmentError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as {
    code?: string;
    message?: string;
    details?: string;
    hint?: string;
  };
  const blob =
    `${e.code || ""} ${e.message || ""} ${e.details || ""} ${e.hint || ""}`.toLowerCase();
  return (
    blob.includes("22p02") ||
    blob.includes("invalid input value for enum") ||
    (blob.includes("property_segment") && blob.includes("land"))
  );
}

export function useProperties(options: UsePropertiesOptions = {}) {
  return useQuery({
    queryKey: ["properties", options.segment ?? "all"],
    queryFn: async () => {
      if (!options.segment) {
        const { data, error } = await supabasePublic
          .from("properties")
          .select("*")
          .eq("is_active", true)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return data as DbProperty[];
      }

      if (options.segment === "land") {
        try {
          return await fetchBySegment("land");
        } catch (err) {
          if (isInvalidLandSegmentError(err)) {
            console.warn(
              "[useProperties] segment=land недоступен в БД — fallback по type. Выполните sql/seed_land_segment.sql",
              err,
            );
            return await fetchLandByTypeFallback();
          }
          throw err;
        }
      }

      return await fetchBySegment(options.segment);
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

export function useLandProperties() {
  return useProperties({ segment: "land" });
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
