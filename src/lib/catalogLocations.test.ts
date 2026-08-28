import { describe, expect, it } from "vitest";
import type { DictionaryItem } from "@/hooks/useDictionaries";
import {
  buildCatalogTree,
  buildLocationTreeFromCatalog,
  filterCatalogItems,
  getLocationCatalogLists,
} from "@/lib/catalogLocations";

function districtItem(
  partial: Partial<DictionaryItem> & Pick<DictionaryItem, "id" | "value">,
): DictionaryItem {
  return {
    category: "district",
    label: null,
    parent: null,
    parent_id: null,
    sort_order: 0,
    is_active: true,
    metadata: {},
    slug: null,
    description: null,
    created_at: "",
    updated_at: "",
    ...partial,
  };
}

describe("catalogLocations", () => {
  it("builds tree by parent_id", () => {
    const items: DictionaryItem[] = [
      districtItem({ id: "r1", value: "Иркутская область", metadata: { kind: "region" } }),
      districtItem({
        id: "c1",
        value: "Иркутск",
        parent_id: "r1",
        parent: "Иркутская область",
        metadata: { kind: "city" },
      }),
      districtItem({
        id: "d1",
        value: "Кировский",
        parent_id: "c1",
        parent: "Иркутск",
        metadata: { kind: "district" },
      }),
    ];

    const tree = buildCatalogTree(items);
    expect(tree).toHaveLength(1);
    expect(tree[0].item.value).toBe("Иркутская область");
    expect(tree[0].children[0].item.value).toBe("Иркутск");
    expect(tree[0].children[0].children[0].item.value).toBe("Кировский");
  });

  it("builds location city tree from catalog", () => {
    const items: DictionaryItem[] = [
      districtItem({ id: "c1", value: "Иркутск", metadata: { kind: "city" } }),
      districtItem({
        id: "d1",
        value: "Новый район",
        parent: "Иркутск",
        parent_id: "c1",
        metadata: { kind: "district" },
      }),
    ];

    const tree = buildLocationTreeFromCatalog(items);
    const irkutsk = tree.find((n) => n.city === "Иркутск");
    expect(irkutsk?.districts).toContain("Новый район");
  });

  it("merges catalog lists with static defaults", () => {
    const lists = getLocationCatalogLists([
      districtItem({
        id: "x1",
        value: "Тестоград",
        metadata: { kind: "city" },
      }),
    ]);
    expect(lists.oblastCities).toContain("Тестоград");
    expect(lists.irkutskDistricts).toContain("Кировский");
  });

  it("filters items by search query", () => {
    const items: DictionaryItem[] = [
      districtItem({ id: "1", value: "Кировский" }),
      districtItem({ id: "2", value: "Ангарск" }),
    ];
    expect(filterCatalogItems(items, "киров")).toHaveLength(1);
  });
});
