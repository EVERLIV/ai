import type { PropertySegment } from "@/config/propertySegments";

export const RESIDENTIAL_EXTRAS_KEYS = {
  rooms: "rooms",
  buildingType: "building_type",
  yearBuilt: "year_built",
  balcony: "balcony",
  furniture: "furniture",
  bathroom: "bathroom",
  mortgage: "mortgage",
  petsAllowed: "pets_allowed",
  childrenAllowed: "children_allowed",
  market: "market",
  windowView: "window_view",
  livingArea: "living_area",
  kitchenArea: "kitchen_area",
} as const;

type PropertyLike = {
  segment?: PropertySegment | null;
  type?: string | null;
  extras?: Record<string, unknown> | null;
};

export function isResidentialProperty(property: PropertyLike): boolean {
  return property.segment === "residential" || property.type === "Новостройка";
}

export function getResidentialRooms(property: PropertyLike): string {
  const value = property.extras?.[RESIDENTIAL_EXTRAS_KEYS.rooms];
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string") return value.trim();
  return "";
}

export function getRoomsLabel(property: PropertyLike): string {
  const rooms = getResidentialRooms(property);
  if (!rooms) return "";
  return rooms === "Студия" ? rooms : `${rooms} комн`;
}

export function getResidentialBuildingType(property: PropertyLike): string {
  const value = property.extras?.[RESIDENTIAL_EXTRAS_KEYS.buildingType];
  return typeof value === "string" ? value.trim() : "";
}

export function getResidentialMarket(property: PropertyLike): string {
  const value = property.extras?.[RESIDENTIAL_EXTRAS_KEYS.market];
  if (typeof value === "string" && value.trim()) return value.trim();
  if (property.type === "Новостройка") return "Новостройка";
  return "";
}

export function getResidentialFurniture(property: PropertyLike): string {
  const value = property.extras?.[RESIDENTIAL_EXTRAS_KEYS.furniture];
  return typeof value === "string" ? value.trim() : "";
}

export function getResidentialBalcony(property: PropertyLike): string {
  const value = property.extras?.[RESIDENTIAL_EXTRAS_KEYS.balcony];
  return typeof value === "string" ? value.trim() : "";
}

export function getResidentialWindowView(property: PropertyLike): string {
  const value = property.extras?.[RESIDENTIAL_EXTRAS_KEYS.windowView];
  return typeof value === "string" ? value.trim() : "";
}
