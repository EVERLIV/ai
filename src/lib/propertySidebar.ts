import { ACCOUNT_TYPE_LABELS } from "@/hooks/useProfile";
import { isSaleDeal } from "@/lib/propertyDeal";
import {
  getLandUse,
  isLandProperty,
  LAND_TYPE_LABEL,
} from "@/lib/propertyLand";

export type PropertySidebarExtras = {
  entrance_group?: string;
  utilities_included?: string;
  vat?: string;
  indexation?: string;
  min_term?: string;
  pedestrian_traffic?: 1 | 2 | 3 | 4;
  metro_minutes?: string;
  transport_hub?: string;
  contract_form?: string;
  sublease?: string;
  landlord_type?: string;
  purpose?: string;
  agent_name?: string;
  agent_company?: string;
  agent_objects_count?: number;
  agent_rating?: number;
  agent_response_min?: number;
  agent_verified?: boolean;
  agent_avatar_url?: string;
  agent_account_type?: "owner" | "realtor" | "agency";
  agent_agency_about?: string;
  agent_phone?: string;
  agency_id?: string;
  listing_manager_id?: string;
  owner_user_id?: string;
  cadastral_number?: string;
  land_use?: string;
  property_types?: string[];
};

export type ListingAgentDisplay = {
  primaryLabel: string;
  secondaryLabel: string;
  avatarUrl: string | null;
  isVerified: boolean;
  isRealtor: boolean;
  isAgency: boolean;
  agencyId: string | null;
  managerId: string | null;
  objectsCount: number;
};

/** Данные собственника/агентства для карточки в каталоге (из extras объекта) */
export function getListingAgentDisplay(
  extras?: PropertySidebarExtras | Record<string, unknown> | null,
): ListingAgentDisplay | null {
  const e = (extras || {}) as PropertySidebarExtras;
  const name = e.agent_name?.trim() || "";
  const company = e.agent_company?.trim() || "";
  const hasAgent = !!(name || e.owner_user_id || e.agency_id);
  if (!hasAgent) return null;

  const isAgency =
    e.agent_account_type === "agency" ||
    e.agent_account_type === "realtor" ||
    !!e.agency_id ||
    (!e.owner_user_id && !!company);
  const isRealtor = isAgency;
  const hasAgencyBrand =
    isAgency && !!company && company !== "Риелтор" && company !== "Агентство";

  let primaryLabel: string;
  let secondaryLabel: string;

  if (hasAgencyBrand) {
    primaryLabel = company;
    secondaryLabel = name || ACCOUNT_TYPE_LABELS.agency;
  } else if (isAgency) {
    primaryLabel = name || company || ACCOUNT_TYPE_LABELS.agency;
    secondaryLabel = ACCOUNT_TYPE_LABELS.agency;
  } else {
    primaryLabel = name || ACCOUNT_TYPE_LABELS.owner;
    secondaryLabel = ACCOUNT_TYPE_LABELS.owner;
  }

  if (secondaryLabel === primaryLabel) {
    secondaryLabel = isAgency
      ? ACCOUNT_TYPE_LABELS.agency
      : ACCOUNT_TYPE_LABELS.owner;
  }

  return {
    primaryLabel,
    secondaryLabel,
    avatarUrl: e.agent_avatar_url?.trim() || null,
    isVerified: !!e.agent_verified,
    isRealtor,
    isAgency,
    agencyId: e.agency_id?.trim() || null,
    managerId: e.listing_manager_id?.trim() || null,
    objectsCount: e.agent_objects_count ?? 0,
  };
}

export type SidebarVisibility = {
  entrance: boolean;
  pedestrianTraffic: boolean;
  minTerm: boolean;
  indexation: boolean;
  contractForm: boolean;
  sublease: boolean;
  landlordLabel: string;
  purposeLabel: string;
};

