import { describe, expect, it } from "vitest";
import {
  rankByQualityMatch,
  scoreListingQuality,
  type RecommendableProperty,
} from "./recommendationEngine";
import type { UserPreferenceSignals } from "./userPreferences";

const rich: RecommendableProperty = {
  id: "rich",
  price: 80_000,
  area: 50,
  address: "Иркутск, ул. Ленина, 10",
  district: "Кировский",
  type: "Офис",
  deal_type: "Аренда",
  description: "A".repeat(220),
  cover_photo: "https://example.com/1.jpg",
  photos_count: 8,
  features: ["Парковка", "Охрана", "Интернет"],
  published_date: new Date().toISOString(),
  views_count: 50,
  lat: 52.28,
  lng: 104.28,
};

const thin: RecommendableProperty = {
  id: "thin",
  price: 0,
  area: 0,
  address: "—",
  district: "—",
  type: "Офис",
  deal_type: "Аренда",
  description: "",
  photos_count: 0,
  features: [],
  published_date: "2020-01-01",
  views_count: 0,
};

const prefs: UserPreferenceSignals = {
  viewedIds: [],
  types: { Офис: 4 },
  districts: { Кировский: 3 },
  dealTypes: { Аренда: 2 },
  segments: {},
  prices: [75_000],
  areas: [48],
  queries: [],
  updatedAt: Date.now(),
};

describe("recommendationEngine Quality Match", () => {
  it("scores complete listing higher than empty card", () => {
    expect(scoreListingQuality(rich)).toBeGreaterThan(scoreListingQuality(thin));
  });

  it("ranks quality listing first even if older paid-looking sibling is empty", () => {
    const paidLooking: RecommendableProperty = {
      ...thin,
      id: "paid",
      extras: { premium: true, ad_budget: 999999 },
    };
    const ids = rankByQualityMatch([paidLooking, rich], { prefs }).map(
      (p) => p.id,
    );
    expect(ids[0]).toBe("rich");
  });

  it("does not use extras premium/budget as ranking signal", () => {
    const a = scoreListingQuality({ ...rich, extras: { premium: true } });
    const b = scoreListingQuality({ ...rich, extras: {} });
    expect(a).toBe(b);
  });
});
