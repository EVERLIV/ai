import { describe, expect, test } from "vitest";
import {
  allowedPropertyTypesForSubtype,
  assertDeveloperListingPayload,
  assertDeveloperProjectKind,
  defaultMarketForSubtype,
  resolveDeveloperProjectKind,
} from "./developerListingRules";

describe("developerListingRules", () => {
  test("apartment allowlist is flats only", () => {
    expect(allowedPropertyTypesForSubtype("apartment_developer")).toEqual([
      "Квартира",
      "Апартаменты",
    ]);
  });

  test("frame allowlist is houses only", () => {
    expect(allowedPropertyTypesForSubtype("frame_house_builder")).toEqual([
      "Дом на заказ",
      "Дом",
      "Коттедж",
      "Дача",
    ]);
  });

  test("default markets", () => {
    expect(defaultMarketForSubtype("apartment_developer")).toBe("Новостройка");
    expect(defaultMarketForSubtype("frame_house_builder")).toBe("На заказ");
  });

  test("project kind locked to subtype", () => {
    expect(resolveDeveloperProjectKind("apartment_developer")).toBe(
      "residential_complex",
    );
    expect(resolveDeveloperProjectKind("frame_house_builder")).toBe(
      "house_series",
    );
    expect(() =>
      assertDeveloperProjectKind("frame_house_builder", "residential_complex"),
    ).toThrow(/серии домов/);
  });

  test("apartment cannot list house", () => {
    expect(() =>
      assertDeveloperListingPayload({
        subtype: "apartment_developer",
        segment: "residential",
        types: ["Дом"],
        developer_project_id: "p1",
        developer_unit_type_id: "u1",
      }),
    ).toThrow(/только/);
  });

  test("frame cannot list apartment", () => {
    expect(() =>
      assertDeveloperListingPayload({
        subtype: "frame_house_builder",
        segment: "residential",
        types: ["Квартира"],
        developer_project_id: "p1",
        developer_unit_type_id: "u1",
      }),
    ).toThrow(/только/);
  });

  test("requires project and unit", () => {
    expect(() =>
      assertDeveloperListingPayload({
        subtype: "apartment_developer",
        segment: "residential",
        types: ["Квартира"],
      }),
    ).toThrow(/проект/i);

    expect(() =>
      assertDeveloperListingPayload({
        subtype: "apartment_developer",
        segment: "residential",
        types: ["Квартира"],
        developer_project_id: "p1",
      }),
    ).toThrow(/планировк/i);
  });

  test("rejects commercial segment", () => {
    expect(() =>
      assertDeveloperListingPayload({
        subtype: "apartment_developer",
        segment: "commercial",
        types: ["Квартира"],
        developer_project_id: "p1",
        developer_unit_type_id: "u1",
      }),
    ).toThrow(/жилые/);
  });

  test("ok apartment payload", () => {
    expect(() =>
      assertDeveloperListingPayload({
        subtype: "apartment_developer",
        segment: "residential",
        types: ["Квартира"],
        developer_project_id: "p1",
        developer_unit_type_id: "u1",
      }),
    ).not.toThrow();
  });
});
