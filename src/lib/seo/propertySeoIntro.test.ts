import { describe, expect, test } from "vitest";
import { buildPropertySeoIntro } from "./propertySeoIntro";
import {
  buildPropertySeoDescription,
  buildPropertySeoTitle,
} from "./propertySeoTitle";

describe("property SEO title/description", () => {
  test("builds unique title with deal, type, place, price", () => {
    const title = buildPropertySeoTitle({
      deal_type: "Аренда",
      type: "Офис",
      address: "г. Иркутск, ул. Ленина, 1",
      district: "Кировский",
      price: 45000,
      area: 80,
    });
    expect(title).toContain("Аренда");
    expect(title).toContain("офис");
    expect(title).toContain("45 тыс");
  });

  test("description includes area and text snippet", () => {
    const desc = buildPropertySeoDescription({
      type: "Квартира",
      area: 54,
      price: 3_500_000,
      deal_type: "Продажа",
      district: "Ленинский",
      description: "Светлая квартира с ремонтом у метро.",
    });
    expect(desc).toContain("54 м²");
    expect(desc).toContain("Светлая квартира");
  });
});

describe("buildPropertySeoIntro", () => {
  test("returns readable unique intro", () => {
    const intro = buildPropertySeoIntro({
      deal_type: "Аренда",
      type: "Склад",
      area: 200,
      price: 120000,
      district: "Правобережный",
      address: "ул. Баррикад, 10",
      floor: "1",
      total_floors: "2",
    });
    expect(intro).toMatch(/Аренда/i);
    expect(intro).toMatch(/склад/i);
    expect(intro).toMatch(/200/);
    expect(intro).toMatch(/ДАДАТУТ/);
  });
});
