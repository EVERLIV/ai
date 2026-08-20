import type { MyProperty } from "@/hooks/useMyProperties";
import type { RequestType } from "@/lib/propertyModeration";
import { isLandProperty } from "@/lib/propertyLand";
import { getPropertyTypes, syncPropertyTypesPayload, normalizePropertyTypes } from "@/lib/propertyTypes";
import type { PropertySegment } from "@/config/propertySegments";
import { getPropertySegment } from "@/lib/propertyTypes";
import { RESIDENTIAL_EXTRAS_KEYS } from "@/lib/propertyResidential";

export interface PropertyFormState {
  segment: PropertySegment;
  types: string[];
  class: string;
  deal_type: string;
  area: number;
  price: number;
  description: string;
  address: string;
  district: string;
  floor: string;
  total_floors: number;
  ceiling_height: number;
  parking: string;
  condition: string;
  layout: string;
  deposit: string;
  contract_term: string;
  cadastral_number: string;
  land_use: string;
  features: string[];
  request_type: RequestType;
  utilities_included: string;
  vat: string;
  indexation: string;
  min_term: string;
  contract_form: string;
  landlord_type: string;
  sublease: string;
  pedestrian_traffic: number | undefined;
  metro_minutes: string;
  transport_hub: string;
  entrance_group: string;
  purpose: string;
  rooms: string;
  building_type: string;
  year_built: string;
  balcony: string;
  furniture: string;
  bathroom: string;
  market: string;
  window_view: string;
  living_area: string;
  kitchen_area: string;
  mortgage: boolean;
  pets_allowed: boolean;
  children_allowed: boolean;
}

export function propertyToFormState(property: MyProperty): PropertyFormState {
  const e = (property.extras || {}) as Record<string, unknown>;
  const isLand = isLandProperty(property);

  return {
    segment: getPropertySegment(property),
    types: getPropertyTypes(property),
    class: property.class,
    deal_type: property.deal_type,
    area: Number(property.area) || 0,
    price: Number(property.price) || 0,
    description: property.description || "",
    address: property.address || "",
    district: property.district || "Кировский",
    floor: property.floor || "1",
    total_floors: property.total_floors || 1,
    ceiling_height: Number(property.ceiling_height) || 3,
    parking: property.parking || "Нет",
    condition: property.condition || "Хороший ремонт",
    layout: property.layout || "Open-space",
    deposit: property.deposit || "1 месяц",
    contract_term: property.contract_term || "1 год",
    cadastral_number: isLand ? String(e.cadastral_number || "") : "",
    land_use: isLand ? String(e.land_use || property.layout || "") : "",
    features: property.features || [],
    request_type: (property.request_type as RequestType) || "free_listing",
    utilities_included: String(e.utilities_included || ""),
    vat: String(e.vat || ""),
    indexation: String(e.indexation || ""),
    min_term: String(e.min_term || ""),
    contract_form: String(e.contract_form || ""),
    landlord_type: String(e.landlord_type || "Собственник"),
    sublease: String(e.sublease || ""),
    pedestrian_traffic: typeof e.pedestrian_traffic === "number" ? e.pedestrian_traffic : undefined,
    metro_minutes: String(e.metro_minutes || ""),
    transport_hub: String(e.transport_hub || ""),
    entrance_group: String(e.entrance_group || ""),
    purpose: String(e.purpose || ""),
    rooms: String(e[RESIDENTIAL_EXTRAS_KEYS.rooms] || ""),
    building_type: String(e[RESIDENTIAL_EXTRAS_KEYS.buildingType] || ""),
    year_built: String(e[RESIDENTIAL_EXTRAS_KEYS.yearBuilt] || ""),
    balcony: String(e[RESIDENTIAL_EXTRAS_KEYS.balcony] || ""),
    furniture: String(e[RESIDENTIAL_EXTRAS_KEYS.furniture] || ""),
    bathroom: String(e[RESIDENTIAL_EXTRAS_KEYS.bathroom] || ""),
    market: String(e[RESIDENTIAL_EXTRAS_KEYS.market] || (property.type === "Новостройка" ? "Новостройка" : "")),
    window_view: String(e[RESIDENTIAL_EXTRAS_KEYS.windowView] || ""),
    living_area: String(e[RESIDENTIAL_EXTRAS_KEYS.livingArea] || ""),
    kitchen_area: String(e[RESIDENTIAL_EXTRAS_KEYS.kitchenArea] || ""),
    mortgage: Boolean(e[RESIDENTIAL_EXTRAS_KEYS.mortgage]),
    pets_allowed: Boolean(e[RESIDENTIAL_EXTRAS_KEYS.petsAllowed]),
    children_allowed: Boolean(e[RESIDENTIAL_EXTRAS_KEYS.childrenAllowed]),
  };
}

