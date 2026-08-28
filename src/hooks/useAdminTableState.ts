import { useCallback, useMemo, useState } from "react";
import {
  nextSortState,
  type SortDir,
} from "@/lib/adminTableSort";

export type AdminColumnDef<T extends string> = {
  key: T;
  label: string;
  defaultOn: boolean;
  sortable?: boolean;
};

function loadVisibleCols<T extends string>(
  storageKey: string,
  columns: AdminColumnDef<T>[],
): Set<T> {
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw) as T[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return new Set(parsed);
      }
    }
  } catch {
    /* ignore */
  }
  return new Set(columns.filter((c) => c.defaultOn).map((c) => c.key));
}

export function useAdminTableState<T extends string>(
  storageKey: string,
  columns: AdminColumnDef<T>[],
) {
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [search, setSearch] = useState("");
  const [visibleCols, setVisibleCols] = useState<Set<T>>(() =>
    loadVisibleCols(storageKey, columns),
  );

  const toggleCol = useCallback(
    (key: T) => {
      setVisibleCols((prev) => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key);
        else next.add(key);
        localStorage.setItem(storageKey, JSON.stringify(Array.from(next)));
        return next;
      });
    },
    [storageKey],
  );

  const handleSort = useCallback(
    (field: string) => {
      const next = nextSortState(sortField, sortDir, field);
      setSortField(next.field);
      setSortDir(next.dir);
    },
    [sortField, sortDir],
  );

  const sortableColumns = useMemo(
    () => columns.filter((c) => c.sortable !== false),
    [columns],
  );

  return {
    sortField,
    sortDir,
    search,
    setSearch,
    visibleCols,
    toggleCol,
    handleSort,
    columns,
    sortableColumns,
  };
}
