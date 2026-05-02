import type { DbProperty } from "@/hooks/useProperties";

export type Coords = { lat: number; lng: number };

/**
 * Returns valid coords or null. Guards against:
 * - missing values
 * - non-numeric / NaN
 * - 0,0 (null-island default)
 * - out-of-range lat/lng
 */
export function getCoords(p: Pick<DbProperty, "lat" | "lng">): Coords | null {
  const lat = (p as any).lat;
  const lng = (p as any).lng;

  if (typeof lat !== "number" || typeof lng !== "number") return null;
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;
  if (lat === 0 && lng === 0) return null;
  if (lat < -90 || lat > 90) return null;
  if (lng < -180 || lng > 180) return null;

  return { lat, lng };
}

/**
 * Address is "real" if it contains at least one letter and is at least 4 chars.
 * Empty strings and pure punctuation are rejected.
 */
export function hasValidAddress(address: string | null | undefined): boolean {
  if (!address) return false;
  const trimmed = address.trim();
  if (trimmed.length < 4) return false;
  return /\p{L}/u.test(trimmed);
}

/**
 * Street View is shown only when both coords AND address are valid.
 */
export function hasStreetView(p: Pick<DbProperty, "lat" | "lng" | "address">): boolean {
  return getCoords(p) !== null && hasValidAddress(p.address);
}
