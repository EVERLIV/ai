import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import type { PropertySegment } from "@/config/propertySegments";
import { supabaseAdmin } from "@/integrations/supabase/adminClient";
import { supabasePublic } from "@/integrations/supabase/client";
import { propertyTypesForSegment } from "@/lib/dictionaryPropertyTypes";
import {
  CATALOG_CATEGORIES,
  DICTIONARY_CATEGORIES,
} from "@/lib/catalogRegistry";

export type DictionaryMetadata = Record<string, unknown>;

export interface DictionaryItem {
  id: string;
  category: string;
  value: string;
  label: string | null;
  parent: string | null;
  parent_id: string | null;
  sort_order: number;
  is_active: boolean;
  metadata: DictionaryMetadata;
  slug: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export { CATALOG_CATEGORIES, DICTIONARY_CATEGORIES };

function normalizeDictionaryRow(row: Record<string, unknown>): DictionaryItem {
  return {
    id: String(row.id),
    category: String(row.category),
    value: String(row.value),
    label: row.label != null ? String(row.label) : null,
    parent: row.parent != null ? String(row.parent) : null,
    parent_id: row.parent_id != null ? String(row.parent_id) : null,
    sort_order: Number(row.sort_order ?? 0),
    is_active: row.is_active !== false,
    metadata:
      row.metadata && typeof row.metadata === "object" && !Array.isArray(row.metadata)
        ? (row.metadata as DictionaryMetadata)
        : {},
    slug: row.slug != null ? String(row.slug) : null,
    description: row.description != null ? String(row.description) : null,
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? row.created_at ?? ""),
  };
}

function adminError(error: unknown, fallback: string) {
  const msg =
    error && typeof error === "object" && "message" in error
      ? String((error as { message?: string }).message)
      : "";
  return new Error(msg || fallback);
}

export function useAllDictionaryValues() {
  const query = useQuery({
    queryKey: ["dictionaries"],
    queryFn: async () => {
      const { data, error } = await supabasePublic
        .from("dictionaries")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data ?? []).map((row) =>
        normalizeDictionaryRow(row as Record<string, unknown>),
      );
    },
    staleTime: 60_000,
  });

  const all = query.data ?? [];

  const byCategory = useCallback(
    (cat: string): string[] =>
      all.filter((i) => i.category === cat).map((i) => i.value),
    [all],
  );

  const propertyTypes = useCallback(
    (segment: PropertySegment): string[] =>
      propertyTypesForSegment(all, segment),
    [all],
  );

  return { all, byCategory, propertyTypes, isLoading: query.isLoading };
}

export type DictionaryInsert = {
  category: string;
  value: string;
  label?: string | null;
  parent?: string | null;
  parent_id?: string | null;
  sort_order: number;
  slug?: string | null;
  description?: string | null;
  metadata?: DictionaryMetadata;
  is_active?: boolean;
};

export type DictionaryUpdate = Partial<DictionaryInsert> & { id: string };

/** Админка «Справочники» — через service_role, user JWT Kong отклоняет. */
export function useDictionaries(category?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["dictionaries", category],
    queryFn: async () => {
      const params = new URLSearchParams({
        select: "*",
        order: "sort_order.asc",
      });
      if (category) params.set("category", `eq.${category}`);
      const { data, error } = await supabaseAdmin.db.select(
        "dictionaries",
        params.toString(),
      );
      if (error) throw adminError(error, "Не удалось загрузить справочник");
      return ((data || []) as Record<string, unknown>[]).map(normalizeDictionaryRow);
    },
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["dictionaries"] });

  const addMutation = useMutation({
    mutationFn: async (item: DictionaryInsert) => {
      const { error } = await supabaseAdmin.db.insert("dictionaries", {
        ...item,
        metadata: item.metadata ?? {},
        is_active: item.is_active ?? true,
      });
      if (error) throw adminError(error, "Не удалось добавить значение");
    },
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: DictionaryUpdate) => {
      const { error } = await supabaseAdmin.db.update(
        "dictionaries",
        `id=eq.${id}`,
        updates,
      );
      if (error) throw adminError(error, "Не удалось сохранить значение");
    },
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabaseAdmin.db.delete(
        "dictionaries",
        `id=eq.${id}`,
      );
      if (error) throw adminError(error, "Не удалось удалить значение");
    },
    onSuccess: invalidate,
  });

  return {
    items: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    add: addMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
