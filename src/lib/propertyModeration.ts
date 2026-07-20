export type ModerationStatus = "draft" | "on_moderation" | "published" | "rejected";
export type RequestType = "free_listing" | "management";

export const MODERATION_STATUS_LABELS: Record<ModerationStatus, string> = {
  draft: "Черновик",
  on_moderation: "На модерации",
  published: "Опубликован",
  rejected: "Отклонён",
};

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  free_listing: "Бесплатное размещение",
  management: "Передать в управление",
};

export const REQUEST_TYPE_SHORT: Record<RequestType, string> = {
  free_listing: "Free Listing",
  management: "Management Request",
};

export function getModerationBadgeVariant(
  status: ModerationStatus,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "on_moderation":
      return "secondary";
    case "published":
      return "default";
    case "rejected":
      return "destructive";
    default:
      return "outline";
  }
}

export function isOwnerListing(extras?: Record<string, unknown> | null): boolean {
  return Boolean(extras && typeof extras.owner_user_id === "string" && extras.owner_user_id);
}

export function getOwnerUserId(extras?: Record<string, unknown> | null): string | null {
  if (!extras || typeof extras.owner_user_id !== "string") return null;
  return extras.owner_user_id;
}