export function getSidebarVisibility(
  type?: string | null,
  dealType?: string | null,
): SidebarVisibility {
  const isLand = isLandProperty(type);
  const isSale = isSaleDeal(dealType);

  return {
    entrance: !isLand,
    pedestrianTraffic: !isLand,
    minTerm: !isSale,
    indexation: !isSale,
    contractForm: !isSale,
    sublease: !isSale,
    landlordLabel: isSale ? "Продавец" : "Арендодатель",
    purposeLabel: isLand ? LAND_TYPE_LABEL : "Назначение",
  };
}

function displayValue(value?: string | null): string {
  const trimmed = value?.trim();
  return trimmed || "—";
}

/** Срок аренды без дублирования «от от …». */
function formatMinTerm(
  minTerm?: string,
  contractTerm?: string | null,
): string {
  const raw = minTerm?.trim() || contractTerm?.trim() || "";
  if (!raw) return "—";
  if (/^от\s/i.test(raw)) return raw;
  return `от ${raw}`;
}

export function resolveSidebarDisplay(property: {
  type?: string | null;
  deal_type?: string | null;
  district?: string | null;
  contract_term?: string | null;
  layout?: string | null;
  condition?: string | null;
  extras?: PropertySidebarExtras | Record<string, unknown> | null;
}) {
  const e = (property.extras || {}) as PropertySidebarExtras;
  const vis = getSidebarVisibility(property.type, property.deal_type);
  const isLand = isLandProperty(property.type);

  const purpose = isLand
    ? displayValue(getLandUse(property) || e.purpose)
    : displayValue(e.purpose);

  const pedestrian = e.pedestrian_traffic;
  const trafficLabel =
    pedestrian && pedestrian >= 1 && pedestrian <= 4
      ? ["Низкий", "Средний", "Высокий", "Очень высокий"][pedestrian - 1]
      : "—";

  return {
    vis,
    entrance_group: displayValue(e.entrance_group),
    utilities_included: displayValue(e.utilities_included),
    utilitiesAccent: (e.utilities_included || "").toLowerCase() === "включены",
    vat: displayValue(e.vat),
    indexation: displayValue(e.indexation),
    min_term: formatMinTerm(e.min_term, property.contract_term),
    pedestrian_traffic: pedestrian,
    trafficLabel,
    metro_minutes: displayValue(e.metro_minutes),
    district: displayValue(property.district),
    transport_hub: displayValue(e.transport_hub),
    contract_form: displayValue(e.contract_form),
    landlord_type: displayValue(e.landlord_type),
    sublease: displayValue(e.sublease),
    purpose,
    agent_name: displayValue(e.agent_name),
    agent_company: displayValue(e.agent_company),
    agent_objects_count: e.agent_objects_count ?? 0,
    agent_rating: e.agent_rating ?? 0,
    agent_response_min: e.agent_response_min ?? 0,
    agent_verified: !!e.agent_verified,
    agent_avatar_url: e.agent_avatar_url || "",
    agent_account_type:
      e.agent_account_type === "agency" || e.agent_account_type === "realtor"
        ? e.agent_account_type
        : "owner",
    agent_agency_about: e.agent_agency_about?.trim() || "",
    agency_id: typeof e.agency_id === "string" ? e.agency_id : "",
    listing_manager_id:
      typeof e.listing_manager_id === "string" ? e.listing_manager_id : "",
    owner_user_id: typeof e.owner_user_id === "string" ? e.owner_user_id : "",
    showAgent: !!(
      e.agent_name?.trim() ||
      e.agent_company?.trim() ||
      e.owner_user_id ||
      e.agency_id
    ),
  };
}

/** Очистка полей сайдбара, неактуальных для типа/сделки */
export function sanitizeSidebarExtras(
  extras: PropertySidebarExtras,
  type: string,
  dealType: string,
): PropertySidebarExtras {
  const next = { ...extras };
  const vis = getSidebarVisibility(type, dealType);

  if (!vis.entrance) delete next.entrance_group;
  if (!vis.pedestrianTraffic) delete next.pedestrian_traffic;
  if (!vis.minTerm) delete next.min_term;
  if (!vis.indexation) delete next.indexation;
  if (!vis.contractForm) delete next.contract_form;
  if (!vis.sublease) delete next.sublease;

  return next;
}
