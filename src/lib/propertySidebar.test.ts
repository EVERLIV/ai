import { describe, test, expect } from "vitest";
import { getListingAgentDisplay } from "./propertySidebar";

describe("getListingAgentDisplay", () => {
  test("returns null when there is no agent and no owner", () => {
    expect(getListingAgentDisplay(null)).toBeNull();
    expect(getListingAgentDisplay({})).toBeNull();
    expect(getListingAgentDisplay({ agent_name: "", agent_company: "" })).toBeNull();
  });

  test("shows an imported agency listing as a realtor card", () => {
    // Arrange — реальная форма extras у объектов агентства:
    // компания указана, agent_account_type отсутствует.
    const extras = {
      agent_name: "Анастасия Романова",
      agent_company: "АРЕНДА СИТИ",
      agent_verified: true,
      agent_objects_count: 47,
    };

    // Act
    const agent = getListingAgentDisplay(extras);

    // Assert
    expect(agent).toMatchObject({
      primaryLabel: "АРЕНДА СИТИ",
      secondaryLabel: "Анастасия Романова",
      isRealtor: true,
      isAgency: true,
      isVerified: true,
    });
  });

  test("keeps an owner listing labelled as owner", () => {
    // Arrange
    const extras = {
      agent_name: "Иван Петров",
      owner_user_id: "user-1",
      agent_account_type: "owner",
    };

    // Act
    const agent = getListingAgentDisplay(extras);

    // Assert
    expect(agent).toMatchObject({ primaryLabel: "Иван Петров", isRealtor: false, isAgency: false });
  });
});
