import type { Developer } from "@/lib/developerTypes";

/** Extras для карточки продавца на объявлении застройщика */
export function buildDeveloperListingExtras(
  developer: Pick<
    Developer,
    | "id"
    | "name"
    | "logo_url"
    | "about"
    | "phone"
    | "verification_status"
  >,
  options?: {
    ownerUserId?: string | null;
    objectsCount?: number;
  },
): Record<string, unknown> {
  const name = developer.name?.trim() || "Застройщик";
  return {
    agent_account_type: "developer",
    developer_id: developer.id,
    agent_company: name,
    agent_name: name,
    agent_avatar_url: developer.logo_url?.trim() || "",
    agent_agency_about: developer.about?.trim() || "",
    agent_phone: developer.phone?.trim() || "",
    agent_verified: developer.verification_status === "verified",
    agent_objects_count: options?.objectsCount ?? 0,
    owner_user_id: options?.ownerUserId?.trim() || "",
  };
}
