/** Self-hosted API — все edge-функции на VDS api.arendacity.com */
export const DEFAULT_API_BASE = "https://api.arendacity.com";

export function getApiBase(): string {
  return import.meta.env.VITE_SUPABASE_URL?.trim().replace(/\/$/, "") || DEFAULT_API_BASE;
}

/** URL edge-функции: env override → VITE_SUPABASE_URL → api.arendacity.com */
export function getEdgeFunctionUrl(
  name: string,
  envKey?: string,
): string {
  if (envKey) {
    const explicit = import.meta.env[envKey]?.trim();
    if (explicit) return explicit;
  }
  return `${getApiBase()}/functions/v1/${name}`;
}
