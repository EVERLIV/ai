import { describe, expect, it } from "vitest";
import {
  getMetroMinutes,
  normalizeCatalogSortKey,
  rankPropertyIdsByQuery,
  sortCatalogProperties,
  type SortableProperty,
} from "./catalogSort";

const sample: SortableProperty[] = [
  {
    id: "1",
    price: 100_000,
    price_per_m2: 2000,
    area: 50,
    address: "ул. Ленина, 10",
    district: "Кировский",
    published_date: "2026-01-01",
    type: "Квартира",
    extras: { metro_minutes: "15 мин" },
  },
  {
    id: "2",
    price: 50_000,
    price_per_m2: 1000,
    area: 50,
    address: "ул. Байкальская, 5",
    district: "Октябрьский",
    published_date: "2026-06-01",
    type: "Офис",
    extras: { metro_minutes: 5 },
  },
  {
    id: "3",
    price: 200_000,
    area: 100,
    address: "Ангарск, кв-л 200",
    district: "Ангарск",
    published_date: "2025-01-01",
    type: "Квартира",
    extras: {},
  },
];

describe("catalogSort", () => {
  it("normalizes legacy date key", () => {
    expect(normalizeCatalogSortKey("date")).toBe("date_desc");
    expect(normalizeCatalogSortKey("price_asc")).toBe("price_asc");
    expect(normalizeCatalogSortKey("???")).toBe("default");
  });

  it("sorts by price asc/desc", () => {
    const asc = sortCatalogProperties(sample, "price_asc").map((p) => p.id);
    expect(asc).toEqual(["2", "1", "3"]);
    const desc = sortCatalogProperties(sample, "price_desc").map((p) => p.id);
    expect(desc).toEqual(["3", "1", "2"]);
  });

  it("sorts by metro minutes", () => {
    expect(getMetroMinutes(sample[1])).toBe(5);
    expect(getMetroMinutes(sample[0])).toBe(15);
    const ids = sortCatalogProperties(sample, "metro_asc").map((p) => p.id);
    expect(ids[0]).toBe("2");
    expect(ids[1]).toBe("1");
  });

  it("default + query uses fuse ranking", () => {
    const ids = sortCatalogProperties(sample, "default", {
      searchQuery: "Байкальская",
    }).map((p) => p.id);
    expect(ids[0]).toBe("2");
  });

  it("ranks by query", () => {
    const ids = rankPropertyIdsByQuery(sample, "офис");
    expect(ids[0]).toBe("2");
  });
});
