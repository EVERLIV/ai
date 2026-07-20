import { SUPABASE_URL, SERVICE_ROLE_KEY } from "@/integrations/supabase/adminClient";

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

export async function adminUpdateProperty(id: string, payload: Record<string, unknown>) {
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
    headers: { ...adminHeaders, Prefer: "return=minimal" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(parseAdminError(data, res));
  }
}

export async function fetchClientProfiles() {
  const select = encodeURIComponent("*");
  let res = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?select=${select}&account_type=in.(owner,realtor)&order=created_at.desc`,
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

export async function adminUpdateProfile(id: string, payload: Record<string, unknown>) {
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

export async function fetchPropertyCountsBySubmitter(): Promise<Record<string, number>> {
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
  account_type: "owner" | "realtor";
  agency_name: string | null;
  agency_about: string | null;
  agency_staff_count: number | null;
  verification_status: string;
  published_objects_count: number;
}

/** Актуальные данные собственника/риелтора для карточки на объекте */
export async function fetchOwnerListingCard(userId: string): Promise<OwnerListingCardData | null> {
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

  return {
    full_name: String(p.full_name || ""),
    avatar_url: (p.avatar_url as string | null) ?? null,
    account_type: (p.account_type === "realtor" ? "realtor" : "owner") as "owner" | "realtor",
    agency_name: (p.agency_name as string | null) ?? null,
    agency_about: (p.agency_about as string | null) ?? null,
    agency_staff_count: typeof p.agency_staff_count === "number" ? p.agency_staff_count : null,
    verification_status: String(p.verification_status || "unverified"),
    published_objects_count: publishedCount,
  };
}

export async function countPublishedBySubmitter(userId: string): Promise<number> {
  const select = encodeURIComponent("id");
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/properties?submitted_by=eq.${userId}&moderation_status=eq.published&is_active=eq.true&select=${select}`,
    { headers: adminHeaders },
  );
  const data = await res.json();
  return Array.isArray(data) ? data.length : 0;
}
