/**
 * Self-hosted Storage: URL без `/object/public/` отдаёт 401 без CORS —
 * в браузере это выглядит как CORS block на `<img>`.
 */
export function toPublicStorageUrl(url: string): string {
  let next = url.trim();
  // Частый баг: /object/agency-assets/... вместо /object/public/agency-assets/...
  next = next.replace(
    /\/storage\/v1\/object\/(?!public\/|sign\/|authenticated\/)/,
    "/storage/v1/object/public/",
  );
  return next;
}

export function publicStorageUrl(
  url: string | null | undefined,
): string | null {
  if (!url?.trim()) return null;
  return toPublicStorageUrl(url);
}
