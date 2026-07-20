import { getLandUse, isLandProperty, LAND_TYPE_LABEL } from "@/lib/propertyLand";
import { isSaleDeal } from "@/lib/propertyDeal";

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
  cadastral_number?: string;
  land_use?: string;
};

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
    min_term: displayValue(e.min_term || (property.contract_term ? `от ${property.contract_term}` : "")),
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
    showAgent: !!(e.agent_name?.trim() || e.agent_company?.trim()),
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
