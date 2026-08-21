import { describe, expect, it } from "vitest";
import { inferDistrictFromAddress } from "@/lib/irkutskLocations";

describe("inferDistrictFromAddress", () => {
  it("detects Irkutsk city district", () => {
    expect(inferDistrictFromAddress("Россия, Иркутск, Октябрьский район, ул. Байкальская")).toBe("Октябрьский");
  });

  it("detects oblast city", () => {
    expect(inferDistrictFromAddress("Ангарск, ул. Карла Маркса, 1")).toBe("Ангарск");
  });

  it("detects microdistrict", () => {
    expect(inferDistrictFromAddress("Иркутск, мкр. Солнечный")).toBe("Солнечный");
  });

  it("falls back", () => {
    expect(inferDistrictFromAddress("", "Кировский")).toBe("Кировский");
  });
});
