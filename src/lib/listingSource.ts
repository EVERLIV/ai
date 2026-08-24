import type { PropertySidebarExtras } from "@/lib/propertySidebar";

type ListingSourceProperty = {
  agency_id?: string | null;
  extras?: PropertySidebarExtras | Record<string, unknown> | null;
};

function extrasOf(p: ListingSourceProperty): PropertySidebarExtras {
  return (p.extras || {}) as PropertySidebarExtras;
}

/** ID агентства у объявления (колонка или extras) */
export function getPropertyAgencyId(p: ListingSourceProperty): string | null {
  if (typeof p.agency_id === "string" && p.agency_id.trim()) return p.agency_id;
  const fromExtras = extrasOf(p).agency_id;
  return typeof fromExtras === "string" && fromExtras.trim()
    ? fromExtras
    : null;
}

/** Объект от агентства / риелтора (не частный собственник) */
export function isAgencyListing(p: ListingSourceProperty): boolean {
  if (getPropertyAgencyId(p)) return true;
  const type = extrasOf(p).agent_account_type;
  return type === "agency" || type === "realtor";
}

export function isOwnerListing(p: ListingSourceProperty): boolean {
  return !isAgencyListing(p);
}

export type ListingSellerFilter = "Все" | "owner" | "agency";

export function normalizeListingSeller(
  value: string | null | undefined,
): ListingSellerFilter {
  const v = (value || "").trim().toLowerCase();
  if (v === "owner" || v === "собственник") return "owner";
  if (v === "agency" || v === "агентство" || v === "realtor" || v === "риелтор")
    return "agency";
  return "Все";
}

export function listingMatchesSellerFilter(
  p: ListingSourceProperty,
  seller: ListingSellerFilter,
  agencyId?: string | null,
): boolean {
  if (agencyId) return getPropertyAgencyId(p) === agencyId;
  if (seller === "owner") return isOwnerListing(p);
  if (seller === "agency") return isAgencyListing(p);
  return true;
}
