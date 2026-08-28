import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  buildCatalogTree,
  filterCatalogItems,
  type CatalogTreeNode,
} from "@/lib/catalogLocations";
import { syncStaticLocationsToCatalog } from "@/lib/syncStaticLocations";
import {
  useDictionaries,
  type DictionaryInsert,
  type DictionaryItem,
  type DictionaryUpdate,
} from "@/hooks/useDictionaries";

export { buildCatalogTree, filterCatalogItems };
export type { CatalogTreeNode, DictionaryItem, DictionaryInsert, DictionaryUpdate };

export function useCatalogAdmin(category: string) {
  const base = useDictionaries(category);
  const queryClient = useQueryClient();

  const syncMutation = useMutation({
    mutationFn: syncStaticLocationsToCatalog,
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["dictionaries"] }),
  });

  const tree =
    category === "district" ? buildCatalogTree(base.items) : [];

  const filteredItems = (query: string) => filterCatalogItems(base.items, query);

  return {
    ...base,
    tree,
    filteredItems,
    syncFromStatic: syncMutation.mutateAsync,
    isSyncing: syncMutation.isPending,
  };
}
