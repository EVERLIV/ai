import { describe, expect, test } from "vitest";
import { parsePropertyDescription } from "./propertyDescription";

describe("parsePropertyDescription", () => {
  test("returns empty array for missing description", () => {
    expect(parsePropertyDescription(null)).toEqual([]);
    expect(parsePropertyDescription("")).toEqual([]);
    expect(parsePropertyDescription("   ")).toEqual([]);
  });

  test("keeps a plain description as a single paragraph", () => {
    // Arrange
    const raw =
      "Современный офис в деловом центре. Панорамные окна, качественный ремонт.";

    // Act
    const blocks = parsePropertyDescription(raw);

    // Assert
    expect(blocks).toEqual([{ kind: "paragraph", text: raw }]);
  });

  test("strips wrapping quotes added by import", () => {
    const blocks = parsePropertyDescription('"Офис в центре города."');
    expect(blocks).toEqual([
      { kind: "paragraph", text: "Офис в центре города." },
    ]);
  });

  test("detects emoji headings and separates paragraphs", () => {
    // Arrange
    const raw = [
      "🏡 Участок 5,4 сотки под ИЖС",
      "",
      "Продаётся земельный участок площадью 540 м².",
      "",
      "📍 Локация и окружение",
      "Город: Черемхово. До Иркутска — 115 км.",
    ].join("\n");

    // Act
    const blocks = parsePropertyDescription(raw);

    // Assert
    expect(blocks[0]).toEqual({
      kind: "heading",
      text: "Участок 5,4 сотки под ИЖС",
      icon: "🏡",
    });
    expect(blocks[1]).toEqual({
      kind: "paragraph",
      text: "Продаётся земельный участок площадью 540 м².",
    });
    expect(blocks[2]).toEqual({
      kind: "heading",
      text: "Локация и окружение",
      icon: "📍",
    });
  });

  test("groups checkmark bullets into a list", () => {
    // Arrange
    const raw = [
      "Преимущества",
      "✅ Низкая цена — всего 200 000 ₽",
      "✅ Асфальтированный подъезд",
      "✅ Развивающийся посёлок",
    ].join("\n");

    // Act
    const blocks = parsePropertyDescription(raw);

    // Assert
    const list = blocks.find((b) => b.kind === "list");
    expect(list).toBeDefined();
    expect(list).toMatchObject({
      kind: "list",
      items: [
        { text: "Низкая цена — всего 200 000 ₽" },
        { text: "Асфальтированный подъезд" },
        { text: "Развивающийся посёлок" },
      ],
    });
  });

  test("splits inline checkmark bullets that lost their line breaks", () => {
    // Arrange — реальный случай: импорт схлопнул переносы в один абзац
    const raw =
      "✅ Низкая цена — всего 200 000 ₽ ✅ Асфальтированный подъезд ✅ Чистый воздух";

    // Act
    const blocks = parsePropertyDescription(raw);

    // Assert
    expect(blocks).toHaveLength(1);
    expect(blocks[0]).toMatchObject({ kind: "list" });
    if (blocks[0].kind === "list") {
      expect(blocks[0].items).toHaveLength(3);
      expect(blocks[0].items[0].text).toBe("Низкая цена — всего 200 000 ₽");
    }
  });

  test("extracts label/value lines as facts", () => {
    // Arrange
    const raw = ["Цена: 200 000 ₽", "Площадь: 97 м²"].join("\n");

    // Act
    const blocks = parsePropertyDescription(raw);

    // Assert
    expect(blocks).toEqual([
      {
        kind: "facts",
        items: [
          { label: "Цена", value: "200 000 ₽" },
          { label: "Площадь", value: "97 м²" },
        ],
      },
    ]);
  });

  test("treats a long sentence containing a colon as a paragraph, not a fact", () => {
    // Arrange
    const raw =
      "Инфраструктура рядом: магазины, аптеки, детский сад, школа, медпункт — всё в шаговой доступности.";

    // Act
    const blocks = parsePropertyDescription(raw);

    // Assert
    expect(blocks).toEqual([{ kind: "paragraph", text: raw }]);
  });

  test("treats an emoji-prefixed short line with a dash as a list item", () => {
    // Arrange
    const raw = [
      "Идеально подходит для",
      "🏡 Строительства небольшого дома — 5,4 соток, центр города",
      "🏠 Прописки — официальный статус ИЖС",
    ].join("\n");

    // Act
    const blocks = parsePropertyDescription(raw);

    // Assert
    expect(blocks[0]).toMatchObject({
      kind: "heading",
      text: "Идеально подходит для",
    });
    expect(blocks[1]).toMatchObject({ kind: "list" });
    if (blocks[1].kind === "list") expect(blocks[1].items).toHaveLength(2);
  });

  test("keeps a long emoji-prefixed prose sentence as a paragraph", () => {
    // Arrange — не должно превращаться в список из одного пункта
    const raw =
      "🚗 Транспорт: ж/д вокзал Черемхово — пригородные поезда, автобусы. Трасса М-53 до Иркутска — 115 км.";

    // Act
    const blocks = parsePropertyDescription(raw);

    // Assert
    expect(blocks).toHaveLength(1);
    expect(blocks[0].kind).toBe("paragraph");
  });

  test("promotes a leading emoji title with pipe separators to a heading", () => {
    // Arrange
    const raw =
      "🏡 Участок 5,4 сотки под ИЖС | ул. Строительная, 19А, г. Черемхово\n\nПродаётся участок.";

    // Act
    const blocks = parsePropertyDescription(raw);

    // Assert
    expect(blocks[0]).toEqual({
      kind: "heading",
      text: "Участок 5,4 сотки под ИЖС",
      icon: "🏡",
    });
    expect(blocks[1]).toMatchObject({
      kind: "paragraph",
      text: "ул. Строительная, 19А, г. Черемхово",
    });
  });

  test("strips an unbalanced leading quote left by import", () => {
    const blocks = parsePropertyDescription(
      '"🏭 Участок 28 соток\n\nПродаётся участок.',
    );
    expect(blocks[0]).toMatchObject({ kind: "heading", icon: "🏭" });
  });

  test("does not treat a sentence ending in a period as a heading", () => {
    const blocks = parsePropertyDescription(
      "🚗 Транспорт до города занимает около часа.",
    );
    expect(blocks[0].kind).toBe("paragraph");
  });
});
