import { SUPABASE_URL, SERVICE_ROLE_KEY, supabaseAdmin } from "@/integrations/supabase/adminClient";

const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
};

export type AgencyMemberRole = "owner" | "admin" | "member";
export type AgencyVerificationStatus = "unverified" | "pending" | "verified" | "rejected";

export type Agency = {
  id: string;
  name: string;
  logo_url: string | null;
  about: string;
  opened_at: string | null;
  working_hours: string;
  verification_status: AgencyVerificationStatus;
  verification_requested_at: string | null;
  verified_at: string | null;
  verified_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AgencyMember = {
  agency_id: string;
  user_id: string;
  role: AgencyMemberRole;
  created_at: string;
  profiles?: {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
  } | null;
};

export type AgencyManager = {
  id: string;
  agency_id: string;
  full_name: string;
  phone: string;
  photo_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type AgencyInvite = {
  id: string;
  agency_id: string;
  email: string;
  role: AgencyMemberRole;
  token: string;
  invited_by: string | null;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
};

function parseError(data: unknown, res: Response): Error {
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (typeof o.message === "string" && o.message.trim()) return new Error(o.message);
    if (typeof o.hint === "string" && o.hint.trim()) return new Error(o.hint);
  }
  return new Error(`HTTP ${res.status}`);
}

async function restGet<T>(path: string): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw parseError(data, res);
  return data as T;
}

async function restMutate(
  path: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<unknown> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      ...headers,
      Prefer: method === "POST" ? "return=representation" : "return=representation",
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw parseError(data, res);
  return data;
}

export async function fetchMembershipApi(userId: string) {
  const rows = await restGet<AgencyMember[]>(
    `agency_members?user_id=eq.${userId}&select=*`,
  );
  return Array.isArray(rows) ? rows[0] ?? null : null;
}

export async function fetchAgencyByIdApi(agencyId: string) {
  const rows = await restGet<Agency[]>(`agencies?id=eq.${agencyId}&select=*`);
  const row = Array.isArray(rows) ? rows[0] : null;
  if (!row) throw new Error("Агентство не найдено");
  return row;
}

export async function fetchMyAgencyApi(userId: string) {
  const membership = await fetchMembershipApi(userId);
  if (!membership) return null;
  const agency = await fetchAgencyByIdApi(membership.agency_id);
  return { agency, membership };
}

export async function updateAgencyApi(agencyId: string, payload: Partial<Agency>) {
  const data = await restMutate(`agencies?id=eq.${agencyId}`, "PATCH", payload);
  const row = Array.isArray(data) ? data[0] : data;
  return row as Agency;
}

export async function requestAgencyVerificationApi(agencyId: string) {
  return updateAgencyApi(agencyId, { verification_status: "pending" });
}

export async function adminUpdateAgencyApi(agencyId: string, payload: Partial<Agency>) {
  return updateAgencyApi(agencyId, payload);
}

export async function fetchAgenciesAdminApi() {
  return restGet<Agency[]>(`agencies?select=*&order=created_at.desc`);
}

export async function fetchAgencyMembersApi(agencyId: string) {
  return restGet<AgencyMember[]>(
    `agency_members?agency_id=eq.${agencyId}&select=*,profiles(id,full_name,email,phone,avatar_url)&order=created_at.asc`,
  );
}

export async function removeAgencyMemberApi(agencyId: string, userId: string) {
  await restMutate(
    `agency_members?agency_id=eq.${agencyId}&user_id=eq.${userId}`,
    "DELETE",
  );
}

export async function updateAgencyMemberRoleApi(
  agencyId: string,
  userId: string,
  role: AgencyMemberRole,
) {
  await restMutate(
    `agency_members?agency_id=eq.${agencyId}&user_id=eq.${userId}`,
    "PATCH",
    { role },
  );
}