export function buildPropertyPayload(
  form: PropertyFormState,
  userId: string,
  options: { isSale: boolean; isLand: boolean; isEdit?: boolean; resubmit?: boolean },
) {
  const landExtras = options.isLand
    ? { cadastral_number: form.cadastral_number.trim(), land_use: form.land_use }
    : {};

  const rentExtras = !options.isSale ? {
    utilities_included: form.utilities_included || undefined,
    vat: form.vat || undefined,
    indexation: form.indexation || undefined,
    min_term: form.min_term || form.contract_term || undefined,
    contract_form: form.contract_form || undefined,
    sublease: form.sublease || undefined,
    pedestrian_traffic: form.pedestrian_traffic as 1 | 2 | 3 | 4 | undefined,
    metro_minutes: form.metro_minutes || undefined,
    transport_hub: form.transport_hub || undefined,
  } : {};

  const commonExtras = {
    landlord_type: form.landlord_type || undefined,
    entrance_group: form.entrance_group || undefined,
    purpose: form.purpose || undefined,
  };

  const residentialExtras = form.segment === "residential"
    ? {
        [RESIDENTIAL_EXTRAS_KEYS.rooms]: form.rooms || undefined,
        [RESIDENTIAL_EXTRAS_KEYS.buildingType]: form.building_type || undefined,
        [RESIDENTIAL_EXTRAS_KEYS.yearBuilt]: form.year_built ? Number(form.year_built) : undefined,
        [RESIDENTIAL_EXTRAS_KEYS.balcony]: form.balcony || undefined,
        [RESIDENTIAL_EXTRAS_KEYS.furniture]: form.furniture || undefined,
        [RESIDENTIAL_EXTRAS_KEYS.bathroom]: form.bathroom || undefined,
        [RESIDENTIAL_EXTRAS_KEYS.market]: form.market || undefined,
        [RESIDENTIAL_EXTRAS_KEYS.windowView]: form.window_view || undefined,
        [RESIDENTIAL_EXTRAS_KEYS.livingArea]: form.living_area ? Number(form.living_area) : undefined,
        [RESIDENTIAL_EXTRAS_KEYS.kitchenArea]: form.kitchen_area ? Number(form.kitchen_area) : undefined,
        [RESIDENTIAL_EXTRAS_KEYS.mortgage]: form.mortgage || undefined,
        [RESIDENTIAL_EXTRAS_KEYS.petsAllowed]: form.pets_allowed || undefined,
        [RESIDENTIAL_EXTRAS_KEYS.childrenAllowed]: form.children_allowed || undefined,
      }
    : {};

  const types = normalizePropertyTypes(form.types);
  const { type: primaryType, extras: typesExtras } = syncPropertyTypesPayload(types, {
    ...landExtras,
    ...rentExtras,
    ...commonExtras,
    ...residentialExtras,
  }, form.segment);

  const base = {
    segment: form.segment,
    type: primaryType,
    class: form.class,
    area: form.area,
    price: form.price,
    price_per_m2: form.area > 0 ? Math.round(form.price / form.area) : 0,
    address: form.address.trim(),
    district: form.district,
    floor: options.isLand ? "-" : form.floor,
    total_floors: options.isLand ? 1 : form.total_floors,
    ceiling_height: options.isLand ? null : form.ceiling_height,
    parking: options.isLand ? "Нет" : form.parking,
    condition: options.isLand ? null : form.condition,
    layout: options.isLand ? (form.land_use || null) : form.layout,
    deal_type: form.deal_type,
    deposit: options.isSale ? null : form.deposit,
    contract_term: options.isSale ? null : form.contract_term,
    description: form.description,
    features: form.features,
    request_type: form.request_type,
    client_id: userId,
    extras: typesExtras,
  };

  if (options.isEdit) {
    if (options.resubmit) {
      return {
        ...base,
        moderation_status: "on_moderation" as const,
        is_active: false,
        rejection_reason: null,
      };
    }
    return base;
  }

  return {
    ...base,
    moderation_status: "on_moderation" as const,
    is_active: false,
    submitted_by: userId,
  };
}
