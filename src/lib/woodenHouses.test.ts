import { describe, expect, it } from "vitest";
import {
  getWoodenHouseConfig,
  getWoodenHouseConfigByBuildingType,
  houseBuildingTypeOptions,
  isWoodenBuildingType,
  matchesBuildingTypeFilter,
  WOODEN_HOUSE_CONFIGS,
} from "./woodenHouses";

describe("woodenHouses", () => {
  it("has unique config ids and building types", () => {
    const ids = WOODEN_HOUSE_CONFIGS.map((c) => c.id);
    const types = WOODEN_HOUSE_CONFIGS.map((c) => c.buildingType);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(types).size).toBe(types.length);
  });

  it("treats generic and specific labels as wooden", () => {
    expect(isWoodenBuildingType("Деревянный")).toBe(true);
    expect(isWoodenBuildingType("Клееный брус")).toBe(true);
    expect(isWoodenBuildingType("СИП-панели")).toBe(true);
    expect(isWoodenBuildingType("Кирпичный")).toBe(false);
    expect(isWoodenBuildingType("")).toBe(false);
  });

  it("matches catalog chip «Деревянный» to all wooden types", () => {
    expect(matchesBuildingTypeFilter("Каркасный", ["Деревянный"])).toBe(true);
    expect(matchesBuildingTypeFilter("Оцилиндрованное бревно", ["Деревянный"])).toBe(
      true,
    );
    expect(matchesBuildingTypeFilter("Монолит", ["Деревянный"])).toBe(false);
    expect(matchesBuildingTypeFilter("Каркасный", ["Каркасный"])).toBe(true);
    expect(matchesBuildingTypeFilter("Каркасный", [])).toBe(true);
  });

  it("looks up presets by id and building type", () => {
    expect(getWoodenHouseConfig("glulam")?.label).toBe("Клееный брус");
    expect(getWoodenHouseConfigByBuildingType("Лафет")?.id).toBe("laftet");
  });

  it("merges masonry and wooden types for house forms", () => {
    const options = houseBuildingTypeOptions(["Панельный", "Деревянный"]);
    expect(options[0]).toBe("Панельный");
    expect(options).toContain("Деревянный");
    expect(options).toContain("Клееный брус");
    expect(options.filter((v) => v === "Деревянный")).toHaveLength(1);
  });
});
