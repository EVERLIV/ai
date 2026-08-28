import { describe, expect, it } from "vitest";
import {
  buildLocationTree,
  flattenLocationOptions,
} from "@/lib/locationPicker";
import type { DictionaryItem } from "@/hooks/useDictionaries";

function districtRow(
  partial: Partial<DictionaryItem> & Pick<DictionaryItem, "value">,
): DictionaryItem {
  return {
    id: partial.id ?? "1",
    category: "district",
    value: partial.value,
    label: partial.label ?? null,
    parent: partial.parent ?? null,
    parent_id: partial.parent_id ?? null,
    sort_order: partial.sort_order ?? 1,
    is_active: partial.is_active ?? true,
    metadata: partial.metadata ?? {},
    slug: partial.slug ?? null,
    description: partial.description ?? null,
    created_at: partial.created_at ?? "",
    updated_at: partial.updated_at ?? "",
  };
}

describe("locationPicker districts", () => {
  it("includes dictionary districts under parent city", () => {
    const tree = buildLocationTree([
      districtRow({
        id: "1",
        value: "Кировский",
        parent: "Иркутск",
      }),
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

  it("prefers catalog tree for new districts", () => {
    const tree = buildLocationTree([
      districtRow({
        id: "db-1",
        value: "Каталожный район",
        parent: "Иркутск",
        parent_id: "c-irk",
      }),
    ]);
    const irkutsk = tree.find((n) => n.city === "Иркутск");
    expect(irkutsk?.districts).toContain("Каталожный район");
  });
});
