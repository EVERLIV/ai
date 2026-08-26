import type { PropertySegment } from "@/config/propertySegments";
import type { MyProperty } from "@/hooks/useMyProperties";
import { isDailyDeal, isLongTermRent, isSaleDeal } from "@/lib/propertyDeal";
import type { RequestType } from "@/lib/propertyModeration";
import { RESIDENTIAL_EXTRAS_KEYS } from "@/lib/propertyResidential";
import {
  findLocationByName,
  leafDistrictName,
  LOCATION_EXTRAS_KEY,
  toPropertyLocationExtras,
  type PropertyLocationExtras,
} from "@/lib/locations";
import {
  isAnyLand,
  isDwellingLike,
  isFlatLike,
  isHouseLike,
  isParkingLike,
} from "@/lib/propertyTypeFamilies";
import {
  buildMediaExtrasPatch,
  readPropertyMediaExtras,
} from "@/lib/propertyMedia";
import {
  getPropertySegment,
  getPropertyTypes,
  normalizePropertyTypes,
  syncPropertyTypesPayload,
} from "@/lib/propertyTypes";

function readLocationExtras(
  extras: Record<string, unknown>,
): PropertyLocationExtras | null {
  const raw = extras[LOCATION_EXTRAS_KEY];
  if (!raw || typeof raw !== "object") return null;
  const loc = raw as Partial<PropertyLocationExtras>;
  if (!loc.city || !Array.isArray(loc.path)) return null;
  return {
    region: String(loc.region || "Иркутская область"),
    city: String(loc.city),
    locality: loc.locality != null ? String(loc.locality) : null,
    kind: (loc.kind as PropertyLocationExtras["kind"]) || "city",
    path: loc.path.map(String),
    locationId: loc.locationId ? String(loc.locationId) : undefined,
  };
}

/** Синхронизация district (лист) ↔ extras.location */
export function syncLocationExtras(
  district: string,
  existingExtras: Record<string, unknown> = {},
): {
  district: string;
  location: PropertyLocationExtras | null;
} {
  const fromExtras = readLocationExtras(existingExtras);
  const leaf = findLocationByName(district);
  if (leaf) {
    const location = toPropertyLocationExtras(leaf);
    return { district: leafDistrictName(location), location };
  }
  if (fromExtras && leafDistrictName(fromExtras) === district.trim()) {
    return { district: district.trim(), location: fromExtras };
  }
  return { district: district.trim(), location: null };
}

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
  lat: number | null;
  lng: number | null;
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
  listing_manager_id: string;
  wood_config: string;
  wood_wall: string;
  wood_floors: string;
  wood_foundation: string;
  wood_roof: string;
  wood_finish: string;
  /** Ссылки VK Video */
  video_urls: string[];
  /** Планировка / план дома */
  plan_image_url: string;
  /** Привязка к проекту застройщика */
  developer_project_id: string;
  developer_unit_type_id: string;
}

