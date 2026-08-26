import {
  SERVICE_ROLE_KEY,
  SUPABASE_URL,
  supabaseAdmin,
} from "@/integrations/supabase/adminClient";
import { publicStorageUrl, toPublicStorageUrl } from "@/lib/storageUrl";
import { supabase } from "@/integrations/supabase/client";

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
  avg_rating?: number;
  reviews_count?: number;
  response_minutes?: number;
  telegram_enabled?: boolean;
  telegram_chat_id?: number | null;
  telegram_chat_title?: string | null;
  telegram_connect_code?: string | null;
  telegram_connect_expires_at?: string | null;
  telegram_connected_at?: string | null;
  telegram_notify_leads?: boolean;
  telegram_notify_views?: boolean;
  telegram_notify_moderation?: boolean;
  ai_consultant_enabled?: boolean;
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
  avg_rating?: number;
  reviews_count?: number;
  response_minutes?: number;
  about?: string;
};

export type AgencyReviewStatus = "published" | "pending" | "rejected";

export type AgencyReview = {
  id: string;
  agency_id: string;
  manager_id: string | null;
  author_name: string;
  author_email: string | null;
  user_id: string | null;
  rating: number;
  body: string;
  status: AgencyReviewStatus;
  reply_body?: string | null;
  reply_at?: string | null;
  reply_by?: string | null;
  created_at: string;
  updated_at: string;
  agency_managers?:
    | { id: string; full_name: string }
    | { id: string; full_name: string }[]
    | null;
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
    if (isMissingColumnError(data, "agency_reviews") || /agency_reviews/i.test(combined)) {
      return new Error(
        "В БД нет таблицы отзывов. Выполните supabase/self_hosted_agency_reviews.sql",
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
  return normalizeAgency(row);
}

function normalizeAgency(agency: Agency): Agency {
  return {
    ...agency,
    logo_url: publicStorageUrl(agency.logo_url),
  };
}

function normalizeManager<T extends { photo_url?: string | null }>(m: T): T {
  return {
    ...m,
    photo_url: publicStorageUrl(m.photo_url),
  };
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
  const next = { ...payload };
  if (typeof next.logo_url === "string") {
    next.logo_url = toPublicStorageUrl(next.logo_url);
  }
  const data = await restMutate(`agencies?id=eq.${agencyId}`, "PATCH", next);
  const row = Array.isArray(data) ? data[0] : data;
  return normalizeAgency(row as Agency);
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

const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzc4ODQyOTQwLCJleHAiOjE5MzY1MjI5NDB9.uK1BksB1rl0vNAlUc2nVpkqECeiWD9CKx0rIfHUlyWA";

const anonHeaders = {
  apikey: ANON_KEY,
  Authorization: `Bearer ${ANON_KEY}`,
};

async function anonRestGet<T>(path: string): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: anonHeaders,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw parseError(data, res);
  return data as T;
}

/** Публичный список верифицированных агентств для фильтров каталога */
export async function fetchVerifiedAgenciesApi(): Promise<
  Pick<Agency, "id" | "name" | "logo_url" | "verification_status">[]
> {
  const qs =
    "select=id,name,logo_url,verification_status&verification_status=eq.verified&order=name.asc";
  const data = await anonRestGet<
    Pick<Agency, "id" | "name" | "logo_url" | "verification_status">[]
  >(`agencies?${qs}`);
  return Array.isArray(data) ? data : [];
}

export type PublicAgencyCard = Pick<
  Agency,
  | "id"
  | "name"
  | "logo_url"
  | "verification_status"
  | "about"
  | "opened_at"
  | "working_hours"
  | "avg_rating"
  | "reviews_count"
  | "response_minutes"
> & { objects_count: number; managers_count: number; districts: string[] };

/** Верифицированные агентства с числом объектов и менеджеров (каталог). */
export async function fetchPublicAgenciesCatalogApi(): Promise<
  PublicAgencyCard[]
> {
  let agencies: Pick<
    Agency,
    | "id"
    | "name"
    | "logo_url"
    | "verification_status"
    | "about"
    | "opened_at"
    | "working_hours"
    | "avg_rating"
    | "reviews_count"
    | "response_minutes"
  >[] = [];
  try {
    agencies = await anonRestGet(
      "agencies?select=id,name,logo_url,verification_status,about,opened_at,working_hours,avg_rating,reviews_count,response_minutes&verification_status=eq.verified&order=name.asc",
    );
  } catch {
    agencies = await anonRestGet(
      "agencies?select=id,name,logo_url,verification_status,about,opened_at,working_hours&verification_status=eq.verified&order=name.asc",
    );
  }
  const list = Array.isArray(agencies) ? agencies : [];
  if (!list.length) return [];

  const ids = list.map((a) => a.id);
  const idFilter = `in.(${ids.join(",")})`;

  const [props, managers] = await Promise.all([
    anonRestGet<{ agency_id: string; district: string | null }[]>(
      `properties?agency_id=${idFilter}&moderation_status=eq.published&is_active=eq.true&select=agency_id,district`,
    ).catch(() => [] as { agency_id: string; district: string | null }[]),
    anonRestGet<{ agency_id: string }[]>(
      `agency_managers?agency_id=${idFilter}&is_active=eq.true&select=agency_id`,
    ).catch(() => [] as { agency_id: string }[]),
  ]);

  const propCounts = new Map<string, number>();
  const districtMap = new Map<string, Set<string>>();
  for (const p of props) {
    propCounts.set(p.agency_id, (propCounts.get(p.agency_id) || 0) + 1);
    if (p.district) {
      if (!districtMap.has(p.agency_id)) districtMap.set(p.agency_id, new Set());
      districtMap.get(p.agency_id)!.add(p.district);
    }
  }
  const mgrCounts = new Map<string, number>();
  for (const m of managers) {
    mgrCounts.set(m.agency_id, (mgrCounts.get(m.agency_id) || 0) + 1);
  }

  return list.map((a) => ({
    ...a,
    logo_url: publicStorageUrl(a.logo_url),
    about: a.about || "",
    working_hours: a.working_hours || "",
    objects_count: propCounts.get(a.id) || 0,
    managers_count: mgrCounts.get(a.id) || 0,
    districts: Array.from(districtMap.get(a.id) || []),
  }));
}

export type PublicManagerAgency = Pick<
  Agency,
  "id" | "name" | "logo_url" | "verification_status"
>;

export type PublicManagerCard = AgencyManager & {
  agency: PublicManagerAgency;
  objects_count: number;
  districts: string[];
};

type ManagerWithAgencyRow = AgencyManager & {
  agencies: PublicManagerAgency | PublicManagerAgency[] | null;
};

function normalizeAgencyEmbed(
  agencies: ManagerWithAgencyRow["agencies"],
): PublicManagerAgency | null {
  if (!agencies) return null;
  const a = Array.isArray(agencies) ? agencies[0] : agencies;
  if (!a?.id) return null;
  return {
    id: a.id,
    name: a.name,
    logo_url: publicStorageUrl(a.logo_url),
    verification_status: a.verification_status,
  };
}

/** Активные менеджеры verified-агентств для каталога риелторов. */
export async function fetchPublicManagersApi(): Promise<PublicManagerCard[]> {
  let rows: ManagerWithAgencyRow[] = [];
  try {
    rows = await anonRestGet<ManagerWithAgencyRow[]>(
      "agency_managers?is_active=eq.true&select=*,agencies!inner(id,name,logo_url,verification_status)&agencies.verification_status=eq.verified&order=sort_order.asc,full_name.asc",
    );
  } catch {
    // Fallback без inner filter: фильтруем на клиенте
    const [managers, agencies] = await Promise.all([
      anonRestGet<AgencyManager[]>(
        "agency_managers?is_active=eq.true&select=*&order=sort_order.asc,full_name.asc",
      ),
      fetchVerifiedAgenciesApi(),
    ]);
    const verified = new Set(agencies.map((a) => a.id));
    const agencyMap = new Map(agencies.map((a) => [a.id, a]));
    rows = (Array.isArray(managers) ? managers : [])
      .filter((m) => verified.has(m.agency_id))
      .map((m) => ({
        ...m,
        agencies: agencyMap.get(m.agency_id) ?? null,
      }));
  }

  const list = (Array.isArray(rows) ? rows : [])
    .map((row) => {
      const agency = normalizeAgencyEmbed(row.agencies);
      if (!agency || agency.verification_status !== "verified") return null;
      const { agencies: _a, ...manager } = row;
      return {
        ...normalizeManager(manager),
        property_types: Array.isArray(manager.property_types)
          ? manager.property_types
          : [],
        agency,
        objects_count: 0,
        districts: [],
      } satisfies PublicManagerCard;
    })
    .filter(Boolean) as PublicManagerCard[];

  if (!list.length) return [];

  const mgrIds = list.map((m) => m.id);
  const counts = await anonRestGet<
    { listing_manager_id: string; district: string | null }[]
  >(
    `properties?listing_manager_id=in.(${mgrIds.join(",")})&moderation_status=eq.published&is_active=eq.true&select=listing_manager_id,district`,
  ).catch(
    () => [] as { listing_manager_id: string; district: string | null }[],
  );

  const countMap = new Map<string, number>();
  const districtMap = new Map<string, Set<string>>();
  for (const p of counts) {
    if (!p.listing_manager_id) continue;
    countMap.set(
      p.listing_manager_id,
      (countMap.get(p.listing_manager_id) || 0) + 1,
    );
    if (p.district) {
      if (!districtMap.has(p.listing_manager_id)) {
        districtMap.set(p.listing_manager_id, new Set());
      }
      districtMap.get(p.listing_manager_id)!.add(p.district);
    }
  }

  return list.map((m) => ({
    ...m,
    objects_count: countMap.get(m.id) || 0,
    districts: Array.from(districtMap.get(m.id) || []),
  }));
}

export type PublicManagerDetail = PublicManagerCard;

/** Публичный профиль менеджера + агентство + счётчик объектов. */
export async function fetchManagerByIdApi(
  managerId: string,
): Promise<PublicManagerDetail> {
  let row: ManagerWithAgencyRow | null = null;
  try {
    const rows = await anonRestGet<ManagerWithAgencyRow[]>(
      `agency_managers?id=eq.${managerId}&is_active=eq.true&select=*,agencies(id,name,logo_url,verification_status)`,
    );
    row = Array.isArray(rows) ? rows[0] ?? null : null;
  } catch {
    const rows = await anonRestGet<AgencyManager[]>(
      `agency_managers?id=eq.${managerId}&is_active=eq.true&select=*`,
    );
    const m = Array.isArray(rows) ? rows[0] : null;
    if (!m) throw new Error("Риелтор не найден");
    const agency = await fetchAgencyByIdApi(m.agency_id);
    row = {
      ...m,
      agencies: {
        id: agency.id,
        name: agency.name,
        logo_url: agency.logo_url,
        verification_status: agency.verification_status,
      },
    };
  }

  if (!row) throw new Error("Риелтор не найден");
  const agency = normalizeAgencyEmbed(row.agencies);
  if (!agency) throw new Error("Риелтор не найден");

  const props = await anonRestGet<{ listing_manager_id: string }[]>(
    `properties?listing_manager_id=eq.${managerId}&moderation_status=eq.published&is_active=eq.true&select=listing_manager_id`,
  ).catch(() => [] as { listing_manager_id: string }[]);

  const { agencies: _a, ...manager } = row;
  return {
    ...manager,
    property_types: Array.isArray(manager.property_types)
      ? manager.property_types
      : [],
    agency,
    objects_count: props.length,
    districts: [],
  };
}

/** Опубликованные объекты менеджера. */
export async function fetchManagerPropertiesApi(managerId: string) {
  try {
    return await anonRestGet<Record<string, unknown>[]>(
      `properties?listing_manager_id=eq.${managerId}&moderation_status=eq.published&is_active=eq.true&select=*&order=created_at.desc`,
    );
  } catch {
    return [];
  }
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
  return rows.map((m) =>
    normalizeManager({
      ...m,
      property_types: Array.isArray(m.property_types) ? m.property_types : [],
    }),
  );
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

  const stored = await supabaseAdmin.storage.exists("agency-assets", path);
  if (!stored) {
    throw new Error(
      "Файл не сохранился в Storage. Проверьте bucket agency-assets и sql/fix_agency_storage_public_urls.sql.",
    );
  }

  const url = toPublicStorageUrl(
    supabaseAdmin.storage.getPublicUrl("agency-assets", path),
  );
  if (!url.includes("/storage/v1/object/public/")) {
    throw new Error("Внутренняя ошибка: публичный URL логотипа сформирован неверно");
  }
  return url;
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

async function anonRestMutate(
  path: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<unknown> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      ...anonHeaders,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw parseError(data, res);
  return data;
}

export async function fetchAgencyReviewsApi(params: {
  agencyId: string;
  managerId?: string | null;
  limit?: number;
}): Promise<AgencyReview[]> {
  const limit = params.limit ?? 50;
  let path = `agency_reviews?agency_id=eq.${params.agencyId}&status=eq.published&order=created_at.desc&limit=${limit}&select=*`;
  if (params.managerId) {
    path = `agency_reviews?manager_id=eq.${params.managerId}&status=eq.published&order=created_at.desc&limit=${limit}&select=*`;
  }
  try {
    const rows = await anonRestGet<AgencyReview[]>(path);
    return Array.isArray(rows) ? rows : [];
  } catch (err) {
    if (
      err instanceof Error &&
      /agency_reviews|Could not find|PGRST/i.test(err.message)
    ) {
      return [];
    }
    throw err;
  }
}

/** Все отзывы агентства (включая pending/rejected) — для кабинета участника */
export async function fetchMyAgencyReviewsApi(params: {
  agencyId: string;
  limit?: number;
}): Promise<AgencyReview[]> {
  const limit = params.limit ?? 100;
  const select = encodeURIComponent("*,agency_managers(id,full_name)");
  try {
    const rows = await restGet<AgencyReview[]>(
      `agency_reviews?agency_id=eq.${params.agencyId}&select=${select}&order=created_at.desc&limit=${limit}`,
    );
    return Array.isArray(rows) ? rows : [];
  } catch (err) {
    if (
      err instanceof Error &&
      /agency_reviews|Could not find|PGRST|column/i.test(err.message)
    ) {
      return [];
    }
    throw err;
  }
}

export async function replyToAgencyReviewApi(params: {
  reviewId: string;
  reply: string;
}): Promise<AgencyReview> {
  const text = params.reply.trim();
  if (text.length < 2) throw new Error("Напишите ответ подробнее");
  if (text.length > 2000) {
    throw new Error("Ответ слишком длинный (макс. 2000 символов)");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Войдите, чтобы ответить на отзыв");
  }

  // Предпочтительно RPC (проверяет членство агентства)
  const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/reply_to_agency_review`, {
    method: "POST",
    headers: {
      apikey: anonHeaders.apikey,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      p_review_id: params.reviewId,
      p_reply: text,
    }),
  });
  const rpcData = await rpcRes.json().catch(() => ({}));
  if (rpcRes.ok) {
    return (Array.isArray(rpcData) ? rpcData[0] : rpcData) as AgencyReview;
  }

  // Fallback: PATCH reply columns (если RPC ещё не применён)
  const missingRpc =
    rpcRes.status === 404 ||
    /function.*reply_to_agency_review|Could not find.*function/i.test(
      errorBodyText(rpcData),
    );
  if (!missingRpc) {
    throw parseError(rpcData, rpcRes);
  }

  try {
    const data = await restMutate(
      `agency_reviews?id=eq.${params.reviewId}`,
      "PATCH",
      {
        reply_body: text,
        reply_at: new Date().toISOString(),
        reply_by: session.user.id,
        updated_at: new Date().toISOString(),
      },
    );
    const row = Array.isArray(data) ? data[0] : data;
    return row as AgencyReview;
  } catch (err) {
    if (
      err instanceof Error &&
      /reply_body|Could not find.*column/i.test(err.message)
    ) {
      throw new Error(
        "В БД нет полей ответа. Выполните supabase/self_hosted_agency_reviews_reply.sql",
      );
    }
    throw err;
  }
}

export async function createAgencyReviewApi(payload: {
  agency_id: string;
  manager_id?: string | null;
  author_name: string;
  author_email?: string | null;
  rating: number;
  body: string;
  user_id: string;
}): Promise<AgencyReview> {
  const name = payload.author_name.trim();
  const body = payload.body.trim();
  if (!payload.user_id) throw new Error("Войдите, чтобы оставить отзыв");
  if (name.length < 2) throw new Error("Укажите имя");
  if (body.length < 5) throw new Error("Напишите отзыв подробнее");
  if (payload.rating < 1 || payload.rating > 5) {
    throw new Error("Оценка от 1 до 5");
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    throw new Error("Войдите, чтобы оставить отзыв");
  }

  const res = await fetch(`${SUPABASE_URL}/rest/v1/agency_reviews`, {
    method: "POST",
    headers: {
      apikey: anonHeaders.apikey,
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      agency_id: payload.agency_id,
      manager_id: payload.manager_id || null,
      author_name: name,
      author_email: payload.author_email?.trim() || null,
      user_id: payload.user_id,
      rating: payload.rating,
      body,
      status: "pending",
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw parseError(data, res);
  const row = Array.isArray(data) ? data[0] : data;
  return row as AgencyReview;
}

/** Форматирование рейтинга для UI */
export function formatAvgRating(value?: number | null): string {
  const n = Number(value || 0);
  if (!n) return "—";
  return n.toLocaleString("ru-RU", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}
