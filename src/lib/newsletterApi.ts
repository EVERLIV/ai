import { getEdgeFunctionUrl } from "@/lib/edgeFunctions";

export type NewsletterPayload = {
  subject: string;
  headline: string;
  headlineRed?: string;
  intro?: string;
  greetingRed?: string;
  greetingRest?: string;
  body: string;
  ctaLabel?: string;
  ctaUrl?: string;
  heroImageUrl?: string | null;
  createdBy?: string | null;
};

const SEND_URL = getEdgeFunctionUrl("send-newsletter", "VITE_SEND_NEWSLETTER_URL");
const UNSUB_URL = getEdgeFunctionUrl(
  "newsletter-unsubscribe",
  "VITE_NEWSLETTER_UNSUBSCRIBE_URL",
);

const NOTIFY_SECRET = import.meta.env.VITE_NOTIFY_EMAIL_SECRET as
  | string
  | undefined;

function authHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (NOTIFY_SECRET) headers["x-notify-secret"] = NOTIFY_SECRET;
  return headers;
}

async function postSend(body: Record<string, unknown>) {
  const res = await fetch(SEND_URL, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data?.error === "string" ? data.error : `HTTP ${res.status}`,
    );
  }
  return data as Record<string, unknown>;
}

export async function previewNewsletter(payload: NewsletterPayload) {
  return postSend({ mode: "preview", ...payload });
}

export async function sendNewsletterTest(
  payload: NewsletterPayload,
  testTo: string,
) {
  return postSend({ mode: "test", testTo, ...payload });
}

export async function sendNewsletterCampaign(payload: NewsletterPayload) {
  return postSend({ mode: "campaign", ...payload });
}

export async function unsubscribeNewsletter(token: string) {
  const res = await fetch(UNSUB_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data?.error === "string" ? data.error : `HTTP ${res.status}`,
    );
  }
  return data as { ok?: boolean; unsubscribed?: boolean };
}