export function propertyToFormState(property: MyProperty): PropertyFormState {
  const e = (property.extras || {}) as Record<string, unknown>;
  const typeSource = { type: property.type, extras: e };
  const land = isAnyLand(typeSource);

  return {
    segment: getPropertySegment({
      type: property.type,
      extras: e,
      segment: property.segment as PropertySegment | null,
    }),
    types: getPropertyTypes({ type: property.type, extras: e }),
    class: property.class,
    deal_type: property.deal_type,
    area: Number(property.area) || 0,
    price: Number(property.price) || 0,
    description: property.description || "",
    address: property.address || "",
    district:
      (() => {
        const loc = readLocationExtras(e);
        if (loc) return leafDistrictName(loc);
        return property.district || "Кировский";
      })(),
    lat:
      property.lat != null && Number.isFinite(Number(property.lat))
        ? Number(property.lat)
        : null,
    lng:
      property.lng != null && Number.isFinite(Number(property.lng))
        ? Number(property.lng)
        : null,
    floor: property.floor || "1",
    total_floors: property.total_floors || 1,
    ceiling_height: Number(property.ceiling_height) || 3,
    parking: property.parking || "Нет",
    condition: property.condition || "Хороший ремонт",
    layout: property.layout || "Open-space",
    deposit:
      property.deposit ||
      (isDailyDeal(property.deal_type) ? "По договорённости" : "1 месяц"),
    contract_term:
      property.contract_term ||
      (isDailyDeal(property.deal_type) ? "от 1 суток" : "1 год"),
    cadastral_number: land ? String(e.cadastral_number || "") : "",
    land_use: land ? String(e.land_use || property.layout || "") : "",
    features: property.features || [],
    request_type: (property.request_type as RequestType) || "free_listing",
    utilities_included: String(e.utilities_included || ""),
    vat: String(e.vat || ""),
    indexation: String(e.indexation || ""),
    min_term: String(e.min_term || ""),
    contract_form: String(e.contract_form || ""),
    landlord_type: String(e.landlord_type || "Собственник"),
    sublease: String(e.sublease || ""),
    pedestrian_traffic:
      typeof e.pedestrian_traffic === "number"
        ? e.pedestrian_traffic
        : undefined,
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
    market: String(
      e[RESIDENTIAL_EXTRAS_KEYS.market] ||
        (property.type === "Новостройка" ? "Новостройка" : ""),
    ),
    window_view: String(e[RESIDENTIAL_EXTRAS_KEYS.windowView] || ""),
    living_area: String(e[RESIDENTIAL_EXTRAS_KEYS.livingArea] || ""),
    kitchen_area: String(e[RESIDENTIAL_EXTRAS_KEYS.kitchenArea] || ""),
    mortgage: Boolean(e[RESIDENTIAL_EXTRAS_KEYS.mortgage]),
    pets_allowed: Boolean(e[RESIDENTIAL_EXTRAS_KEYS.petsAllowed]),
    children_allowed: Boolean(e[RESIDENTIAL_EXTRAS_KEYS.childrenAllowed]),
    listing_manager_id: property.listing_manager_id || "",
    wood_config: String(e[RESIDENTIAL_EXTRAS_KEYS.woodConfig] || ""),
    wood_wall: String(e[RESIDENTIAL_EXTRAS_KEYS.woodWall] || ""),
    wood_floors: String(e[RESIDENTIAL_EXTRAS_KEYS.woodFloors] || ""),
    wood_foundation: String(e[RESIDENTIAL_EXTRAS_KEYS.woodFoundation] || ""),
    wood_roof: String(e[RESIDENTIAL_EXTRAS_KEYS.woodRoof] || ""),
    wood_finish: String(e[RESIDENTIAL_EXTRAS_KEYS.woodFinish] || ""),
    video_urls: readPropertyMediaExtras(e).videoUrls,
    plan_image_url: readPropertyMediaExtras(e).planImageUrl || "",
    developer_project_id: property.developer_project_id || "",
    developer_unit_type_id: property.developer_unit_type_id || "",
  };
}

