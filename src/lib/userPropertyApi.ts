import {
  SERVICE_ROLE_KEY,
  SUPABASE_URL,
  supabaseAdmin,
} from "@/integrations/supabase/adminClient";

/**
 * Кабинет клиента: PostgREST на api.arendacity.com часто отклоняет user JWT
 * (PGRST301 «No suitable key or wrong key type»), пока anon/service_role работают.
 * Пишем/читаем через service_role, жёстко ограничивая submitted_by / id = текущий user.
 */
const headers = {
  apikey: SERVICE_ROLE_KEY,
  Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
  "Content-Type": "application/json",
};

function parseError(data: unknown, res: Response): Error {
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (typeof o.message === "string" && o.message.trim())
      return new Error(o.message);
    if (typeof o.hint === "string" && o.hint.trim()) return new Error(o.hint);
  }
  return new Error(`HTTP ${res.status}`);
}

export async function fetchMyPropertiesApi(
  userId: string,
  agencyId?: string | null,
  developerId?: string | null,
) {
  if (agencyId) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/properties?or=(submitted_by.eq.${userId},agency_id.eq.${agencyId})&select=*&order=created_at.desc`,
      { headers },
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw parseError(data, res);
    return Array.isArray(data) ? data : [];
  }
  if (developerId) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/properties?or=(submitted_by.eq.${userId},developer_id.eq.${developerId})&select=*&order=created_at.desc`,
      { headers },
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw parseError(data, res);
    return Array.isArray(data) ? data : [];
  }
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/properties?submitted_by=eq.${userId}&select=*&order=created_at.desc`,
    { headers },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw parseError(data, res);
  return Array.isArray(data) ? data : [];
}

export async function insertMyPropertyApi(
  userId: string,
  payload: Record<string, unknown>,
  agencyId?: string | null,
  developerId?: string | null,
) {
  const body = {
    ...payload,
    submitted_by: userId,
    client_id: userId,
    ...(agencyId ? { agency_id: agencyId } : {}),
    ...(developerId ? { developer_id: developerId } : {}),
  };
  const res = await fetch(`${SUPABASE_URL}/rest/v1/properties`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=representation" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw parseError(data, res);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.id) throw new Error("Сервер не вернул id объекта");
  return row as { id: string; public_id: string | null };
}

export async function updateMyPropertyApi(
  userId: string,
  propertyId: string,
  payload: Record<string, unknown>,
  agencyId?: string | null,
  developerId?: string | null,
) {
  const filter = agencyId
    ? `id=eq.${propertyId}&or=(submitted_by.eq.${userId},agency_id.eq.${agencyId})`
    : developerId
      ? `id=eq.${propertyId}&or=(submitted_by.eq.${userId},developer_id.eq.${developerId})`
      : `id=eq.${propertyId}&submitted_by=eq.${userId}`;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/properties?${filter}`, {
    method: "PATCH",
    headers: { ...headers, Prefer: "return=minimal" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw parseError(data, res);
  }
}

export async function deleteMyPropertyApi(
  userId: string,
  propertyId: string,
  agencyId?: string | null,
  developerId?: string | null,
) {
  const filter = agencyId
    ? `id=eq.${propertyId}&or=(submitted_by.eq.${userId},agency_id.eq.${agencyId})`
    : developerId
      ? `id=eq.${propertyId}&or=(submitted_by.eq.${userId},developer_id.eq.${developerId})`
      : `id=eq.${propertyId}&submitted_by=eq.${userId}`;
  const res = await fetch(`${SUPABASE_URL}/rest/v1/properties?${filter}`, {
    method: "DELETE",
    headers,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw parseError(data, res);
  }
}

export async function uploadMyPropertyPhotoApi(propertyId: string, file: File) {
  const path = `${propertyId}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabaseAdmin.storage.upload(
    "property-photos",
    path,
    file,
  );
  if (error)
    throw new Error(
      typeof error === "string" ? error : "Не удалось загрузить фото",
    );
  return supabaseAdmin.storage.getPublicUrl("property-photos", path);
}

export async function fetchMyProfileApi(userId: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}&select=*`,
    { headers },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw parseError(data, res);
  const row = Array.isArray(data) ? data[0] : null;
  if (!row) throw new Error("Профиль не найден");
  return row;
}

export async function updateMyProfileApi(
  userId: string,
  payload: Record<string, unknown>,
) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?id=eq.${userId}`, {
    method: "PATCH",
    headers: { ...headers, Prefer: "return=minimal" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw parseError(data, res);
  }
}

/** Kong режет слишком длинный `in.(uuid,uuid,…)`. */
const IN_CHUNK = 40;

async function fetchByIdsInChunks<T>(
  table: string,
  column: string,
  ids: string[],
  select: string,
  order: string,
  extraQuery = "",
): Promise<T[]> {
  const out: T[] = [];
  for (let i = 0; i < ids.length; i += IN_CHUNK) {
    const chunk = ids.slice(i, i + IN_CHUNK).join(",");
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}&${column}=in.(${chunk})&order=${encodeURIComponent(order)}${extraQuery}`,
      { headers },
    );
    const data = await res.json().catch(() => []);
    if (!res.ok) throw parseError(data, res);
    if (Array.isArray(data)) out.push(...(data as T[]));
  }
  return out;
}

