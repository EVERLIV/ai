import {
  SERVICE_ROLE_KEY,
  SUPABASE_URL,
  supabaseAdmin,
} from "@/integrations/supabase/adminClient";

const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
};

export type AgencyMemberRole = "owner" | "admin" | "member";
export type AgencyVerificationStatus =
  | "unverified"
  | "pending"
  | "verified"
  | "rejected";

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
  telegram_enabled?: boolean;
  telegram_chat_id?: number | null;
  telegram_chat_title?: string | null;
  telegram_connect_code?: string | null;
  telegram_connect_expires_at?: string | null;
  telegram_connected_at?: string | null;
  telegram_notify_leads?: boolean;
  telegram_notify_views?: boolean;
  telegram_notify_moderation?: boolean;
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
  property_types: string[];
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

function errorBodyText(data: unknown): string {
  if (!data || typeof data !== "object") return "";
  const o = data as Record<string, unknown>;
  return [o.message, o.details, o.hint, o.code]
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .join(" — ");
}

function isMissingColumnError(data: unknown, column?: string): boolean {
  const text = errorBodyText(data);
  if (!/Could not find.*column|column .* does not exist|PGRST204/i.test(text))
    return false;
  if (!column) return true;
  return new RegExp(column, "i").test(text);
}

function parseError(data: unknown, res: Response): Error {
  const combined = errorBodyText(data);
  if (combined) {
    if (isMissingColumnError(data, "property_types")) {
      return new Error(
        "В БД нет колонки property_types. Выполните supabase/self_hosted_agency_hotfix.sql",
      );
    }
    if (isMissingColumnError(data, "agency_id")) {
      return new Error(
        "В БД нет колонки properties.agency_id. Выполните supabase/self_hosted_agency_hotfix.sql",
      );
    }
    if (isMissingColumnError(data, "telegram_")) {
      return new Error(
        "В БД нет полей Telegram для агентств. Выполните supabase/self_hosted_agency_telegram.sql",
      );
    }
    return new Error(combined);
  }
  return new Error(`HTTP ${res.status}`);
}

async function restGet<T>(path: string): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw parseError(data, res);
  return data as T;
}

