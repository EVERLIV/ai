import {
  SERVICE_ROLE_KEY,
  SUPABASE_URL,
  supabaseAdmin,
} from "@/integrations/supabase/adminClient";
import type {
  ConstructionStage,
  Developer,
  DeveloperAnalyticsEvent,
  DeveloperDocument,
  DeveloperProject,
  DeveloperSubtype,
  OutboundWebhook,
  ProjectMedia,
  ProjectPhase,
  ProjectUnitType,
} from "@/lib/developerTypes";
import {
  normalizeDeveloperSubtype,
  slugifyProjectTitle,
} from "@/lib/developerTypes";
import { resolveDeveloperProjectKind } from "@/lib/developerListingRules";

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
  }
  return new Error(`HTTP ${res.status}`);
}

async function restGet<T>(path: string): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw parseError(data, res);
  return data as T;
}

async function restMutate<T>(
  path: string,
  method: "POST" | "PATCH" | "DELETE",
  body?: unknown,
  prefer = "return=representation",
): Promise<T> {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: { ...headers, Prefer: prefer },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (method === "DELETE" && res.ok) return null as T;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw parseError(data, res);
  return data as T;
}

// ── Org ──────────────────────────────────────────────────────────────

export async function fetchMyDeveloperApi(
  userId: string,
): Promise<Developer | null> {
  const membership = await restGet<
    { developer_id: string; role: string }[]
  >(
    `developer_members?user_id=eq.${encodeURIComponent(userId)}&select=developer_id,role&limit=1`,
  );
  if (!membership?.[0]?.developer_id) return null;
  const rows = await restGet<Developer[]>(
    `developers?id=eq.${encodeURIComponent(membership[0].developer_id)}&select=*&limit=1`,
  );
  return rows?.[0] ?? null;
}

export async function updateDeveloperApi(
  developerId: string,
  patch: Partial<Developer>,
): Promise<Developer> {
  const rows = await restMutate<Developer[]>(
    `developers?id=eq.${encodeURIComponent(developerId)}`,
    "PATCH",
    patch,
  );
  return Array.isArray(rows) ? rows[0] : rows;
}

function toPublicStorageUrl(url: string): string {
  return url.replace(
    /\/storage\/v1\/object\/(?!public\/)/,
    "/storage/v1/object/public/",
  );
}

