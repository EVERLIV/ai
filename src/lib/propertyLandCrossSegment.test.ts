import { describe, expect, it } from "vitest";
import { expandLandFilterTypes } from "@/lib/propertyTypeFamilies";
import {
  getPropertySegment,
  propertyMatchesSegment,
  propertyMatchesTypes,
} from "@/lib/propertyTypes";

describe("land segment", () => {
  it("expands Участок ↔ Земля in filters", () => {
    expect(expandLandFilterTypes(["Участок"]).sort()).toEqual(
      ["Участок", "Земля"].sort(),
    );
    expect(expandLandFilterTypes(["Земля"]).sort()).toEqual(
      ["Участок", "Земля"].sort(),
    );
  });

  it("assigns Земля/Участок to land segment", () => {
    expect(
      getPropertySegment({ segment: "commercial", type: "Земля", extras: null }),
    ).toBe("land");
    expect(
      getPropertySegment({
        segment: "residential",
        type: "Участок",
        extras: null,
      }),
    ).toBe("land");
    expect(
      getPropertySegment({ segment: "land", type: "Земля", extras: null }),
    ).toBe("land");
  });

  it("matches land only in land catalog", () => {
    const land = {
      segment: "land" as const,
      type: "Земля",
      extras: null,
    };
    expect(propertyMatchesSegment(land, "land")).toBe(true);
    expect(propertyMatchesSegment(land, "residential")).toBe(false);
    expect(propertyMatchesSegment(land, "commercial")).toBe(false);
    expect(propertyMatchesTypes(land, ["Участок"])).toBe(true);
  });

  it("keeps apartments out of land filter", () => {
    const flat = {
      segment: "residential" as const,
      type: "Квартира",
      extras: null,
    };
    expect(propertyMatchesTypes(flat, ["Участок"])).toBe(false);
    expect(propertyMatchesSegment(flat, "land")).toBe(false);
  });
});
