import { describe, expect, test } from "vitest";
import {
  buildCatalogUrl,
  readCatalogFiltersFromSearchParams,
} from "./catalogLinks";

describe("buildCatalogUrl", () => {
  test("uses residential base route and rooms", () => {
    expect(
      buildCatalogUrl({
        segment: "residential",
        types: "Квартира",
        rooms: ["1", "2"],
        deal: "Аренда",
      }),
    ).toBe(
      "/zhilaya/catalog?types=%D0%9A%D0%B2%D0%B0%D1%80%D1%82%D0%B8%D1%80%D0%B0&rooms=1%2C2&deal=%D0%90%D1%80%D0%B5%D0%BD%D0%B4%D0%B0",
    );
  });
});

describe("readCatalogFiltersFromSearchParams", () => {
  test("reads selected rooms from query string", () => {
    const params = new URLSearchParams(
      "types=%D0%9A%D0%B2%D0%B0%D1%80%D1%82%D0%B8%D1%80%D0%B0&rooms=1,3",
    );
    expect(readCatalogFiltersFromSearchParams(params).selectedRooms).toEqual([
      "1",
      "3",
    ]);
  });

  test("reads residential market and building filters", () => {
    const params = new URLSearchParams(
      "market=%D0%9D%D0%BE%D0%B2%D0%BE%D1%81%D1%82%D1%80%D0%BE%D0%B9%D0%BA%D0%B0&bld=%D0%9C%D0%BE%D0%BD%D0%BE%D0%BB%D0%B8%D1%82&furniture=%D0%A1+%D0%BC%D0%B5%D0%B1%D0%B5%D0%BB%D1%8C%D1%8E",
    );
    const filters = readCatalogFiltersFromSearchParams(params);
    expect(filters.selectedMarket).toEqual(["Новостройка"]);
    expect(filters.selectedBuildingTypes).toEqual(["Монолит"]);
    expect(filters.selectedFurniture).toEqual(["С мебелью"]);
  });
});
