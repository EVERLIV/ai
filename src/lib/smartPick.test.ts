import { describe, expect, it } from "vitest";
import { propertyMatchesLocation } from "@/lib/irkutskLocations";
import {
  matchesSmartPickFilters,
  rankSmartPicks,
  scoreSmartPick,
  type SmartPickCriteria,
  type SmartPickProperty,
} from "@/lib/smartPick";

const base: SmartPickProperty = {
  id: "1",
  type: "Офис",
  deal_type: "Аренда",
  district: "Кировский",
  address: "Иркутск, ул. Ленина, 10",
  price: 80_000,
  area: 50,
  class: "B",
  condition: "Хороший ремонт",
  features: ["Парковка", "Охрана"],
  segment: "commercial",
  extras: {},
};

const criteria: SmartPickCriteria = {
  catalog: "all",
  deal: "Аренда",
  type: "Офис",
  location: "Кировский",
  budgetMin: 50_000,
  budgetMax: 100_000,
  areaMin: 40,
  areaMax: 80,
  rooms: "",
  market: "",
  propertyClass: "Любой",
  condition: "Любое",
  features: [],
  activity: "Офис компании",
  notes: "",
};

describe("propertyMatchesLocation", () => {
  it("matches city district", () => {
    expect(
      propertyMatchesLocation(
        { district: "Кировский", address: "Иркутск" },
        "Кировский",
      ),
    ).toBe(true);
  });

  it("matches Irkutsk without oblast cities", () => {
    expect(
      propertyMatchesLocation(
        { district: "Октябрьский", address: "Иркутск" },
        "Иркутск",
      ),
    ).toBe(true);
    expect(
      propertyMatchesLocation(
        { district: "Ангарск", address: "Ангарск, ул. 1" },
        "Иркутск",
      ),
    ).toBe(false);
  });

  it("Angarsk filter includes Kitoy listings", () => {
    expect(
      propertyMatchesLocation(
        { district: "Китой", address: "Ангарск, Китой" },
        "Ангарск",
      ),
    ).toBe(true);
  });
});

describe("smartPick", () => {
  it("filters by deal type and location", () => {
    expect(matchesSmartPickFilters(base, criteria, "strict")).toBe(true);
    expect(
      matchesSmartPickFilters(
        { ...base, deal_type: "Продажа" },
        criteria,
        "strict",
      ),
    ).toBe(false);
  });

  it("ranks matching offices higher", () => {
    const other: SmartPickProperty = {
      ...base,
      id: "2",
      type: "Склад",
      district: "Ангарск",
      address: "Ангарск",
      price: 200_000,
    };
    const ranked = rankSmartPicks([base, other], criteria, 2);
    expect(ranked[0].property.id).toBe("1");
    expect(scoreSmartPick(base, criteria).fit_score).toBeGreaterThan(50);
  });
});
