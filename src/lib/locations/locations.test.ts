import { describe, expect, it } from "vitest";
import {
  findLocationByName,
  inferLocationLeaf,
  matchLocationFilter,
  toPropertyLocationExtras,
} from "@/lib/locations";
import { inferDistrictFromAddress } from "@/lib/irkutskLocations";

describe("locations hierarchy", () => {
  it("places Kitoy under Angarsk", () => {
    const kitoy = findLocationByName("Китой");
    expect(kitoy?.parentId).toBe("city:angarsk");
    expect(kitoy?.kind).toBe("settlement");
  });

  it("matchLocationFilter: Angarsk includes Kitoy", () => {
    expect(matchLocationFilter("Китой", "Ангарск")).toBe(true);
    expect(matchLocationFilter("Ангарск", "Ангарск")).toBe(true);
    expect(matchLocationFilter("Китой", "Китой")).toBe(true);
    expect(matchLocationFilter("Иркутск", "Ангарск")).toBe(false);
  });

  it("infers Kitoy leaf from address", () => {
    expect(
      inferDistrictFromAddress("Ангарск, Китой, ул. Примерная, 1"),
    ).toBe("Китой");
    const leaf = inferLocationLeaf("р-н Китой, Ангарск");
    expect(leaf?.name).toBe("Китой");
  });

  it("builds extras.path for Kitoy", () => {
    const kitoy = findLocationByName("Китой")!;
    const extras = toPropertyLocationExtras(kitoy);
    expect(extras.city).toBe("Ангарск");
    expect(extras.locality).toBe("Китой");
    expect(extras.path).toContain("Ангарск");
    expect(extras.path).toContain("Китой");
  });
});
