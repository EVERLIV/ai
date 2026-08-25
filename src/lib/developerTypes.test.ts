import { describe, expect, it } from "vitest";
import {
  defaultProjectKindForSubtype,
  normalizeDeveloperSubtype,
  slugifyProjectTitle,
} from "@/lib/developerTypes";

describe("developerTypes helpers", () => {
  it("normalizes subtype", () => {
    expect(normalizeDeveloperSubtype("apartment_developer")).toBe(
      "apartment_developer",
    );
    expect(normalizeDeveloperSubtype("frame")).toBe("frame_house_builder");
    expect(normalizeDeveloperSubtype("дерево")).toBe("frame_house_builder");
    expect(normalizeDeveloperSubtype("")).toBe("apartment_developer");
  });

  it("maps subtype to project kind", () => {
    expect(defaultProjectKindForSubtype("apartment_developer")).toBe(
      "residential_complex",
    );
    expect(defaultProjectKindForSubtype("frame_house_builder")).toBe(
      "house_series",
    );
  });

  it("slugifies russian titles", () => {
    expect(slugifyProjectTitle("ЖК Северный")).toMatch(/severny/);
    expect(slugifyProjectTitle("")).toBe("");
  });
});
