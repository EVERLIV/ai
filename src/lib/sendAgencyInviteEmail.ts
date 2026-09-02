import { getEdgeFunctionUrl } from "@/lib/edgeFunctions";

export type AgencyInviteEmailPayload = {
  to: string;
  agencyName: string;
  roleLabel: string;
  inviteUrl: string;
  invitedByName?: string | null;
  expiresAt?: string | null;
};

const INVITE_URL = getEdgeFunctionUrl(
  "send-agency-invite",
  "VITE_SEND_AGENCY_INVITE_URL",
);

const NOTIFY_SECRET = import.meta.env.VITE_NOTIFY_EMAIL_SECRET as
  | string
  | undefined;

export type SendAgencyInviteResult =
  | { ok: true }
  | { ok: false; error: string };

/** Отправка письма-приглашения в агентство через noreply (тот же SMTP, что у property-email). */
export async function sendAgencyInviteEmail(
  payload: AgencyInviteEmailPayload,
): Promise<SendAgencyInviteResult> {
  if (!payload.to?.trim() || !payload.inviteUrl?.trim()) {
    return { ok: false, error: "Нет email или ссылки приглашения" };
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (NOTIFY_SECRET) headers["x-notify-secret"] = NOTIFY_SECRET;

  try {
    const res = await fetch(INVITE_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        to: payload.to.trim().toLowerCase(),
        agencyName: payload.agencyName,
        roleLabel: payload.roleLabel,
        inviteUrl: payload.inviteUrl,
        invitedByName: payload.invitedByName || null,
        expiresAt: payload.expiresAt || null,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      let msg = `HTTP ${res.status}`;
      try {
        const j = JSON.parse(text) as { error?: string };
        if (j.error) msg = j.error;
      } catch {
        if (text) msg = text.slice(0, 200);
      }
      return { ok: false, error: msg };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Ошибка отправки",
    };
  }
}

export function buildAgencyInviteLink(
  token: string,
  origin = typeof window !== "undefined"
    ? window.location.origin
    : "https://dadatut.ru",
) {
  return `${origin}/auth?tab=register&invite=${encodeURIComponent(token)}`;
}
