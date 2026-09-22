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
  templateKey?: string;
  createdBy?: string | null;
};

export const NEWSLETTER_TEMPLATES = [
  {
    key: "partner_kp",
    label: "Презентация",
  },
  {
    key: "partner_custom",
    label: "Своя кнопка",
  },
] as const;

export type NewsletterTemplateKey =
  (typeof NEWSLETTER_TEMPLATES)[number]["key"];

const SEND_URL = getEdgeFunctionUrl(
  "send-newsletter",
  "VITE_SEND_NEWSLETTER_URL",
);
const UNSUB_URL = getEdgeFunctionUrl(
  "newsletter-unsubscribe",
  "VITE_NEWSLETTER_UNSUBSCRIBE_URL",
);
const SUBSCRIBE_URL = getEdgeFunctionUrl(
  "newsletter-subscribe",
  "VITE_NEWSLETTER_SUBSCRIBE_URL",
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

/** Put opt-in list into pending queue (cron drains when enabled). */
export async function enqueueNewsletterCampaign(payload: NewsletterPayload) {
  return postSend({ mode: "enqueue", ...payload });
}

/** Legacy sync send — prefer enqueue for large lists. */
export async function sendNewsletterCampaign(payload: NewsletterPayload) {
  return postSend({ mode: "campaign", ...payload });
}

export async function processNewsletterQueue(limit?: number) {
  return postSend({
    mode: "process_queue",
    ...(limit ? { limit } : {}),
  });
}

export async function getNewsletterQueueStatus() {
  return postSend({ mode: "queue_status" }) as Promise<{
    ok?: boolean;
    pending?: number;
    processing?: number;
    sendingEnabled?: boolean;
    batchSize?: number;
  }>;
}

export async function getNewsletterSettings() {
  return postSend({ mode: "settings_get" }) as Promise<{
    ok?: boolean;
    sendingEnabled?: boolean;
    batchSize?: number;
    updatedAt?: string | null;
  }>;
}

export async function setNewsletterSettings(opts: {
  sendingEnabled: boolean;
  batchSize?: number;
}) {
  return postSend({
    mode: "settings_set",
    sendingEnabled: opts.sendingEnabled,
    batchSize: opts.batchSize,
  }) as Promise<{
    ok?: boolean;
    sendingEnabled?: boolean;
    batchSize?: number;
  }>;
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

async function postSubscribe(body: Record<string, unknown>) {
  const res = await fetch(SUBSCRIBE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      typeof data?.error === "string" ? data.error : `HTTP ${res.status}`,
    );
  }
  return data;
}

/**
 * Заявка на подписку. Подписчик становится активным только после перехода
 * по ссылке из письма, поэтому ответ всегда pending.
 */
export async function subscribeNewsletter(opts: {
  email: string;
  fullName?: string;
  source?: string;
}) {
  return (await postSubscribe({
    email: opts.email,
    fullName: opts.fullName ?? "",
    source: opts.source ?? "site",
  })) as { ok?: boolean; pending?: boolean; mailed?: boolean };
}

/** Подтверждение подписки по токену из письма */
export async function confirmNewsletterSubscription(token: string) {
  return (await postSubscribe({ mode: "confirm", token })) as {
    ok?: boolean;
    confirmed?: boolean;
  };
}
