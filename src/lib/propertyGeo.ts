import type { DbProperty } from "@/hooks/useProperties";

export type Coords = { lat: number; lng: number };

export function parseCoordInput(value: string): number | null {
  const normalized = value.trim().replace(",", ".");
  if (
    !normalized ||
    normalized === "-" ||
    normalized === "." ||
    normalized === "-."
  )
    return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

export function formatCoord(n: number | null | undefined): string {
  if (typeof n !== "number" || Number.isNaN(n)) return "";
  return String(n);
}

/** «52.2869, 104.2807» или «104.2807 52.2869» — пара для вставки в одно поле. */
export function parseCoordPair(
  value: string,
): { lat: number; lng: number } | null {
  const parts = value
    .trim()
    .replace(/;/g, ",")
    .split(/[,\s]+/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length < 2) return null;
  const a = parseCoordInput(parts[0]);
  const b = parseCoordInput(parts[1]);
  if (a === null || b === null) return null;
  if (Math.abs(a) > 90 && Math.abs(b) <= 90 && Math.abs(a) <= 180) {
    return isValidCoordPair(b, a) ? { lat: b, lng: a } : null;
  }
  return isValidCoordPair(a, b) ? { lat: a, lng: b } : null;
}

export function isValidCoordPair(
  lat: number | null,
  lng: number | null,
): lat is number {
  if (lat === null || lng === null) return false;
  if (Number.isNaN(lat) || Number.isNaN(lng)) return false;
  if (lat === 0 && lng === 0) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  return true;
}

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
export function hasStreetView(
  p: Pick<DbProperty, "lat" | "lng" | "address">,
): boolean {
  return getCoords(p) !== null && hasValidAddress(p.address);
}
