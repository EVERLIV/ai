import { describe, expect, it } from "vitest";
import {
  isAgencyListing,
  isOwnerListing,
  listingMatchesSellerFilter,
  normalizeListingSeller,
} from "@/lib/listingSource";

describe("listingSource", () => {
  it("detects agency by agency_id", () => {
    expect(isAgencyListing({ agency_id: "a1" })).toBe(true);
    expect(isOwnerListing({ agency_id: "a1" })).toBe(false);
  });

  it("detects owner without agency", () => {
    expect(isOwnerListing({ agency_id: null, extras: { agent_account_type: "owner" } })).toBe(true);
    expect(isAgencyListing({ extras: { agent_account_type: "owner" } })).toBe(false);
  });

  it("filters by seller and agency", () => {
    const agency = { agency_id: "ag-1", extras: { agent_account_type: "agency" as const } };
    const owner = { agency_id: null, extras: { agent_account_type: "owner" as const } };
    expect(listingMatchesSellerFilter(agency, "agency", null)).toBe(true);
    expect(listingMatchesSellerFilter(owner, "agency", null)).toBe(false);
    expect(listingMatchesSellerFilter(agency, "owner", null)).toBe(false);
    expect(listingMatchesSellerFilter(agency, "Все", "ag-1")).toBe(true);
    expect(listingMatchesSellerFilter(agency, "Все", "other")).toBe(false);
  });

  it("normalizes seller param", () => {
    expect(normalizeListingSeller("собственник")).toBe("owner");
    expect(normalizeListingSeller("agency")).toBe("agency");
    expect(normalizeListingSeller("")).toBe("Все");
  });
});
