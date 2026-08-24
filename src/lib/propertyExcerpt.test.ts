import { describe, expect, test } from "vitest";
import { buildPropertyListingExcerpt } from "./propertyExcerpt";

describe("buildPropertyListingExcerpt", () => {
  test("truncates at word boundary with ellipsis", () => {
    const raw =
      "Об объекте: Площадь участка – 751 м² (7,5 сotok) Разрешённое использование – для строительства и эксплуатации индивидуального жилого дома";
    const excerpt = buildPropertyListingExcerpt(raw, 80);
    expect(excerpt.endsWith("…")).toBe(true);
    expect(excerpt).not.toMatch(/\s…$/);
    expect(excerpt.length).toBeLessThanOrEqual(83);
  });

  test("returns empty for blank input", () => {
    expect(buildPropertyListingExcerpt("")).toBe("");
    expect(buildPropertyListingExcerpt(null)).toBe("");
  });
});
