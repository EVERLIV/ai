export type SortDir = "asc" | "desc";

export function compareValues(
  a: unknown,
  b: unknown,
  dir: SortDir,
): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;

  if (typeof a === "boolean" && typeof b === "boolean") {
    const av = a ? 1 : 0;
    const bv = b ? 1 : 0;
    return dir === "asc" ? av - bv : bv - av;
  }

  if (typeof a === "number" && typeof b === "number") {
    return dir === "asc" ? a - b : b - a;
  }

  const as = String(a).toLowerCase();
  const bs = String(b).toLowerCase();
  if (as < bs) return dir === "asc" ? -1 : 1;
  if (as > bs) return dir === "asc" ? 1 : -1;
  return 0;
}

export function compareDates(
  a: string | null | undefined,
  b: string | null | undefined,
  dir: SortDir,
): number {
  const at = a ? new Date(a).getTime() : 0;
  const bt = b ? new Date(b).getTime() : 0;
  return dir === "asc" ? at - bt : bt - at;
}

export function sortRows<T>(
  rows: T[],
  sortField: string | null,
  sortDir: SortDir,
  getValue: (row: T, field: string) => unknown,
): T[] {
  if (!sortField) return rows;
  return [...rows].sort((a, b) =>
    compareValues(getValue(a, sortField), getValue(b, sortField), sortDir),
  );
}

export function nextSortState(
  currentField: string | null,
  currentDir: SortDir,
  field: string,
): { field: string | null; dir: SortDir } {
  if (currentField === field) {
    if (currentDir === "asc") return { field, dir: "desc" };
    return { field: null, dir: "asc" };
  }
  return { field, dir: "asc" };
}
