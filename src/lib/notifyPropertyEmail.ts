import { getEdgeFunctionUrl } from "@/lib/edgeFunctions";

export type PropertyEmailEvent =
  | "submitted"
  | "approved"
  | "subscription_match";

export type PropertyEmailPayload = {
  event: PropertyEmailEvent;
  to?: string | null;
  name?: string | null;
  property: {
    id?: string | null;
    public_id?: string | null;
    address?: string | null;
    district?: string | null;
    type?: string | null;
    deal_type?: string | null;
    area?: number | string | null;
    price?: number | string | null;
    floor?: string | number | null;
    deposit?: string | null;
    contract_term?: string | null;
    request_type?: string | null;
    description?: string | null;
  };
};

const NOTIFY_URL = getEdgeFunctionUrl(
  "notify-property-email",
  "VITE_NOTIFY_PROPERTY_EMAIL_URL",
);

const NOTIFY_SECRET = import.meta.env.VITE_NOTIFY_EMAIL_SECRET as
  | string
  | undefined;

/** Best-effort: ошибка письма не должна ломать сохранение объекта. */
export async function notifyPropertyEmail(
  payload: PropertyEmailPayload,
): Promise<void> {
  if (!payload.to?.trim()) return;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (NOTIFY_SECRET) headers["x-notify-secret"] = NOTIFY_SECRET;

  try {
    const res = await fetch(NOTIFY_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn("notify-property-email failed", res.status, text);
    }
  } catch (e) {
    console.warn("notify-property-email failed", e);
  }
}
