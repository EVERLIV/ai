import { describe, expect, it } from "vitest";
import { getFeatureGroupsFor } from "@/lib/propertyOptions";

describe("getFeatureGroupsFor", () => {
  it("hides land/house plot group for apartments", () => {
    const titles = getFeatureGroupsFor("residential", ["Квартира"]).map((g) => g.title);
    expect(titles).toContain("Комфорт");
    expect(titles).not.toContain("Дом / участок");
    expect(titles).not.toContain("Земельный участок");
  });

  it("includes house plot features for houses", () => {
    const titles = getFeatureGroupsFor("residential", ["Дом"]).map((g) => g.title);
    expect(titles).toContain("Дом / участок");
  });

  it("limits commercial land to land group", () => {
    const titles = getFeatureGroupsFor("commercial", ["Земля"]).map((g) => g.title);
    expect(titles).toEqual(["Земельный участок"]);
  });

  it("keeps office without warehouse/land groups", () => {
    const titles = getFeatureGroupsFor("commercial", ["Офис"]).map((g) => g.title);
    expect(titles).toContain("Инженерия и коммуникации");
    expect(titles).not.toContain("Склад и производство");
    expect(titles).not.toContain("Земельный участок");
  });
});
