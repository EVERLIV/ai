import { describe, expect, it } from "vitest";
import {
  isDailyDeal,
  isLongTermRent,
  isRentDeal,
  isSaleDeal,
} from "@/lib/propertyDeal";
import {
  isAnyLand,
  isDwellingLike,
  isFlatLike,
  isHouseLike,
  isParkingLike,
  isResidentialLand,
} from "@/lib/propertyTypeFamilies";

describe("propertyDeal", () => {
  it("distinguishes sale, long-term rent and daily", () => {
    expect(isSaleDeal("Продажа")).toBe(true);
    expect(isRentDeal("Аренда")).toBe(true);
    expect(isRentDeal("Посуточно")).toBe(false);
    expect(isDailyDeal("Посуточно")).toBe(true);
    expect(isLongTermRent("Аренда")).toBe(true);
    expect(isLongTermRent("Посуточно")).toBe(false);
  });
});

describe("propertyTypeFamilies", () => {
  it("detects flats, houses, parking and plots", () => {
    expect(isFlatLike(["Квартира"])).toBe(true);
    expect(isHouseLike("Дом")).toBe(true);
    expect(isDwellingLike(["Апартаменты"])).toBe(true);
    expect(isParkingLike("Гараж")).toBe(true);
    expect(isResidentialLand("Участок")).toBe(true);
    expect(isAnyLand({ type: "Участок" })).toBe(true);
    expect(isAnyLand({ type: "Земля" })).toBe(true);
    expect(isAnyLand("Квартира")).toBe(false);
    expect(isFlatLike("Участок")).toBe(false);
  });
});
