export type ModerationStatus = "draft" | "on_moderation" | "published" | "rejected" | "cancelled" | "archived";
export type RequestType = "free_listing" | "management";

export const MODERATION_STATUS_LABELS: Record<ModerationStatus, string> = {
  draft: "Черновик",
  on_moderation: "На модерации",
  published: "Опубликован",
  rejected: "Отклонён",
  cancelled: "Отменён",
  archived: "В архиве",
};

export const EDITABLE_STATUSES: ModerationStatus[] = ["draft", "on_moderation", "rejected"];
export const CANCELLABLE_STATUSES: ModerationStatus[] = ["draft", "on_moderation", "rejected"];

export function canEditProperty(status?: ModerationStatus | null): boolean {
  return !!status && EDITABLE_STATUSES.includes(status);
}

export function canCancelProperty(status?: ModerationStatus | null): boolean {
  return !!status && CANCELLABLE_STATUSES.includes(status);
}

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
    case "cancelled":
      return "outline";
    case "archived":
      return "secondary";
    default:
      return "outline";
  }
}

export function getOwnerUserId(
  extras?: Record<string, unknown> | null,
  submittedBy?: string | null,
): string | null {
  if (extras && typeof extras.owner_user_id === "string" && extras.owner_user_id) {
    return extras.owner_user_id;
  }
  if (submittedBy) return submittedBy;
  return null;
}

export function isOwnerListing(
  extras?: Record<string, unknown> | null,
  submittedBy?: string | null,
): boolean {
  return Boolean(getOwnerUserId(extras, submittedBy));
}
