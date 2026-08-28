import { getPropertyTypes } from "@/lib/propertyTypes";
import { compareDates, compareValues, type SortDir } from "@/lib/adminTableSort";

export type DashboardProperty = {
  id: string;
  type?: string | null;
  address?: string | null;
  district?: string | null;
  area?: number | null;
  price?: number | null;
  price_per_m2?: number | null;
  deal_type?: string | null;
  floor?: string | null;
  total_floors?: number | null;
  ceiling_height?: number | null;
  parking?: string | null;
  condition?: string | null;
  layout?: string | null;
  deposit?: string | null;
  contract_term?: string | null;
  features?: string[] | null;
  photos_count?: number | null;
  photos?: string[] | null;
  views_count?: number | null;
  published_date?: string | null;
  created_at?: string | null;
  is_active?: boolean | null;
  description?: string | null;
  manager?: { full_name?: string | null } | null;
  client?: { full_name?: string | null } | null;
};

export function propertySortValue(
  p: DashboardProperty,
  field: string,
): unknown {
  switch (field) {
    case "type":
      return getPropertyTypes(p).join(", ");
    case "manager":
      return p.manager?.full_name ?? "";
    case "client":
      return p.client?.full_name ?? "";
    case "status":
    case "is_active":
      return !!p.is_active;
    case "published_date":
    case "created_at":
      return p.published_date || p.created_at || null;
    case "photos_count":
      return p.photos_count ?? p.photos?.length ?? 0;
    case "features":
      return (p.features || []).join(", ");
    default:
      return (p as Record<string, unknown>)[field];
  }
}

export function sortProperties(
  rows: DashboardProperty[],
  sortField: string | null,
  sortDir: SortDir,
): DashboardProperty[] {
  if (!sortField) return rows;
  if (sortField === "published_date" || sortField === "created_at") {
    return [...rows].sort((a, b) =>
      compareDates(
        String(propertySortValue(a, sortField) || ""),
        String(propertySortValue(b, sortField) || ""),
        sortDir,
      ),
    );
  }
  return [...rows].sort((a, b) =>
    compareValues(
      propertySortValue(a, sortField),
      propertySortValue(b, sortField),
      sortDir,
    ),
  );
}

export function filterProperties(
  rows: DashboardProperty[],
  query: string,
): DashboardProperty[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows;
  return rows.filter(
    (p) =>
      p.address?.toLowerCase().includes(q) ||
      p.district?.toLowerCase().includes(q) ||
      getPropertyTypes(p).some((t) => t.toLowerCase().includes(q)) ||
      p.description?.toLowerCase().includes(q),
  );
}
