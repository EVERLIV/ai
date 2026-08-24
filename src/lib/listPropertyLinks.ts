import type { PropertySegment } from "@/config/propertySegments";
import type { RequestType } from "@/lib/propertyModeration";

export type ListPropertyMode = "rent" | "management";

export function listPropertyPath(
  segment: PropertySegment,
  mode?: ListPropertyMode,
): string {
  const base =
    segment === "residential" ? "/zhilaya/list-property" : "/list-property";
  return mode ? `${base}?mode=${mode}` : base;
}

export function modeToRequestType(mode: ListPropertyMode): RequestType {
  return mode === "rent" ? "free_listing" : "management";
}

export function accountPropertiesPath(
  segment: PropertySegment,
  requestType: RequestType,
): string {
  const params = new URLSearchParams();
  if (segment === "residential") params.set("segment", "residential");
  params.set("request_type", requestType);
  return `/account?${params.toString()}#properties`;
}

/** Гость: регистрация с возвратом в кабинет и авто-открытием визарда */
export function registerToAddPropertyPath(
  segment: PropertySegment,
  requestType: RequestType,
): string {
  return `/auth?tab=register&redirect=${encodeURIComponent(accountPropertiesPath(segment, requestType))}`;
}

/** Уже есть аккаунт: вход с тем же redirect */
export function loginToAddPropertyPath(
  segment: PropertySegment,
  requestType: RequestType,
): string {
  return `/auth?redirect=${encodeURIComponent(accountPropertiesPath(segment, requestType))}`;
}

export function placementCtaPath(
  segment: PropertySegment,
  mode: ListPropertyMode,
  isLoggedIn: boolean,
): string {
  const requestType = modeToRequestType(mode);
  return isLoggedIn
    ? accountPropertiesPath(segment, requestType)
    : registerToAddPropertyPath(segment, requestType);
}
