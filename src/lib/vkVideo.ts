/** Парсинг ссылок VK Video → embed URL */

export type VkVideoParsed = {
  oid: string;
  id: string;
  hash?: string;
  embedUrl: string;
  watchUrl: string;
};

/**
 * Принимает vk.com/video-123_456, video123_456, vkvideo.ru/...
 * Возвращает iframe-ready embed или null.
 */
export function parseVkVideoUrl(raw: string): VkVideoParsed | null {
  const input = raw.trim();
  if (!input) return null;

  let oid = "";
  let id = "";
  let hash: string | undefined;

  try {
    const url = new URL(
      input.startsWith("http") ? input : `https://${input.replace(/^\/\//, "")}`,
    );
    hash = url.searchParams.get("hash") || undefined;

    // /video-123_456 or /video123_456
    const pathMatch = url.pathname.match(/\/video(-?\d+)_(\d+)/i);
    if (pathMatch) {
      oid = pathMatch[1];
      id = pathMatch[2];
    }

    // ?z=video-123_456
    if (!oid) {
      const z = url.searchParams.get("z") || "";
      const zMatch = z.match(/video(-?\d+)_(\d+)/i);
      if (zMatch) {
        oid = zMatch[1];
        id = zMatch[2];
      }
    }

    // oid / id query (video_ext)
    if (!oid) {
      const qOid = url.searchParams.get("oid");
      const qId = url.searchParams.get("id");
      if (qOid && qId) {
        oid = qOid;
        id = qId;
        hash = url.searchParams.get("hash") || hash;
      }
    }
  } catch {
    // bare video-123_456
    const bare = input.match(/video(-?\d+)_(\d+)/i);
    if (bare) {
      oid = bare[1];
      id = bare[2];
    }
  }

  if (!oid || !id) return null;

  const params = new URLSearchParams({
    oid,
    id,
    hd: "2",
  });
  if (hash) params.set("hash", hash);

  const embedUrl = `https://vk.com/video_ext.php?${params.toString()}`;
  const watchUrl = `https://vk.com/video${oid}_${id}`;

  return { oid, id, hash, embedUrl, watchUrl };
}

export function isValidVkVideoUrl(raw: string): boolean {
  return parseVkVideoUrl(raw) != null;
}

export function normalizeVkVideoUrls(urls: unknown): string[] {
  if (!Array.isArray(urls)) {
    if (typeof urls === "string" && urls.trim()) {
      return isValidVkVideoUrl(urls) ? [urls.trim()] : [];
    }
    return [];
  }
  return urls
    .map((u) => String(u || "").trim())
    .filter((u) => u && isValidVkVideoUrl(u));
}
