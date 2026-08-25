import { describe, expect, it } from "vitest";
import {
  buildLocationTree,
  flattenLocationOptions,
} from "@/lib/locationPicker";

describe("locationPicker districts", () => {
  it("includes dictionary districts under parent city", () => {
    const tree = buildLocationTree([
      {
        id: "1",
        category: "district",
        value: "Кировский",
        label: null,
        parent: "Иркутск",
        sort_order: 1,
        is_active: true,
        created_at: "",
      },
    ]);
    const irkutsk = tree.find((n) => n.city === "Иркутск");
    expect(irkutsk?.districts).toContain("Кировский");
  });

  it("merges listing districts missing from dictionary", () => {
    const extras = ["Новый район теста", "Ангарск"];
    const options = flattenLocationOptions([], extras);
    expect(options).toContain("Новый район теста");
    expect(options).toContain("Ангарск");
    expect(options).toContain("Иркутск");
  });

  it("puts known Irkutsk microdistrict under Irkutsk", () => {
    const tree = buildLocationTree([], ["Солнечный"]);
    const irkutsk = tree.find((n) => n.city === "Иркутск");
    expect(irkutsk?.districts).toContain("Солнечный");
  });

  it("nests Kitoy under Angarsk, not as oblast city", () => {
    const tree = buildLocationTree();
    const angarsk = tree.find((n) => n.city === "Ангарск");
    expect(angarsk?.districts).toContain("Китой");
    expect(tree.find((n) => n.city === "Китой")).toBeUndefined();
  });
});
