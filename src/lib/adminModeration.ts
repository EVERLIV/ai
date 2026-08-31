import {
  SERVICE_ROLE_KEY,
  SUPABASE_URL,
} from "@/integrations/supabase/adminClient";
import { getEdgeFunctionUrl } from "@/lib/edgeFunctions";

const adminHeaders = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
};

function parseAdminError(data: unknown, res: Response): string {
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (typeof o.message === "string") return o.message;
    if (typeof o.hint === "string") return o.hint;
  }
  return `HTTP ${res.status}`;
}

/** Service role — обходит RLS для админ-очереди модерации */
export async function fetchModerationQueue() {
  const select = encodeURIComponent(
    "*,submitter:profiles!properties_submitted_by_fkey(id,full_name,email,phone,avatar_url,account_type,agency_name,agency_about,agency_staff_count,verification_status)",
  );

  let res = await fetch(
    `${SUPABASE_URL}/rest/v1/properties?select=${select}&moderation_status=eq.on_moderation&order=created_at.asc`,
    { headers: adminHeaders },
  );
  let data = await res.json();

  // Fallback без полей верификации (если миграция profiles ещё не применена)
  if (!res.ok) {
    const basicSelect = encodeURIComponent(
      "*,submitter:profiles!properties_submitted_by_fkey(id,full_name,email,phone,avatar_url)",
    );
    res = await fetch(
      `${SUPABASE_URL}/rest/v1/properties?select=${basicSelect}&moderation_status=eq.on_moderation&order=created_at.asc`,
      { headers: adminHeaders },
    );
    data = await res.json();
  }

  if (!res.ok) throw new Error(parseAdminError(data, res));
  return Array.isArray(data) ? data : [];
}

export async function adminUpdateProperty(
  id: string,
  payload: Record<string, unknown>,
) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/properties?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...adminHeaders, Prefer: "return=minimal" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(parseAdminError(data, res));
  }
}

export async function adminInsertCrmLead(payload: Record<string, unknown>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/crm_leads`, {
    method: "POST",
    headers: { ...adminHeaders, Prefer: "return=representation" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(parseAdminError(data, res));
  }

  const row = Array.isArray(data) ? data[0] : data;
  const notifyUrl = getEdgeFunctionUrl("notify-lead", "VITE_NOTIFY_LEAD_URL");
  try {
    await fetch(notifyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(row || payload),
    });
  } catch {
    // best-effort
  }
}

export async function fetchClientProfiles() {
  const select = encodeURIComponent("*");
  let res = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?select=${select}&account_type=in.(owner,realtor,agency)&order=created_at.desc`,
    { headers: adminHeaders },
  );
  let data = await res.json();

  if (!res.ok) {
    res = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?select=${select}&order=created_at.desc`,
      { headers: adminHeaders },
    );
    data = await res.json();
  }

  if (!res.ok) throw new Error(parseAdminError(data, res));
  return Array.isArray(data) ? data : [];
}

export async function adminUpdateProfile(
  id: string,
  payload: Record<string, unknown>,
) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${id}`, {
    method: "PATCH",
    headers: { ...adminHeaders, Prefer: "return=minimal" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(parseAdminError(data, res));
  }
}

export async function fetchPropertyCountsBySubmitter(): Promise<
  Record<string, number>
> {
  const select = encodeURIComponent("submitted_by");
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/properties?select=${select}&submitted_by=not.is.null`,
    { headers: adminHeaders },
  );
  const data = await res.json();
  if (!res.ok || !Array.isArray(data)) return {};

  const counts: Record<string, number> = {};
  for (const row of data as { submitted_by: string | null }[]) {
    if (row.submitted_by) {
      counts[row.submitted_by] = (counts[row.submitted_by] || 0) + 1;
    }
  }
  return counts;
}

export interface OwnerListingCardData {
  full_name: string;
  avatar_url: string | null;
  account_type: "owner" | "realtor" | "agency";
  agency_name: string | null;
  agency_about: string | null;
  agency_staff_count: number | null;
  verification_status: string;
  published_objects_count: number;
}

/** Актуальные данные собственника/агентства для карточки на объекте */
export async function fetchOwnerListingCard(
  userId: string,
): Promise<OwnerListingCardData | null> {
  const profileSelect = encodeURIComponent(
    "full_name,avatar_url,account_type,agency_name,agency_about,agency_staff_count,verification_status",
  );
  const profileRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=${profileSelect}`,
    { headers: adminHeaders },
  );
  const profiles = await profileRes.json();
  if (!profileRes.ok || !Array.isArray(profiles) || !profiles[0]) return null;

  const p = profiles[0] as Record<string, unknown>;

  const countSelect = encodeURIComponent("id");
  const countRes = await fetch(
    `${SUPABASE_URL}/rest/v1/properties?submitted_by=eq.${userId}&moderation_status=eq.published&is_active=eq.true&select=${countSelect}`,
    { headers: adminHeaders },
  );
  const props = await countRes.json();
  const publishedCount = Array.isArray(props) ? props.length : 0;

  const rawType = String(p.account_type || "owner");
  const account_type =
    rawType === "agency" || rawType === "realtor"
      ? (rawType as "agency" | "realtor")
      : "owner";

  return {
    full_name: String(p.full_name || ""),
    avatar_url: (p.avatar_url as string | null) ?? null,
    account_type,
    agency_name: (p.agency_name as string | null) ?? null,
    agency_about: (p.agency_about as string | null) ?? null,
    agency_staff_count:
      typeof p.agency_staff_count === "number" ? p.agency_staff_count : null,
    verification_status: String(p.verification_status || "unverified"),
    published_objects_count: publishedCount,
  };
}

export async function countPublishedBySubmitter(
  userId: string,
): Promise<number> {
  const select = encodeURIComponent("id");
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/properties?submitted_by=eq.${userId}&moderation_status=eq.published&is_active=eq.true&select=${select}`,
    { headers: adminHeaders },
  );
  const data = await res.json();
  return Array.isArray(data) ? data.length : 0;
}

export type PendingAgencyReview = {
  id: string;
  agency_id: string;
  manager_id: string | null;
  author_name: string;
  author_email: string | null;
  user_id: string | null;
  rating: number;
  body: string;
  status: string;
  created_at: string;
  agencies?: { id: string; name: string } | { id: string; name: string }[] | null;
  agency_managers?:
    | { id: string; full_name: string }
    | { id: string; full_name: string }[]
    | null;
};

export async function fetchPendingAgencyReviewsApi(): Promise<
  PendingAgencyReview[]
> {
  const select = encodeURIComponent(
    "*,agencies(id,name),agency_managers(id,full_name)",
  );
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/agency_reviews?status=eq.pending&select=${select}&order=created_at.asc`,
    { headers: adminHeaders },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(parseAdminError(data, res));
  return Array.isArray(data) ? data : [];
}

export async function adminUpdateAgencyReviewStatus(
  id: string,
  status: "published" | "rejected",
) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/agency_reviews?id=eq.${id}`,
    {
      method: "PATCH",
      headers: { ...adminHeaders, Prefer: "return=minimal" },
      body: JSON.stringify({ status, updated_at: new Date().toISOString() }),
    },
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(parseAdminError(data, res));
  }
}
