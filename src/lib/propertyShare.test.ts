import { describe, expect, test } from "vitest";
import { SHARE_CTA, buildPropertySharePayload } from "./propertyShare";

describe("buildPropertySharePayload", () => {
  test("builds SEO text with message, url and CTA separately", () => {
    const payload = buildPropertySharePayload({
      id: "abc-123",
      type: "Земля",
      area: 58,
      district: "Байкальск",
      deal_type: "Продажа",
      price: 250000,
      description: "Продаётся земельный участок площадью 58 м² под гараж.",
      cover_photo: "https://cdn.example.com/land.jpg",
      extras: { land_use: "Гаражи" },
    });

    expect(payload.title).toBe("Земля · Гаражи · 58 м² · Байкальск");
    expect(payload.message).toContain("Земля · Гаражи · 58 м² · Байкальск");
    expect(payload.message).not.toContain("https://");
    expect(payload.text).toMatch(/250\s000 ₽/);
    expect(payload.text).toContain("/property/abc-123");
    expect(payload.text).toContain(SHARE_CTA);
    expect(payload.text).toContain("/catalog");
    expect(payload.imageUrl).toBe("https://cdn.example.com/land.jpg");
  });
});
