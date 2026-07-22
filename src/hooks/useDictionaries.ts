import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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

export function useAllDictionaryValues() {
  const query = useQuery({
    queryKey: ["dictionaries"],
    queryFn: async () => {
      const { data, error } = await supabase
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

export function useDictionaries(category?: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["dictionaries", category],
    queryFn: async () => {
      let q = supabase
        .from("dictionaries")
        .select("*")
        .order("sort_order", { ascending: true });
      if (category) q = q.eq("category", category);
      const { data, error } = await q;
      if (error) throw error;
      return data as DictionaryItem[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (item: { category: string; value: string; label?: string; parent?: string; sort_order: number }) => {
      const { error } = await supabase.from("dictionaries").insert(item);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dictionaries"] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DictionaryItem> & { id: string }) => {
      const { error } = await supabase.from("dictionaries").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["dictionaries"] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("dictionaries").delete().eq("id", id);
      if (error) throw error;
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