export async function fetchAgencyManagersApi(agencyId: string, activeOnly = false) {
  const filter = activeOnly ? "&is_active=eq.true" : "";
  return restGet<AgencyManager[]>(
    `agency_managers?agency_id=eq.${agencyId}${filter}&select=*&order=sort_order.asc,created_at.asc`,
  );
}

export async function createAgencyManagerApi(
  agencyId: string,
  payload: { full_name: string; phone: string; photo_url?: string | null },
) {
  const data = await restMutate("agency_managers", "POST", {
    agency_id: agencyId,
    full_name: payload.full_name,
    phone: payload.phone,
    photo_url: payload.photo_url ?? null,
  });
  const row = Array.isArray(data) ? data[0] : data;
  return row as AgencyManager;
}

export async function updateAgencyManagerApi(
  managerId: string,
  payload: Partial<AgencyManager>,
) {
  const data = await restMutate(`agency_managers?id=eq.${managerId}`, "PATCH", payload);
  const row = Array.isArray(data) ? data[0] : data;
  return row as AgencyManager;
}

export async function deleteAgencyManagerApi(managerId: string) {
  await restMutate(`agency_managers?id=eq.${managerId}`, "DELETE");
}

export async function fetchAgencyInvitesApi(agencyId: string) {
  return restGet<AgencyInvite[]>(
    `agency_invites?agency_id=eq.${agencyId}&accepted_at=is.null&select=*&order=created_at.desc`,
  );
}

export async function createAgencyInviteApi(
  agencyId: string,
  email: string,
  role: AgencyMemberRole,
  invitedBy: string,
) {
  const data = await restMutate("agency_invites", "POST", {
    agency_id: agencyId,
    email: email.trim().toLowerCase(),
    role,
    invited_by: invitedBy,
  });
  const row = Array.isArray(data) ? data[0] : data;
  return row as AgencyInvite;
}

export async function deleteAgencyInviteApi(inviteId: string) {
  await restMutate(`agency_invites?id=eq.${inviteId}`, "DELETE");
}

export async function fetchInviteByTokenApi(token: string) {
  const rows = await restGet<AgencyInvite[]>(
    `agency_invites?token=eq.${encodeURIComponent(token)}&accepted_at=is.null&select=*`,
  );
  return Array.isArray(rows) ? rows[0] ?? null : null;
}

export async function fetchAgencyPropertiesApi(agencyId: string) {
  return restGet<Record<string, unknown>[]>(
    `properties?agency_id=eq.${agencyId}&moderation_status=eq.approved&is_active=eq.true&select=*&order=created_at.desc`,
  );
}

export async function fetchMyAgencyPropertiesApi(agencyId: string) {
  return restGet<Record<string, unknown>[]>(
    `properties?agency_id=eq.${agencyId}&select=*&order=created_at.desc`,
  );
}

export async function uploadAgencyAssetApi(agencyId: string, file: File, kind: "logo" | "manager") {
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${agencyId}/${kind}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabaseAdmin.storage.upload("agency-assets", path, file);
  if (error) throw new Error(typeof error === "string" ? error : "Не удалось загрузить файл");
  return supabaseAdmin.storage.getPublicUrl("agency-assets", path);
}

/** Ensure agency exists for legacy realtor profiles when migration not yet run on row */
export async function ensureAgencyForUserApi(userId: string, seed?: { name?: string; about?: string }) {
  const existing = await fetchMyAgencyApi(userId);
  if (existing) return existing;

  const created = await restMutate("agencies", "POST", {
    name: seed?.name || "Агентство",
    about: seed?.about || "",
  });
  const agency = (Array.isArray(created) ? created[0] : created) as Agency;
  await restMutate("agency_members", "POST", {
    agency_id: agency.id,
    user_id: userId,
    role: "owner",
  });
  await restMutate(`profiles?id=eq.${userId}`, "PATCH", {
    account_type: "agency",
  });
  return { agency, membership: { agency_id: agency.id, user_id: userId, role: "owner" as const, created_at: new Date().toISOString() } };
}