export type CabinetLeadRow = {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  message: string | null;
  object_id: string | null;
  source: string;
  status: string | null;
  created_at: string;
  business_category: string | null;
};

export type CabinetPropertyLite = {
  id: string;
  address: string;
  type: string;
  area: number;
  price: number;
  cover_photo: string | null;
  listing_manager_id: string | null;
  extras: Record<string, unknown> | null;
};

const PROPERTY_LITE_SELECT =
  "id,address,type,area,price,cover_photo,listing_manager_id,extras";

export async function fetchMyPropertiesLiteApi(
  userId: string,
  agencyId?: string | null,
): Promise<CabinetPropertyLite[]> {
  const filter = agencyId
    ? `or=(submitted_by.eq.${userId},agency_id.eq.${agencyId})`
    : `submitted_by=eq.${userId}`;
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/properties?${filter}&select=${PROPERTY_LITE_SELECT}&order=created_at.desc`,
    { headers },
  );
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw parseError(data, res);
  if (!Array.isArray(data)) return [];
  return data.map((p: Record<string, unknown>) => ({
    id: String(p.id),
    address: String(p.address || ""),
    type: String(p.type || ""),
    area: Number(p.area) || 0,
    price: Number(p.price) || 0,
    cover_photo: typeof p.cover_photo === "string" ? p.cover_photo : null,
    listing_manager_id:
      typeof p.listing_manager_id === "string" ? p.listing_manager_id : null,
    extras:
      p.extras && typeof p.extras === "object"
        ? (p.extras as Record<string, unknown>)
        : null,
  }));
}

export async function fetchLeadsForPropertyIdsApi(
  propertyIds: string[],
  opts?: { since?: string; status?: string },
) {
  if (!propertyIds.length) return [] as CabinetLeadRow[];
  const unique = [...new Set(propertyIds.filter(Boolean))];
  let extra = "";
  if (opts?.since) {
    extra += `&created_at=gte.${encodeURIComponent(opts.since)}`;
  }
  if (opts?.status && opts.status !== "all") {
    extra += `&status=eq.${encodeURIComponent(opts.status)}`;
  }
  const rows = await fetchByIdsInChunks<CabinetLeadRow>(
    "crm_leads",
    "object_id",
    unique,
    "id,name,phone,email,message,object_id,source,status,created_at,business_category",
    "created_at.desc",
    extra,
  );
  rows.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  return rows;
}

export async function fetchNewLeadsCountApi(propertyIds: string[]) {
  if (!propertyIds.length) return 0;
  const unique = [...new Set(propertyIds.filter(Boolean))];
  const rows = await fetchByIdsInChunks<{ id: string }>(
    "crm_leads",
    "object_id",
    unique,
    "id",
    "created_at.desc",
    "&or=(status.eq.new,status.is.null)",
  );
  return rows.length;
}

export async function updateLeadStatusApi(leadId: string, status: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/crm_leads?id=eq.${encodeURIComponent(leadId)}`,
    {
      method: "PATCH",
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify({ status }),
    },
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw parseError(data, res);
  }
}

export async function fetchEventsForPropertyIdsApi(propertyIds: string[]) {
  if (!propertyIds.length) return [] as Record<string, unknown>[];
  const unique = [...new Set(propertyIds.filter(Boolean))];
  try {
    return await fetchByIdsInChunks<Record<string, unknown>>(
      "crm_events",
      "object_id",
      unique,
      "id,object_id,event_type,created_at",
      "created_at.asc",
    );
  } catch {
    return [];
  }
}
