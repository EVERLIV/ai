import { describe, expect, test } from "vitest";
import { getListingAgentDisplay } from "./propertySidebar";

describe("getListingAgentDisplay", () => {
  test("returns null when there is no agent and no owner", () => {
    expect(getListingAgentDisplay(null)).toBeNull();
    expect(getListingAgentDisplay({})).toBeNull();
    expect(
      getListingAgentDisplay({ agent_name: "", agent_company: "" }),
    ).toBeNull();
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
      isDeveloper: false,
      isVerified: true,
      managerId: null,
      agencyId: null,
      developerId: null,
    });
  });

  test("exposes agency and manager ids for public links", () => {
    const agent = getListingAgentDisplay({
      agent_name: "Анастасия Романова",
      agent_company: "АрендаСити",
      agency_id: "a0000000-0000-4000-8000-000000000001",
      listing_manager_id: "a0000000-0000-4000-8000-000000000002",
      agent_account_type: "agency",
    });
    expect(agent).toMatchObject({
      agencyId: "a0000000-0000-4000-8000-000000000001",
      managerId: "a0000000-0000-4000-8000-000000000002",
      isDeveloper: false,
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
    expect(agent).toMatchObject({
      primaryLabel: "Иван Петров",
      isRealtor: false,
      isAgency: false,
      isDeveloper: false,
    });
  });

  test("shows developer company brand, not personal owner", () => {
    const agent = getListingAgentDisplay({
      agent_name: "БайкалСтройИнвест",
      agent_company: "БайкалСтройИнвест",
      agent_account_type: "developer",
      developer_id: "d0000000-0000-4000-8000-000000000001",
      agent_avatar_url: "https://example.com/logo.png",
      agent_verified: true,
    });
    expect(agent).toMatchObject({
      primaryLabel: "БайкалСтройИнвест",
      secondaryLabel: "Застройщик",
      isDeveloper: true,
      isAgency: false,
      isRealtor: false,
      developerId: "d0000000-0000-4000-8000-000000000001",
      avatarUrl: "https://example.com/logo.png",
      isVerified: true,
    });
  });
});