export function buildPropertyPayload(
  form: PropertyFormState,
  userId: string,
  options: {
    isSale: boolean;
    isLand: boolean;
    isEdit?: boolean;
    resubmit?: boolean;
  },
) {
  const isSale = options.isSale || isSaleDeal(form.deal_type);
  const isDaily = isDailyDeal(form.deal_type);
  const isLongRent = isLongTermRent(form.deal_type);
  const isCommercial = form.segment === "commercial";
  const isResidential = form.segment === "residential";
  const dwelling = isDwellingLike(form.types);
  const land = options.isLand || isAnyLand(form.types);

  const landExtras = land
    ? {
        cadastral_number: form.cadastral_number.trim(),
        land_use: form.land_use,
      }
    : {};

  // Коммерческие extras аренды (НДС, трафик…) — только долгосрочная коммерческая аренда
  const commercialRentExtras =
    isCommercial && isLongRent && !land
      ? {
          vat: form.vat || undefined,
          indexation: form.indexation || undefined,
          sublease: form.sublease || undefined,
          pedestrian_traffic: form.pedestrian_traffic as
            | 1
            | 2
            | 3
            | 4
            | undefined,
          metro_minutes: form.metro_minutes || undefined,
          transport_hub: form.transport_hub || undefined,
          entrance_group: form.entrance_group || undefined,
          purpose: form.purpose || undefined,
          contract_form: form.contract_form || undefined,
          min_term: form.min_term || form.contract_term || undefined,
        }
      : {};

  const rentExtras = !isSale
    ? {
        utilities_included: form.utilities_included || undefined,
        ...(isLongRent && isResidential
          ? {
              contract_form: form.contract_form || undefined,
              min_term: form.min_term || form.contract_term || undefined,
            }
          : {}),
        ...(isDaily
          ? {
              min_term: form.min_term || form.contract_term || undefined,
            }
          : {}),
        ...commercialRentExtras,
      }
    : {};

  const commonExtras = {
    landlord_type: form.landlord_type || undefined,
    ...(isCommercial && isSale && !land
      ? {
          purpose: form.purpose || undefined,
          entrance_group: form.entrance_group || undefined,
        }
      : {}),
  };

  const residentialExtras = isResidential
    ? {
        ...(dwelling || isParkingLike(form.types)
          ? {
              [RESIDENTIAL_EXTRAS_KEYS.rooms]: dwelling
                ? form.rooms || undefined
                : undefined,
              [RESIDENTIAL_EXTRAS_KEYS.buildingType]: dwelling
                ? form.building_type || undefined
                : undefined,
              [RESIDENTIAL_EXTRAS_KEYS.yearBuilt]:
                dwelling && form.year_built
                  ? Number(form.year_built)
                  : undefined,
              [RESIDENTIAL_EXTRAS_KEYS.balcony]:
                (isFlatLike(form.types) || isHouseLike(form.types)) &&
                form.balcony
                  ? form.balcony
                  : undefined,
              [RESIDENTIAL_EXTRAS_KEYS.furniture]: form.furniture || undefined,
              [RESIDENTIAL_EXTRAS_KEYS.bathroom]: dwelling
                ? form.bathroom || undefined
                : undefined,
              [RESIDENTIAL_EXTRAS_KEYS.windowView]: dwelling
                ? form.window_view || undefined
                : undefined,
              [RESIDENTIAL_EXTRAS_KEYS.livingArea]:
                dwelling && form.living_area
                  ? Number(form.living_area)
                  : undefined,
              [RESIDENTIAL_EXTRAS_KEYS.kitchenArea]:
                dwelling && form.kitchen_area
                  ? Number(form.kitchen_area)
                  : undefined,
              ...(isHouseLike(form.types)
                ? {
                    [RESIDENTIAL_EXTRAS_KEYS.woodConfig]:
                      form.wood_config || undefined,
                    [RESIDENTIAL_EXTRAS_KEYS.woodWall]:
                      form.wood_wall || undefined,
                    [RESIDENTIAL_EXTRAS_KEYS.woodFloors]:
                      form.wood_floors || undefined,
                    [RESIDENTIAL_EXTRAS_KEYS.woodFoundation]:
                      form.wood_foundation || undefined,
                    [RESIDENTIAL_EXTRAS_KEYS.woodRoof]:
                      form.wood_roof || undefined,
                    [RESIDENTIAL_EXTRAS_KEYS.woodFinish]:
                      form.wood_finish || undefined,
                  }
                : {}),
            }
          : {}),
        [RESIDENTIAL_EXTRAS_KEYS.market]: isSale
          ? form.market || undefined
          : undefined,
        [RESIDENTIAL_EXTRAS_KEYS.mortgage]:
          isSale && form.mortgage ? true : undefined,
        [RESIDENTIAL_EXTRAS_KEYS.petsAllowed]:
          !isSale && form.pets_allowed ? true : undefined,
        [RESIDENTIAL_EXTRAS_KEYS.childrenAllowed]:
          !isSale && form.children_allowed ? true : undefined,
      }
    : {};

  const { district: leafDistrict, location: locationExtras } =
    syncLocationExtras(form.district);

  const mediaExtras = buildMediaExtrasPatch({
    videoUrls: form.video_urls,
    planImageUrl: form.plan_image_url,
  });

  const types = normalizePropertyTypes(form.types);
  const { type: primaryType, extras: typesExtras } = syncPropertyTypesPayload(
    types,
    {
      ...landExtras,
      ...rentExtras,
      ...commonExtras,
      ...residentialExtras,
      ...mediaExtras,
      ...(locationExtras
        ? { [LOCATION_EXTRAS_KEY]: locationExtras }
        : {}),
    },
    form.segment,
  );

  const base = {
    segment: form.segment,
    type: primaryType,
    class: form.class,
    area: form.area,
    price: form.price,
    price_per_m2: form.area > 0 ? Math.round(form.price / form.area) : 0,
    address: form.address.trim(),
    district: leafDistrict,
    lat: form.lat,
    lng: form.lng,
    floor: land ? "-" : form.floor,
    total_floors: land ? 1 : form.total_floors,
    ceiling_height: land ? null : form.ceiling_height,
    parking: land ? "Нет" : form.parking,
    condition: land ? null : form.condition,
    layout: land ? form.land_use || null : form.layout,
    deal_type: form.deal_type,
    deposit: isSale ? null : form.deposit,
    contract_term: isSale ? null : form.contract_term,
    description: form.description,
    features: form.features,
    request_type: form.request_type,
    client_id: userId,
    listing_manager_id: form.listing_manager_id || null,
    extras: typesExtras,
    developer_project_id: form.developer_project_id.trim() || null,
    developer_unit_type_id: form.developer_unit_type_id.trim() || null,
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
