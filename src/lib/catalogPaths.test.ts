import { describe, expect, it } from "vitest";
import {
  buildCatalogPath,
  legacyCatalogRedirect,
  parseCatalogPath,
} from "@/lib/catalogPaths";
import { filterSchemaHas } from "@/config/catalogTaxonomy";

describe("parseCatalogPath", () => {
  it("parses deal + category", () => {
    const p = parseCatalogPath("/kupit/kvartiry");
    expect(p).toMatchObject({
      dealSlug: "kupit",
      dealValue: "Продажа",
      categoryId: "kvartiry",
      segment: "residential",
      marketPreset: null,
    });
    expect(p?.types).toEqual(["Квартира", "Апартаменты"]);
  });

  it("parses commercial subtype", () => {
    const p = parseCatalogPath("/snyat/kommercheskaya/ofisy");
    expect(p?.subtypeSlug).toBe("ofisy");
    expect(p?.types).toEqual(["Офис"]);
  });

  it("rejects posutochno + commercial", () => {
    expect(parseCatalogPath("/posutochno/kommercheskaya")).toBeNull();
  });

  it("rejects unknown category", () => {
    expect(parseCatalogPath("/kupit/unknown")).toBeNull();
  });

  it("applies market preset for nested category", () => {
    const p = parseCatalogPath("/kupit/kvartiry/novostroyki");
    expect(p?.marketPreset).toBe("Новостройка");
    expect(p?.categoryId).toBe("novostroyki");
  });

  it("returns null for old /kupit/novostroyki (now a redirect)", () => {
    expect(parseCatalogPath("/kupit/novostroyki")).toBeNull();
  });
});

describe("buildCatalogPath", () => {
  it("builds clean path without duplicating deal/types", () => {
    expect(
      buildCatalogPath({
        deal: "Продажа",
        category: "kommercheskaya",
        subtype: "ofisy",
      }),
    ).toBe("/kupit/kommercheskaya/ofisy");
  });

  it("puts soft filters in query", () => {
    const url = buildCatalogPath({
      deal: "snyat",
      category: "kvartiry",
      filters: { rooms: ["1", "2"], priceMax: 5_000_000 },
    });
    expect(url.startsWith("/snyat/kvartiry?")).toBe(true);
    expect(url).toContain("rooms=1%2C2");
    expect(url).toContain("priceMax=5000000");
    expect(url).not.toContain("deal=");
    expect(url).not.toContain("types=");
  });
});

describe("legacyCatalogRedirect", () => {
  it("redirects /catalog to commercial rent", () => {
    expect(legacyCatalogRedirect("/catalog")).toBe("/snyat/kommercheskaya");
  });

  it("redirects offices vanity", () => {
    expect(legacyCatalogRedirect("/offices")).toBe(
      "/snyat/kommercheskaya/ofisy",
    );
  });

  it("maps deal+types query", () => {
    expect(
      legacyCatalogRedirect("/catalog", "deal=Продажа&types=Офис"),
    ).toBe("/kupit/kommercheskaya/ofisy");
  });

  it("redirects residential apartments", () => {
    expect(legacyCatalogRedirect("/zhilaya/kvartiry")).toBe("/snyat/kvartiry");
  });

  it("redirects land catalog", () => {
    expect(legacyCatalogRedirect("/zemlya/catalog")).toBe("/snyat/zemlya");
  });

  it("preserves soft query filters", () => {
    const to = legacyCatalogRedirect(
      "/zhilaya/catalog",
      "deal=Продажа&types=Квартира&rooms=1,2",
    );
    expect(to).toBe("/kupit/kvartiry?rooms=1%2C2");
  });
});

describe("filterSchemaHas", () => {
  it("hides rooms on houses and land", () => {
    expect(filterSchemaHas("doma", "rooms")).toBe(false);
    expect(filterSchemaHas("zemlya", "rooms")).toBe(false);
    expect(filterSchemaHas("kvartiry", "rooms")).toBe(true);
  });

  it("shows objectTypes only for commercial", () => {
    expect(filterSchemaHas("kommercheskaya", "objectTypes")).toBe(true);
    expect(filterSchemaHas("kvartiry", "objectTypes")).toBe(false);
  });
});
