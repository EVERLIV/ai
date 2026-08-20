import { describe, expect, test } from "vitest";
import {
  buildPropertyDisplayTitle,
  formatPropertyAddressShort,
  getPropertyDistrictLabel,
} from "./propertyCard";

describe("buildPropertyDisplayTitle", () => {
  test("builds a land parcel title from characteristics", () => {
    const title = buildPropertyDisplayTitle({
      type: "Земля",
      area: 58,
      district: "",
      address:
        "Российская Федерация, Иркутская область, Слюдянский муниципальный район, г. Байкальск, мкр. Южный, кв-л 2, з/у № 15 «З»",
      extras: { land_use: "Гаражи" },
    });

    expect(title).toBe("Земля · Гаражи · 58 м² · Байкальск");
  });

  test("uses purpose and district for commercial premises", () => {
    const title = buildPropertyDisplayTitle({
      type: "Торговая",
      area: 120,
      district: "Ангарск",
      extras: { purpose: "Павильон" },
    });

    expect(title).toBe("Торговая · Павильон · 120 м² · Ангарск");
  });

  test("builds a residential title with room count", () => {
    const title = buildPropertyDisplayTitle({
      segment: "residential",
      type: "Квартира",
      area: 54,
      district: "Кировский",
      extras: { rooms: "2" },
    });

    expect(title).toBe("Квартира · 2 комн · 54 м² · Кировский");
  });
});

describe("formatPropertyAddressShort", () => {
  test("removes federal and regional prefixes", () => {
    expect(
      formatPropertyAddressShort(
        "Российская Федерация, Иркутская область, г. Байкальск, мкр. Южный, кв-л 2",
      ),
    ).toBe("г. Байкальск, мкр. Южный, кв-л 2");
  });
});

describe("getPropertyDistrictLabel", () => {
  test("prefers district field over parsed city", () => {
    expect(
      getPropertyDistrictLabel({
        district: "Ангарск",
        address: "г. Иркутск, ул. Ленина, 1",
      }),
    ).toBe("Ангарск");
  });
});
