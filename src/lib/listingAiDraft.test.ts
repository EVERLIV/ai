import { describe, expect, test } from "vitest";
import {
  applyListingDraftPatch,
  createEmptyListingForm,
  listingFormReadyForPhotos,
} from "./listingAiDraft";

describe("listingAiDraft", () => {
  test("applies patch fields onto empty form", () => {
    const form = applyListingDraftPatch(createEmptyListingForm("commercial"), {
      types: ["Офис"],
      deal_type: "Аренда",
      area: 45,
      price: 50000,
      address: "г. Иркутск, ул. Ленина, 1",
      description: "Светлый офис в центре города рядом с остановкой.",
      district: "Кировский",
    });
    expect(form.area).toBe(45);
    expect(form.types).toEqual(["Офис"]);
    expect(listingFormReadyForPhotos(form)).toBe(true);
  });

  test("switches to land segment for земля types", () => {
    const form = applyListingDraftPatch(createEmptyListingForm("commercial"), {
      types: ["Земля"],
      land_use: "ИЖС",
    });
    expect(form.segment).toBe("land");
  });
});
