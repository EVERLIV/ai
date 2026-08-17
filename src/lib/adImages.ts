import type { AdTypeKey } from "@/lib/adTypes";

/** Заглушки типов рекламы отключены — без своего фото показывается плейсхолдер. */
export function getAdTypeImage(_type: AdTypeKey | string | null | undefined): string {
  return "";
}