async function restMutateRaw(
  path: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<{ ok: boolean; status: number; data: unknown }> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      ...headers,
      Prefer: "return=representation",
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function restMutate(
  path: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<unknown> {
  const { ok, status, data } = await restMutateRaw(path, method, body);
  if (!ok) throw parseError(data, { status } as Response);
  return data;
}

export async function fetchMembershipApi(userId: string) {
  const rows = await restGet<AgencyMember[]>(
    `agency_members?user_id=eq.${userId}&select=*`,
  );
  return Array.isArray(rows) ? (rows[0] ?? null) : null;
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

export async function updateAgencyApi(
  agencyId: string,
  payload: Partial<Agency>,
) {
  const data = await restMutate(`agencies?id=eq.${agencyId}`, "PATCH", payload);
  const row = Array.isArray(data) ? data[0] : data;
  return row as Agency;
}

export async function requestAgencyVerificationApi(agencyId: string) {
  return updateAgencyApi(agencyId, { verification_status: "pending" });
}

export async function adminUpdateAgencyApi(
  agencyId: string,
  payload: Partial<Agency>,
) {
  return updateAgencyApi(agencyId, payload);
}

export async function fetchAgenciesAdminApi() {
  return restGet<Agency[]>(`agencies?select=*&order=created_at.desc`);
}

/** Публичный список верифицированных агентств для фильтров каталога */
export async function fetchVerifiedAgenciesApi(): Promise<
  Pick<Agency, "id" | "name" | "logo_url" | "verification_status">[]
> {
  // anon REST: agencies в Database types может отсутствовать
  const anonKey =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzc4ODQyOTQwLCJleHAiOjE5MzY1MjI5NDB9.uK1BksB1rl0vNAlUc2nVpkqECeiWD9CKx0rIfHUlyWA";
  const qs =
    "select=id,name,logo_url,verification_status&verification_status=eq.verified&order=name.asc";
  const res = await fetch(`${SUPABASE_URL}/rest/v1/agencies?${qs}`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
  });
  const data = await res.json().catch(() => []);
  if (!res.ok) {
    const msg =
      data && typeof data === "object" && "message" in data
        ? String((data as { message: string }).message)
        : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return Array.isArray(data) ? data : [];
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

export async function fetchAgencyManagersApi(
  agencyId: string,
  activeOnly = false,
) {
  const filter = activeOnly ? "&is_active=eq.true" : "";
  const rows = await restGet<AgencyManager[]>(
    `agency_managers?agency_id=eq.${agencyId}${filter}&select=*&order=sort_order.asc,created_at.asc`,
  );
  return rows.map((m) => ({
    ...m,
    property_types: Array.isArray(m.property_types) ? m.property_types : [],
  }));
}

export async function createAgencyManagerApi(
  agencyId: string,
  payload: {
    full_name: string;
    phone: string;
    photo_url?: string | null;
    property_types?: string[];
  },
) {
  const base = {
    agency_id: agencyId,
    full_name: payload.full_name,
    phone: payload.phone,
    photo_url: payload.photo_url ?? null,
  };
  const withTypes = {
    ...base,
    property_types: payload.property_types ?? [],
  };

  let result = await restMutateRaw("agency_managers", "POST", withTypes);
  if (!result.ok && isMissingColumnError(result.data, "property_types")) {
    // Колонка ещё не накатана — сохраняем менеджера без типов
    result = await restMutateRaw("agency_managers", "POST", base);
  }
  if (!result.ok)
    throw parseError(result.data, { status: result.status } as Response);

  const row = Array.isArray(result.data) ? result.data[0] : result.data;
  const manager = row as AgencyManager;
  return {
    ...manager,
    property_types: Array.isArray(manager.property_types)
      ? manager.property_types
      : (payload.property_types ?? []),
  };
}

export async function updateAgencyManagerApi(
  managerId: string,
  payload: Partial<AgencyManager>,
) {
  let result = await restMutateRaw(
    `agency_managers?id=eq.${managerId}`,
    "PATCH",
    payload,
  );
  if (
    !result.ok &&
    isMissingColumnError(result.data, "property_types") &&
    "property_types" in payload
  ) {
    const { property_types: _drop, ...rest } = payload;
    if (Object.keys(rest).length === 0) {
      throw parseError(result.data, { status: result.status } as Response);
    }
    result = await restMutateRaw(
      `agency_managers?id=eq.${managerId}`,
      "PATCH",
      rest,
    );
  }
  if (!result.ok)
    throw parseError(result.data, { status: result.status } as Response);
  const row = Array.isArray(result.data) ? result.data[0] : result.data;
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
  return Array.isArray(rows) ? (rows[0] ?? null) : null;
}

export async function fetchAgencyPropertiesApi(agencyId: string) {
  try {
    return await restGet<Record<string, unknown>[]>(
      `properties?agency_id=eq.${agencyId}&moderation_status=eq.published&is_active=eq.true&select=*&order=created_at.desc`,
    );
  } catch (err) {
    if (
      err instanceof Error &&
      /agency_id|self_hosted_agency_hotfix/i.test(err.message)
    ) {
      return [];
    }
    throw err;
  }
}

export async function fetchMyAgencyPropertiesApi(agencyId: string) {
  try {
    return await restGet<Record<string, unknown>[]>(
      `properties?agency_id=eq.${agencyId}&select=*&order=created_at.desc`,
    );
  } catch (err) {
    if (
      err instanceof Error &&
      /agency_id|self_hosted_agency_hotfix/i.test(err.message)
    ) {
      return [];
    }
    throw err;
  }
}

function toPublicStorageUrl(url: string): string {
  // /storage/v1/object/bucket/... → /storage/v1/object/public/bucket/...
  return url.replace(
    /\/storage\/v1\/object\/(?!public\/)/,
    "/storage/v1/object/public/",
  );
}

export async function uploadAgencyAssetApi(
  agencyId: string,
  file: File,
  kind: "logo" | "manager",
) {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${agencyId}/${kind}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabaseAdmin.storage.upload(
    "agency-assets",
    path,
    file,
  );
  if (error)
    throw new Error(
      typeof error === "string" ? error : "Не удалось загрузить файл",
    );
  return toPublicStorageUrl(
    supabaseAdmin.storage.getPublicUrl("agency-assets", path),
  );
}

/** Ensure agency exists for legacy realtor profiles when migration not yet run on row */
export async function ensureAgencyForUserApi(
  userId: string,
  seed?: { name?: string; about?: string },
) {
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
  return {
    agency,
    membership: {
      agency_id: agency.id,
      user_id: userId,
      role: "owner" as const,
      created_at: new Date().toISOString(),
    },
  };
}

export type AgencyTelegramSettings = {
  telegram_enabled?: boolean;
  telegram_notify_leads?: boolean;
  telegram_notify_views?: boolean;
};

/** Нормализация ID группы/канала Telegram (-100…) */
export function parseTelegramChatId(raw: string): number | null {
  const s = raw.trim().replace(/\s/g, "");
  if (!s) return null;
  const n = Number(s);
  if (!Number.isFinite(n) || !Number.isInteger(n)) return null;
  return n;
}

export async function connectAgencyTelegramByChatIdApi(
  agencyId: string,
  chatIdRaw: string,
  chatTitle?: string | null,
) {
  const chatId = parseTelegramChatId(chatIdRaw);
  if (chatId == null) {
    throw new Error("Укажите числовой ID чата, например -1001234567890");
  }

  const taken = await restGet<Pick<Agency, "id" | "name">[]>(
    `agencies?telegram_chat_id=eq.${chatId}&select=id,name`,
  );
  if (taken?.[0] && taken[0].id !== agencyId) {
    throw new Error(`Этот чат уже привязан к агентству «${taken[0].name}»`);
  }

  return updateAgencyApi(agencyId, {
    telegram_chat_id: chatId,
    telegram_chat_title: chatTitle?.trim() || null,
    telegram_connected_at: new Date().toISOString(),
    telegram_enabled: true,
    telegram_connect_code: null,
    telegram_connect_expires_at: null,
  });
}

export async function updateAgencyTelegramSettingsApi(
  agencyId: string,
  settings: AgencyTelegramSettings,
) {
  return updateAgencyApi(agencyId, settings);
}

export async function disconnectAgencyTelegramApi(agencyId: string) {
  return updateAgencyApi(agencyId, {
    telegram_enabled: false,
    telegram_chat_id: null,
    telegram_chat_title: null,
    telegram_connect_code: null,
    telegram_connect_expires_at: null,
    telegram_connected_at: null,
  });
}
