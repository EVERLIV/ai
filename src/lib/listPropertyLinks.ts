import type { PropertySegment } from "@/config/propertySegments";
import { SEGMENT_ROUTES } from "@/config/propertySegments";
import type { RequestType } from "@/lib/propertyModeration";

export type ListPropertyMode = "rent" | "management";

export function listPropertyPath(
  segment: PropertySegment,
  mode?: ListPropertyMode,
): string {
  const base = SEGMENT_ROUTES[segment].listProperty;
  // management больше не используется — всегда ведём на бесплатное размещение
  return mode ? `${base}?mode=rent` : base;
}

/** Полноэкранный ИИ-чат создания объявления */
export function listPropertyAiPath(segment: PropertySegment): string {
  return `${SEGMENT_ROUTES[segment].listProperty}/ai`;
}

export function loginToSmartListingPath(segment: PropertySegment): string {
  return `/auth?redirect=${encodeURIComponent(listPropertyAiPath(segment))}`;
}

export function modeToRequestType(_mode: ListPropertyMode): RequestType {
  return "free_listing";
}

export function accountPropertiesPath(
  segment: PropertySegment,
  requestType: RequestType,
): string {
  const params = new URLSearchParams();
  if (segment !== "commercial") params.set("segment", segment);
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
