import { describe, expect, test } from "vitest";
import { catalogHasFilterQuery } from "./catalogIndexability";

describe("catalogHasFilterQuery", () => {
  test("empty query is indexable", () => {
    expect(catalogHasFilterQuery("")).toBe(false);
    expect(catalogHasFilterQuery(new URLSearchParams())).toBe(false);
  });

  test("sort and filters are not indexable", () => {
    expect(catalogHasFilterQuery("sort=price_asc")).toBe(true);
    expect(catalogHasFilterQuery("types=Офис&deal=Аренда")).toBe(true);
    expect(catalogHasFilterQuery("q=байкал")).toBe(true);
  });

  test("tab alone stays indexable", () => {
    expect(catalogHasFilterQuery("tab=agentstva")).toBe(false);
  });

  test("utm params alone stay indexable", () => {
    expect(catalogHasFilterQuery("utm_source=google&utm_medium=cpc")).toBe(
      false,
    );
  });
});
