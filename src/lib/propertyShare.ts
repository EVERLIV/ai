import { COMPANY } from "@/config/company";
import { SITE_URL, absoluteUrl } from "@/config/site";
import {
  buildPropertyDisplayTitle,
  formatPropertyAddressShort,
  formatPropertyPrice,
  type PropertyTitleInput,
} from "@/lib/propertyCard";

export const SHARE_CTA = `Больше объектов на ${COMPANY.brand}`;

export type PropertyShareInput = PropertyTitleInput & {
  id?: string | null;
  deal_type?: string | null;
  price?: number | null;
  description?: string | null;
  cover_photo?: string | null;
  photos?: string[] | null;
};

export type PropertySharePayload = {
  title: string;
  /** Текст без URL — для Telegram и og:description */
  message: string;
  /** Полный текст со ссылкой и CTA — для WhatsApp и копирования */
  text: string;
  url: string;
  imageUrl: string | null;
  catalogUrl: string;
  cta: string;
};

function firstImage(property: PropertyShareInput): string | null {
  const photo = property.photos?.find((url) => typeof url === "string" && url.trim()) || property.cover_photo;
  return photo?.trim() ? absoluteUrl(photo.trim()) : null;
}

function shareDescription(description?: string | null): string {
  return (description || "").replace(/\s+/g, " ").trim().slice(0, 220);
}

function buildShareMessage(property: PropertyShareInput): string {
  const title = buildPropertyDisplayTitle(property);
  const price = formatPropertyPrice(property);
  const address = formatPropertyAddressShort(property.address);
  const description = shareDescription(property.description);

  return [title, price, address, description].filter(Boolean).join("\n");
}

/** SEO/OG описание карточки объекта */
export function buildPropertyShareOgDescription(property: PropertyShareInput): string {
  const message = buildShareMessage(property);
  const catalogUrl = absoluteUrl("/catalog");
  const full = `${message}\n\n${SHARE_CTA} → ${catalogUrl}`;
  return full.slice(0, 300);
}

export function buildPropertySharePayload(
  property: PropertyShareInput,
  pageUrl?: string,
): PropertySharePayload {
  const title = buildPropertyDisplayTitle(property);
  const message = buildShareMessage(property);
  const url = pageUrl || (property.id ? absoluteUrl(`/property/${property.id}`) : SITE_URL);
  const catalogUrl = absoluteUrl("/catalog");

  const text = [message, url, `${SHARE_CTA} → ${catalogUrl}`].filter(Boolean).join("\n\n");

  return {
    title,
    message,
    text,
    url,
    imageUrl: firstImage(property),
    catalogUrl,
    cta: SHARE_CTA,
  };
}

export function canUseNativeShare(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

/** Нативный шаринг: только текст + URL. Картинку подтягивает Open Graph по ссылке. */
export async function sharePropertyNative(payload: PropertySharePayload): Promise<"shared" | "cancelled"> {
  if (!canUseNativeShare()) {
    throw new Error("Native share unavailable");
  }

  try {
    await navigator.share({
      title: payload.title,
      text: `${payload.message}\n\n${payload.cta} → ${payload.catalogUrl}`,
      url: payload.url,
    });
    return "shared";
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
    throw error;
  }
}

export async function copyPropertyShareText(payload: PropertySharePayload): Promise<void> {
  if (!navigator.clipboard?.writeText) {
    throw new Error("Clipboard unavailable");
  }
  await navigator.clipboard.writeText(payload.text);
}

export function telegramShareUrl(payload: PropertySharePayload): string {
  const params = new URLSearchParams({
    url: payload.url,
    text: `${payload.message}\n\n${payload.cta} → ${payload.catalogUrl}`,
  });
  return `https://t.me/share/url?${params.toString()}`;
}

export function whatsappShareUrl(payload: PropertySharePayload): string {
  return `https://wa.me/?text=${encodeURIComponent(payload.text)}`;
}

export function vkShareUrl(payload: PropertySharePayload): string {
  const params = new URLSearchParams({
    url: payload.url,
    title: payload.title,
    description: `${payload.message}\n\n${payload.cta} → ${payload.catalogUrl}`,
  });
  if (payload.imageUrl) params.set("image", payload.imageUrl);
  return `https://vk.com/share.php?${params.toString()}`;
}

export function mailShareUrl(payload: PropertySharePayload): string {
  const params = new URLSearchParams({
    subject: payload.title,
    body: payload.text,
  });
  return `mailto:?${params.toString()}`;
}
