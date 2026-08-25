import { describe, expect, it } from "vitest";
import { propertyTypesForSegment } from "@/lib/dictionaryPropertyTypes";

describe("propertyTypesForSegment", () => {
  it("splits by parent and falls back to constants when empty", () => {
    expect(propertyTypesForSegment([], "commercial")).toContain("Офис");
    expect(propertyTypesForSegment([], "commercial")).not.toContain("Земля");
    expect(propertyTypesForSegment([], "residential")).toContain("Квартира");
    expect(propertyTypesForSegment([], "residential")).not.toContain("Участок");
    expect(propertyTypesForSegment([], "land")).toEqual(["Земля", "Участок"]);
  });

  it("routes land parent separately from commercial", () => {
    const items = [
      {
        category: "property_type",
        value: "Павильон",
        parent: null,
        sort_order: 1,
      },
      {
        category: "property_type",
        value: "Квартира",
        parent: "residential",
        sort_order: 2,
      },
      {
        category: "property_type",
        value: "Земля",
        parent: "land",
        sort_order: 3,
      },
    ];
    expect(propertyTypesForSegment(items, "commercial")).toEqual(["Павильон"]);
    expect(propertyTypesForSegment(items, "residential")).toEqual(["Квартира"]);
    expect(propertyTypesForSegment(items, "land")).toEqual(["Земля"]);
  });

  it("ignores other dictionary categories", () => {
    const items = [
      {
        category: "deal_type",
        value: "Аренда",
        parent: null,
        sort_order: 1,
      },
      {
        category: "property_type",
        value: "Производство",
        parent: "commercial",
        sort_order: 2,
      },
    ];
    expect(propertyTypesForSegment(items, "commercial")).toEqual([
      "Производство",
    ]);
  });
});
