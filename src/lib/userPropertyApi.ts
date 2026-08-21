import { SUPABASE_URL, SERVICE_ROLE_KEY, supabaseAdmin } from "@/integrations/supabase/adminClient";

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
    if (typeof o.message === "string" && o.message.trim()) return new Error(o.message);
    if (typeof o.hint === "string" && o.hint.trim()) return new Error(o.hint);
  }
  return new Error(`HTTP ${res.status}`);
}

export async function fetchMyPropertiesApi(userId: string, agencyId?: string | null) {
  if (agencyId) {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/properties?or=(submitted_by.eq.${userId},agency_id.eq.${agencyId})&select=*&order=created_at.desc`,
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
) {
  const body = {
    ...payload,
    submitted_by: userId,
    client_id: userId,
    ...(agencyId ? { agency_id: agencyId } : {}),
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
) {
  const filter = agencyId
    ? `id=eq.${propertyId}&or=(submitted_by.eq.${userId},agency_id.eq.${agencyId})`
    : `id=eq.${propertyId}&submitted_by=eq.${userId}`;
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/properties?${filter}`,
    {
      method: "PATCH",
      headers: { ...headers, Prefer: "return=minimal" },
      body: JSON.stringify(payload),
    },
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw parseError(data, res);
  }
}

export async function deleteMyPropertyApi(userId: string, propertyId: string) {
  const res = await fetch(
    `${SUPABASE_URL}/rest/v1/properties?id=eq.${propertyId}&submitted_by=eq.${userId}`,
    { method: "DELETE", headers },
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw parseError(data, res);
  }
}

export async function uploadMyPropertyPhotoApi(propertyId: string, file: File) {
  const path = `${propertyId}/${crypto.randomUUID()}.jpg`;
  const { error } = await supabaseAdmin.storage.upload("property-photos", path, file);
  if (error) throw new Error(typeof error === "string" ? error : "Не удалось загрузить фото");
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

export async function updateMyProfileApi(userId: string, payload: Record<string, unknown>) {
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
