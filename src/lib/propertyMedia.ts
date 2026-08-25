import { isHouseLike } from "@/lib/propertyTypeFamilies";
import { getPropertyTypes } from "@/lib/propertyTypes";
import { normalizeVkVideoUrls } from "@/lib/vkVideo";

export const MEDIA_VIDEO_URLS_KEY = "video_urls";
export const MEDIA_PLAN_IMAGE_KEY = "plan_image_url";

export type PropertyMediaExtras = {
  videoUrls: string[];
  planImageUrl: string | null;
};

export function readPropertyMediaExtras(
  extras?: Record<string, unknown> | null,
): PropertyMediaExtras {
  const e = extras || {};
  const planRaw = e[MEDIA_PLAN_IMAGE_KEY];
  return {
    videoUrls: normalizeVkVideoUrls(e[MEDIA_VIDEO_URLS_KEY] ?? e.video_url),
    planImageUrl:
      typeof planRaw === "string" && planRaw.trim() ? planRaw.trim() : null,
  };
}

export function buildMediaExtrasPatch(input: {
  videoUrls?: string[];
  planImageUrl?: string | null;
}): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  if (input.videoUrls !== undefined) {
    const urls = normalizeVkVideoUrls(input.videoUrls);
    patch[MEDIA_VIDEO_URLS_KEY] = urls.length ? urls : undefined;
  }
  if (input.planImageUrl !== undefined) {
    const url = input.planImageUrl?.trim() || "";
    patch[MEDIA_PLAN_IMAGE_KEY] = url || undefined;
  }
  return patch;
}

/** Подпись вкладки планировки */
export function planTabLabel(property: {
  type?: string | null;
  extras?: Record<string, unknown> | null;
}): string {
  const types = getPropertyTypes(property);
  if (isHouseLike(types) || types.some((t) => /дом|дача|таунхаус/i.test(t))) {
    return "План проекта дома";
  }
  return "Планировка";
}

export type GalleryTab = "plan" | "video" | "photos";

export type GalleryMediaItem =
  | { kind: "photo"; url: string; index: number }
  | { kind: "video"; url: string; embedUrl: string; index: number }
  | { kind: "plan"; url: string; index: number };

export function resolvePlanImageUrl(opts: {
  extrasPlan?: string | null;
  unitTypePlan?: string | null;
}): string | null {
  return opts.extrasPlan?.trim() || opts.unitTypePlan?.trim() || null;
}
