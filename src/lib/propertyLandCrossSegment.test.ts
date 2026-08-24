import { describe, expect, it } from "vitest";
import { expandLandFilterTypes } from "@/lib/propertyTypeFamilies";
import {
  propertyMatchesSegment,
  propertyMatchesTypes,
} from "@/lib/propertyTypes";

describe("land cross-segment visibility", () => {
  it("expands Участок ↔ Земля in filters", () => {
    expect(expandLandFilterTypes(["Участок"]).sort()).toEqual(
      ["Участок", "Земля"].sort(),
    );
    expect(expandLandFilterTypes(["Земля"]).sort()).toEqual(
      ["Участок", "Земля"].sort(),
    );
  });

  it("matches commercial Земля when filtering residential Участок", () => {
    const land = {
      segment: "commercial" as const,
      type: "Земля",
      extras: null,
    };
    expect(propertyMatchesTypes(land, ["Участок"])).toBe(true);
    expect(propertyMatchesSegment(land, "residential")).toBe(true);
  });

  it("keeps apartments out of land filter", () => {
    const flat = {
      segment: "residential" as const,
      type: "Квартира",
      extras: null,
    };
    expect(propertyMatchesTypes(flat, ["Участок"])).toBe(false);
  });
});
