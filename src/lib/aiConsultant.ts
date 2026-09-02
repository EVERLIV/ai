import { useQuery } from "@tanstack/react-query";
import { ДАДАТУТ_AGENCY_ID } from "@/config/defaultAgent";
import { supabasePublic } from "@/integrations/supabase/client";
import { getPropertyAgencyId } from "@/lib/listingSource";

export type AiConsultantListing = {
  id?: string;
  agency_id?: string | null;
  submitted_by?: string | null;
  extras?: Record<string, unknown> | null;
  cover_photo?: string | null;
};

export type AiConsultantAccess = {
  agencyIds: Set<string>;
  profileIds: Set<string>;
};

function extrasOf(p: AiConsultantListing): Record<string, unknown> {
  if (!p.extras || typeof p.extras !== "object" || Array.isArray(p.extras)) {
    return {};
  }
  return p.extras;
}

export function getListingOwnerUserId(
  property: AiConsultantListing,
): string | null {
  const e = extrasOf(property);
  if (typeof e.owner_user_id === "string" && e.owner_user_id.trim()) {
    return e.owner_user_id.trim();
  }
  if (typeof property.submitted_by === "string" && property.submitted_by.trim()) {
    return property.submitted_by.trim();
  }
  return null;
}

/** Есть ли у продавца объявления услуга ИИ-консультанта. */
export function listingHasAiConsultant(
  property: AiConsultantListing,
  access: AiConsultantAccess | null | undefined,
): boolean {
  if (!access) return false;
  const agencyId = getPropertyAgencyId(property);
  if (agencyId && access.agencyIds.has(agencyId)) return true;
  const ownerId = getListingOwnerUserId(property);
  if (ownerId && access.profileIds.has(ownerId)) return true;
  return false;
}

export function consultantAvatarForListing(
  property: AiConsultantListing,
  fallback: string,
): string {
  const e = extrasOf(property);
  if (typeof e.agent_avatar_url === "string" && e.agent_avatar_url.trim()) {
    return e.agent_avatar_url.trim();
  }
  const agencyId = getPropertyAgencyId(property);
  if (agencyId === ДАДАТУТ_AGENCY_ID) return fallback;
  return fallback;
}

export async function fetchAiConsultantAccess(): Promise<AiConsultantAccess> {
  const [agenciesRes, profilesRes] = await Promise.all([
    supabasePublic
      .from("agencies")
      .select("id")
      .eq("ai_consultant_enabled", true),
    supabasePublic
      .from("profiles")
      .select("id")
      .eq("ai_consultant_enabled", true),
  ]);

  // Колонка может ещё не быть на сервере — не валим каталог;
  // до миграции оставляем ДАДАТУТ как единственного с услугой.
  const agencyIds = new Set<string>();
  if (!agenciesRes.error && Array.isArray(agenciesRes.data)) {
    for (const row of agenciesRes.data) {
      if (row?.id) agencyIds.add(row.id);
    }
  } else if (agenciesRes.error) {
    agencyIds.add(ДАДАТУТ_AGENCY_ID);
  }

  const profileIds = new Set<string>();
  if (!profilesRes.error && Array.isArray(profilesRes.data)) {
    for (const row of profilesRes.data) {
      if (row?.id) profileIds.add(row.id);
    }
  }

  return { agencyIds, profileIds };
}

export function useAiConsultantAccess() {
  return useQuery({
    queryKey: ["ai-consultant-access"],
    staleTime: 60_000,
    queryFn: fetchAiConsultantAccess,
  });
}

export const OPEN_CONSULTANT_CHAT_EVENT = "open-consultant-chat";

export type OpenConsultantChatDetail = {
  propertyId?: string;
  propertyAddress?: string;
  avatarUrl?: string;
};

export function openConsultantChat(detail: OpenConsultantChatDetail = {}) {
  window.dispatchEvent(
    new CustomEvent(OPEN_CONSULTANT_CHAT_EVENT, { detail }),
  );
}
