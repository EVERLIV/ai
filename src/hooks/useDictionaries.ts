import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabasePublic } from "@/integrations/supabase/client";
import { supabaseAdmin } from "@/integrations/supabase/adminClient";

export interface DictionaryItem {
  id: string;
  category: string;
  value: string;
  label: string | null;
  parent: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export const DICTIONARY_CATEGORIES: { key: string; title: string; hasParent: boolean }[] = [
  { key: "property_type", title: "Тип объекта", hasParent: false },
  { key: "property_class", title: "Класс объекта", hasParent: false },
  { key: "deal_type", title: "Тип сделки", hasParent: false },
  { key: "district", title: "Район / Локация", hasParent: true },
  { key: "condition", title: "Состояние", hasParent: false },
  { key: "layout", title: "Планировка", hasParent: false },
  { key: "parking", title: "Парковка", hasParent: false },
  { key: "purpose", title: "Назначение", hasParent: false },
  { key: "deposit", title: "Залог", hasParent: false },
  { key: "contract_term", title: "Срок договора", hasParent: false },
  { key: "utilities", title: "Коммунальные", hasParent: false },
  { key: "vat", title: "НДС", hasParent: false },
  { key: "landlord_type", title: "Тип арендодателя", hasParent: false },
];

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
      return data as DictionaryItem[];
    },
    staleTime: 60_000,
  });

  const all = query.data ?? [];

  const byCategory = (cat: string): string[] =>
    all.filter((i) => i.category === cat).map((i) => i.value);

  return { all, byCategory, isLoading: query.isLoading };
}

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
      const { data, error } = await supabaseAdmin.db.select("dictionaries", params.toString());
      if (error) throw adminError(error, "Не удалось загрузить справочник");
      return (data || []) as DictionaryItem[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (item: {
      category: string;
      value: string;
      label?: string;
      parent?: string;
      sort_order: number;
    }) => {
      const { error } = await supabaseAdmin.db.insert("dictionaries", item);
      if (error) throw adminError(error, "Не удалось добавить значение");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dictionaries"] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DictionaryItem> & { id: string }) => {
      const { error } = await supabaseAdmin.db.update("dictionaries", `id=eq.${id}`, updates);
      if (error) throw adminError(error, "Не удалось сохранить значение");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dictionaries"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabaseAdmin.db.delete("dictionaries", `id=eq.${id}`);
      if (error) throw adminError(error, "Не удалось удалить значение");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dictionaries"] }),
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