/** Логотип застройщика — тот же bucket, что у агентств (service_role). */
export async function uploadDeveloperAssetApi(
  developerId: string,
  file: File,
): Promise<string> {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `developers/${developerId}/logo/${crypto.randomUUID()}.${ext}`;
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

export async function requestDeveloperVerificationApi(
  developerId: string,
): Promise<Developer> {
  return updateDeveloperApi(developerId, {
    verification_status: "pending",
  } as Partial<Developer>);
}

export async function adminSetDeveloperVerificationApi(
  developerId: string,
  status: "verified" | "rejected",
  adminUserId: string,
): Promise<Developer> {
  return updateDeveloperApi(developerId, {
    verification_status: status,
    verified_at: status === "verified" ? new Date().toISOString() : null,
    verified_by: status === "verified" ? adminUserId : null,
  } as Partial<Developer>);
}

export async function fetchVerifiedDevelopersApi(params?: {
  subtype?: DeveloperSubtype | null;
  q?: string | null;
  limit?: number;
  offset?: number;
}): Promise<Developer[]> {
  const limit = params?.limit ?? 40;
  const offset = params?.offset ?? 0;
  const parts = [
    "verification_status=eq.verified",
    "select=*",
    "order=name.asc",
    `limit=${limit}`,
    `offset=${offset}`,
  ];
  if (params?.subtype) {
    parts.push(`subtype=eq.${encodeURIComponent(params.subtype)}`);
  }
  if (params?.q?.trim()) {
    parts.push(`or=(name.ilike.*${encodeURIComponent(params.q.trim())}*,city.ilike.*${encodeURIComponent(params.q.trim())}*)`);
  }
  return restGet<Developer[]>(`developers?${parts.join("&")}`);
}

export async function fetchDeveloperByIdApi(
  id: string,
): Promise<Developer | null> {
  const rows = await restGet<Developer[]>(
    `developers?id=eq.${encodeURIComponent(id)}&select=*&limit=1`,
  );
  return rows?.[0] ?? null;
}

export async function fetchAllDevelopersAdminApi(): Promise<Developer[]> {
  return restGet<Developer[]>(
    `developers?select=*&order=created_at.desc&limit=500`,
  );
}

export async function fetchDeveloperPropertiesApi(
  developerId: string,
  projectId?: string | null,
): Promise<Record<string, unknown>[]> {
  const parts = [
    `developer_id=eq.${encodeURIComponent(developerId)}`,
    "moderation_status=eq.published",
    "is_active=eq.true",
    "select=*",
    "order=area.asc",
  ];
  if (projectId) {
    parts.push(`developer_project_id=eq.${encodeURIComponent(projectId)}`);
  }
  try {
    return await restGet<Record<string, unknown>[]>(
      `properties?${parts.join("&")}`,
    );
  } catch (err) {
    if (
      err instanceof Error &&
      /developer_id|does not exist/i.test(err.message)
    ) {
      return [];
    }
    throw err;
  }
}

// ── Projects ─────────────────────────────────────────────────────────

export async function fetchDeveloperProjectsApi(
  developerId: string,
  opts?: { includeDrafts?: boolean },
): Promise<DeveloperProject[]> {
  const parts = [
    `developer_id=eq.${encodeURIComponent(developerId)}`,
    "select=*",
    "order=created_at.desc",
  ];
  if (!opts?.includeDrafts) {
    parts.push("is_published=eq.true");
    parts.push("moderation_status=eq.published");
  }
  return restGet<DeveloperProject[]>(`developer_projects?${parts.join("&")}`);
}

export async function fetchPublicProjectsApi(params?: {
  subtype?: DeveloperSubtype | null;
  status?: string | null;
  q?: string | null;
  material?: string | null;
  limit?: number;
  offset?: number;
}): Promise<(DeveloperProject & { developers?: Developer | Developer[] })[]> {
  const limit = params?.limit ?? 40;
  const offset = params?.offset ?? 0;
  const parts = [
    "is_published=eq.true",
    "moderation_status=eq.published",
    "select=*,developers(*)",
    "order=created_at.desc",
    `limit=${limit}`,
    `offset=${offset}`,
  ];
  if (params?.status) {
    parts.push(`status=eq.${encodeURIComponent(params.status)}`);
  }
  if (params?.material?.trim()) {
    parts.push(`material=ilike.*${encodeURIComponent(params.material.trim())}*`);
  }
  if (params?.q?.trim()) {
    const q = encodeURIComponent(params.q.trim());
    parts.push(`or=(title.ilike.*${q}*,address.ilike.*${q}*,district.ilike.*${q}*)`);
  }
  const rows = await restGet<
    (DeveloperProject & { developers?: Developer | Developer[] })[]
  >(`developer_projects?${parts.join("&")}`);
  if (!params?.subtype) return rows;
  return rows.filter((p) => {
    const d = Array.isArray(p.developers) ? p.developers[0] : p.developers;
    return d?.subtype === params.subtype;
  });
}

export async function fetchProjectByIdApi(
  id: string,
): Promise<
  (DeveloperProject & { developers?: Developer | Developer[] }) | null
> {
  const rows = await restGet<
    (DeveloperProject & { developers?: Developer | Developer[] })[]
  >(
    `developer_projects?id=eq.${encodeURIComponent(id)}&select=*,developers(*)&limit=1`,
  );
  return rows?.[0] ?? null;
}

export async function createDeveloperProjectApi(input: {
  developer_id: string;
  title: string;
  subtype?: DeveloperSubtype;
  project_kind?: DeveloperProject["project_kind"];
  status?: DeveloperProject["status"];
  housing_class?: string;
  material?: string;
  delivery_quarter?: number | null;
  delivery_year?: number | null;
  address?: string;
  district?: string;
  description?: string;
  cover_photo?: string | null;
  mortgage_terms?: string;
  installment_terms?: string;
}): Promise<DeveloperProject> {
  const kind = resolveDeveloperProjectKind(
    normalizeDeveloperSubtype(input.subtype || "apartment_developer"),
    input.project_kind,
  );
  const slug = `${slugifyProjectTitle(input.title)}-${Date.now().toString(36)}`;
  const rows = await restMutate<DeveloperProject[]>(
    "developer_projects",
    "POST",
    {
      developer_id: input.developer_id,
      title: input.title.trim(),
      slug,
      project_kind: kind,
      status: input.status || "planned",
      housing_class: input.housing_class || "",
      material: input.material || "",
      delivery_quarter: input.delivery_quarter ?? null,
      delivery_year: input.delivery_year ?? null,
      address: input.address || "",
      district: input.district || "",
      description: input.description || "",
      cover_photo: input.cover_photo || null,
      mortgage_terms: input.mortgage_terms || "",
      installment_terms: input.installment_terms || "",
      is_published: false,
      moderation_status: "draft",
    },
  );
  return Array.isArray(rows) ? rows[0] : rows;
}

export async function updateDeveloperProjectApi(
  projectId: string,
  patch: Partial<DeveloperProject>,
): Promise<DeveloperProject> {
  const { project_kind: _dropKind, ...safePatch } = patch;
  const rows = await restMutate<DeveloperProject[]>(
    `developer_projects?id=eq.${encodeURIComponent(projectId)}`,
    "PATCH",
    safePatch,
  );
  return Array.isArray(rows) ? rows[0] : rows;
}

export async function publishDeveloperProjectApi(
  projectId: string,
): Promise<DeveloperProject> {
  return updateDeveloperProjectApi(projectId, {
    is_published: true,
    moderation_status: "published",
  });
}

export async function deleteDeveloperProjectApi(
  projectId: string,
): Promise<void> {
  await restMutate(
    `developer_projects?id=eq.${encodeURIComponent(projectId)}`,
    "DELETE",
    undefined,
    "return=minimal",
  );
}

// ── Unit types ───────────────────────────────────────────────────────

export async function fetchUnitTypesApi(
  projectId: string,
): Promise<ProjectUnitType[]> {
  return restGet<ProjectUnitType[]>(
    `project_unit_types?project_id=eq.${encodeURIComponent(projectId)}&select=*&order=price_from.asc.nullslast`,
  );
}

export async function fetchUnitTypeByIdApi(
  id: string,
): Promise<ProjectUnitType | null> {
  const rows = await restGet<ProjectUnitType[]>(
    `project_unit_types?id=eq.${encodeURIComponent(id)}&select=*&limit=1`,
  );
  return rows?.[0] ?? null;
}

export async function createUnitTypeApi(
  input: Partial<ProjectUnitType> & { project_id: string; title: string },
): Promise<ProjectUnitType> {
  const rows = await restMutate<ProjectUnitType[]>("project_unit_types", "POST", {
    project_id: input.project_id,
    title: input.title,
    rooms: input.rooms || "",
    area_from: input.area_from ?? null,
    area_to: input.area_to ?? null,
    floors: input.floors || "",
    price_from: input.price_from ?? null,
    price_to: input.price_to ?? null,
    plan_image_url: input.plan_image_url || null,
    extras: input.extras || {},
    is_active: input.is_active ?? true,
  });
  return Array.isArray(rows) ? rows[0] : rows;
}

export async function updateUnitTypeApi(
  id: string,
  patch: Partial<ProjectUnitType>,
): Promise<ProjectUnitType> {
  const rows = await restMutate<ProjectUnitType[]>(
    `project_unit_types?id=eq.${encodeURIComponent(id)}`,
    "PATCH",
    patch,
  );
  return Array.isArray(rows) ? rows[0] : rows;
}

export async function deleteUnitTypeApi(id: string): Promise<void> {
  await restMutate(
    `project_unit_types?id=eq.${encodeURIComponent(id)}`,
    "DELETE",
    undefined,
    "return=minimal",
  );
}

// ── Phases ───────────────────────────────────────────────────────────

export async function fetchPhasesApi(
  projectId: string,
): Promise<ProjectPhase[]> {
  return restGet<ProjectPhase[]>(
    `project_phases?project_id=eq.${encodeURIComponent(projectId)}&select=*&order=sort_order.asc`,
  );
}

export async function createPhaseApi(
  input: Partial<ProjectPhase> & { project_id: string; name: string },
): Promise<ProjectPhase> {
  const rows = await restMutate<ProjectPhase[]>("project_phases", "POST", {
    project_id: input.project_id,
    name: input.name,
    sort_order: input.sort_order ?? 0,
    delivery_quarter: input.delivery_quarter ?? null,
    delivery_year: input.delivery_year ?? null,
    status: input.status || "planned",
  });
  return Array.isArray(rows) ? rows[0] : rows;
}

export async function updatePhaseApi(
  id: string,
  patch: Partial<ProjectPhase>,
): Promise<ProjectPhase> {
  const rows = await restMutate<ProjectPhase[]>(
    `project_phases?id=eq.${encodeURIComponent(id)}`,
    "PATCH",
    patch,
  );
  return Array.isArray(rows) ? rows[0] : rows;
}

export async function deletePhaseApi(id: string): Promise<void> {
  await restMutate(
    `project_phases?id=eq.${encodeURIComponent(id)}`,
    "DELETE",
    undefined,
    "return=minimal",
  );
}

// ── Construction stages ──────────────────────────────────────────────

export async function fetchConstructionStagesApi(
  projectId: string,
  opts?: { publishedOnly?: boolean },
): Promise<ConstructionStage[]> {
  const parts = [
    `project_id=eq.${encodeURIComponent(projectId)}`,
    "select=*",
    "order=sort_order.asc",
  ];
  if (opts?.publishedOnly) parts.push("is_published=eq.true");
  return restGet<ConstructionStage[]>(
    `construction_stages?${parts.join("&")}`,
  );
}

export async function createConstructionStageApi(
  input: Partial<ConstructionStage> & { project_id: string; title: string },
): Promise<ConstructionStage> {
  const rows = await restMutate<ConstructionStage[]>(
    "construction_stages",
    "POST",
    {
      project_id: input.project_id,
      title: input.title,
      stage_date: input.stage_date || null,
      description: input.description || "",
      sort_order: input.sort_order ?? 0,
      is_published: input.is_published ?? false,
    },
  );
  return Array.isArray(rows) ? rows[0] : rows;
}

export async function updateConstructionStageApi(
  id: string,
  patch: Partial<ConstructionStage>,
): Promise<ConstructionStage> {
  const rows = await restMutate<ConstructionStage[]>(
    `construction_stages?id=eq.${encodeURIComponent(id)}`,
    "PATCH",
    patch,
  );
  return Array.isArray(rows) ? rows[0] : rows;
}

export async function deleteConstructionStageApi(id: string): Promise<void> {
  await restMutate(
    `construction_stages?id=eq.${encodeURIComponent(id)}`,
    "DELETE",
    undefined,
    "return=minimal",
  );
}

// ── Media ────────────────────────────────────────────────────────────

export async function fetchProjectMediaApi(
  projectId: string,
): Promise<ProjectMedia[]> {
  return restGet<ProjectMedia[]>(
    `project_media?project_id=eq.${encodeURIComponent(projectId)}&select=*&order=sort_order.asc`,
  );
}

export async function createProjectMediaApi(
  input: Partial<ProjectMedia> & { project_id: string; url: string },
): Promise<ProjectMedia> {
  const rows = await restMutate<ProjectMedia[]>("project_media", "POST", {
    project_id: input.project_id,
    stage_id: input.stage_id || null,
    kind: input.kind || "photo",
    url: input.url,
    caption: input.caption || "",
    sort_order: input.sort_order ?? 0,
  });
  return Array.isArray(rows) ? rows[0] : rows;
}

export async function deleteProjectMediaApi(id: string): Promise<void> {
  await restMutate(
    `project_media?id=eq.${encodeURIComponent(id)}`,
    "DELETE",
    undefined,
    "return=minimal",
  );
}

// ── Documents ────────────────────────────────────────────────────────

export async function fetchDeveloperDocumentsApi(
  developerId: string,
): Promise<DeveloperDocument[]> {
  return restGet<DeveloperDocument[]>(
    `developer_documents?developer_id=eq.${encodeURIComponent(developerId)}&select=*&order=created_at.desc`,
  );
}

export async function createDeveloperDocumentApi(
  input: Partial<DeveloperDocument> & {
    developer_id: string;
    title: string;
    file_url: string;
  },
): Promise<DeveloperDocument> {
  const rows = await restMutate<DeveloperDocument[]>(
    "developer_documents",
    "POST",
    {
      developer_id: input.developer_id,
      doc_type: input.doc_type || "license",
      title: input.title,
      file_url: input.file_url,
      issued_at: input.issued_at || null,
      expires_at: input.expires_at || null,
      status: "pending",
    },
  );
  return Array.isArray(rows) ? rows[0] : rows;
}

export async function reviewDeveloperDocumentApi(
  id: string,
  status: "approved" | "rejected",
  adminUserId: string,
): Promise<DeveloperDocument> {
  const rows = await restMutate<DeveloperDocument[]>(
    `developer_documents?id=eq.${encodeURIComponent(id)}`,
    "PATCH",
    {
      status,
      reviewed_by: adminUserId,
      reviewed_at: new Date().toISOString(),
    },
  );
  return Array.isArray(rows) ? rows[0] : rows;
}

// ── Analytics ────────────────────────────────────────────────────────

export async function trackDeveloperEventApi(
  event: DeveloperAnalyticsEvent,
): Promise<void> {
  try {
    await restMutate(
      "developer_analytics_events",
      "POST",
      {
        event_type: event.event_type,
        developer_id: event.developer_id || null,
        project_id: event.project_id || null,
        unit_type_id: event.unit_type_id || null,
        property_id: event.property_id || null,
        actor_id: event.actor_id || null,
        session_id: event.session_id || null,
        source_page: event.source_page || "",
        payload: event.payload || {},
      },
      "return=minimal",
    );
  } catch (e) {
    console.warn("developer analytics:", e);
  }
}

export async function fetchDeveloperEventStatsApi(
  developerId: string,
): Promise<{ event_type: string; count: number }[]> {
  const rows = await restGet<
    { event_type: string; id: number }[]
  >(
    `developer_analytics_events?developer_id=eq.${encodeURIComponent(developerId)}&select=event_type,id&order=occurred_at.desc&limit=2000`,
  );
  const map = new Map<string, number>();
  for (const r of rows || []) {
    map.set(r.event_type, (map.get(r.event_type) || 0) + 1);
  }
  return [...map.entries()].map(([event_type, count]) => ({
    event_type,
    count,
  }));
}

// ── Webhooks ─────────────────────────────────────────────────────────

export async function fetchOutboundWebhooksApi(
  developerId: string,
): Promise<OutboundWebhook[]> {
  return restGet<OutboundWebhook[]>(
    `outbound_webhooks?developer_id=eq.${encodeURIComponent(developerId)}&select=*&order=created_at.desc`,
  );
}

export async function createOutboundWebhookApi(input: {
  developer_id: string;
  url: string;
  secret?: string;
  events?: string[];
}): Promise<OutboundWebhook> {
  const rows = await restMutate<OutboundWebhook[]>(
    "outbound_webhooks",
    "POST",
    {
      developer_id: input.developer_id,
      url: input.url,
      secret: input.secret || "",
      events: input.events || ["lead_submit", "view_project"],
      is_active: true,
    },
  );
  return Array.isArray(rows) ? rows[0] : rows;
}

export async function deleteOutboundWebhookApi(id: string): Promise<void> {
  await restMutate(
    `outbound_webhooks?id=eq.${encodeURIComponent(id)}`,
    "DELETE",
    undefined,
    "return=minimal",
  );
}
