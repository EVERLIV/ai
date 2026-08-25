/** Типы раздела «Застройщики» */

export type DeveloperSubtype =
  | "apartment_developer"
  | "frame_house_builder";

export type DeveloperMemberRole = "owner" | "admin" | "member";

export type DeveloperVerificationStatus =
  | "unverified"
  | "pending"
  | "verified"
  | "rejected";

export type DeveloperProjectKind =
  | "residential_complex"
  | "house_series";

export type DeveloperProjectStatus =
  | "planned"
  | "under_construction"
  | "completed";

export type DeveloperMediaKind = "photo" | "plan" | "render" | "progress";

export type DeveloperDocStatus = "pending" | "approved" | "rejected";

export type PropertyModerationStatus =
  | "draft"
  | "on_moderation"
  | "published"
  | "rejected"
  | "cancelled";

export const DEVELOPER_SUBTYPE_LABELS: Record<DeveloperSubtype, string> = {
  apartment_developer: "Многоквартирные дома / ЖК",
  frame_house_builder: "Деревянные и каркасные дома",
};

export const DEVELOPER_PROJECT_STATUS_LABELS: Record<
  DeveloperProjectStatus,
  string
> = {
  planned: "В проекте",
  under_construction: "Строится",
  completed: "Сдан",
};

export const DEVELOPER_PROJECT_KIND_LABELS: Record<
  DeveloperProjectKind,
  string
> = {
  residential_complex: "Жилой комплекс",
  house_series: "Серия домов",
};

export function normalizeDeveloperSubtype(
  value: string | null | undefined,
): DeveloperSubtype {
  const v = (value || "").trim().toLowerCase();
  if (v === "frame_house_builder" || v === "frame" || v === "дерево") {
    return "frame_house_builder";
  }
  return "apartment_developer";
}

export function defaultProjectKindForSubtype(
  subtype: DeveloperSubtype,
): DeveloperProjectKind {
  return subtype === "frame_house_builder"
    ? "house_series"
    : "residential_complex";
}

export function slugifyProjectTitle(title: string): string {
  const map: Record<string, string> = {
    а: "a",
    б: "b",
    в: "v",
    г: "g",
    д: "d",
    е: "e",
    ё: "e",
    ж: "zh",
    з: "z",
    и: "i",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "h",
    ц: "ts",
    ч: "ch",
    ш: "sh",
    щ: "sch",
    ъ: "",
    ы: "y",
    ь: "",
    э: "e",
    ю: "yu",
    я: "ya",
  };
  return title
    .toLowerCase()
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export type DeveloperPromotion = {
  title: string;
  text?: string;
  badge?: string;
};

export type Developer = {
  id: string;
  name: string;
  logo_url: string | null;
  about: string;
  subtype: DeveloperSubtype;
  city: string;
  region: string;
  inn: string | null;
  phone: string;
  website: string | null;
  verification_status: DeveloperVerificationStatus;
  verification_requested_at: string | null;
  verified_at: string | null;
  verified_by: string | null;
  avg_rating?: number | null;
  reviews_count?: number;
  promotions?: DeveloperPromotion[] | unknown;
  created_at: string;
  updated_at: string;
};

export function parseDeveloperPromotions(
  value: Developer["promotions"],
): DeveloperPromotion[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      const title = typeof o.title === "string" ? o.title.trim() : "";
      if (!title) return null;
      return {
        title,
        text: typeof o.text === "string" ? o.text : "",
        badge: typeof o.badge === "string" ? o.badge : "Акция",
      };
    })
    .filter((x): x is DeveloperPromotion => !!x);
}

export type DeveloperMember = {
  developer_id: string;
  user_id: string;
  role: DeveloperMemberRole;
  created_at: string;
};

export type DeveloperProject = {
  id: string;
  developer_id: string;
  title: string;
  slug: string | null;
  project_kind: DeveloperProjectKind;
  status: DeveloperProjectStatus;
  housing_class: string;
  material: string;
  delivery_quarter: number | null;
  delivery_year: number | null;
  address: string;
  district: string;
  lat: number | null;
  lng: number | null;
  description: string;
  cover_photo: string | null;
  mortgage_terms: string;
  installment_terms: string;
  features: string[] | unknown;
  is_published: boolean;
  moderation_status: PropertyModerationStatus;
  views_count: number;
  created_at: string;
  updated_at: string;
};

export type ProjectPhase = {
  id: string;
  project_id: string;
  name: string;
  sort_order: number;
  delivery_quarter: number | null;
  delivery_year: number | null;
  status: DeveloperProjectStatus;
  created_at: string;
  updated_at: string;
};

export type ProjectUnitType = {
  id: string;
  project_id: string;
  title: string;
  rooms: string;
  area_from: number | null;
  area_to: number | null;
  floors: string;
  price_from: number | null;
  price_to: number | null;
  plan_image_url: string | null;
  extras: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type ConstructionStage = {
  id: string;
  project_id: string;
  title: string;
  stage_date: string | null;
  description: string;
  sort_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type ProjectMedia = {
  id: string;
  project_id: string;
  stage_id: string | null;
  kind: DeveloperMediaKind;
  url: string;
  caption: string;
  sort_order: number;
  created_at: string;
};

export type DeveloperDocument = {
  id: string;
  developer_id: string;
  doc_type: string;
  title: string;
  file_url: string;
  issued_at: string | null;
  expires_at: string | null;
  status: DeveloperDocStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type DeveloperAnalyticsEvent = {
  event_type: string;
  developer_id?: string | null;
  project_id?: string | null;
  unit_type_id?: string | null;
  property_id?: string | null;
  actor_id?: string | null;
  session_id?: string | null;
  source_page?: string;
  payload?: Record<string, unknown>;
};

export type OutboundWebhook = {
  id: string;
  developer_id: string;
  url: string;
  secret: string;
  events: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
};
