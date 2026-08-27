import type { PropertySegment } from "@/config/propertySegments";
import type { PropertyFormState } from "@/lib/propertyFormMapper";
import { isSaleDeal } from "@/lib/propertyDeal";
import { isAnyLand } from "@/lib/propertyLand";

export type ListingAiPhase =
  | "intake"
  | "clarify"
  | "photos"
  | "enhance"
  | "preview"
  | "commit"
  | "done";

export type ListingAiDraftPatch = Partial<{
  segment: PropertySegment;
  types: string[];
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
  rooms: string;
  building_type: string;
  land_use: string;
  cadastral_number: string;
  purpose: string;
  features: string[];
  class: string;
  market: string;
}>;

const FIELD_LABELS: Record<string, string> = {
  segment: "Категория",
  types: "Тип объекта",
  deal_type: "Тип сделки",
  area: "Площадь",
  price: "Цена",
  address: "Адрес",
  description: "Описание",
  district: "Район",
  rooms: "Комнаты",
  land_use: "Назначение земли",
  floor: "Этаж",
  condition: "Состояние",
  parking: "Парковка",
  manager: "Агент",
};

export function createEmptyListingForm(
  segment: PropertySegment = "commercial",
): PropertyFormState {
  const residential = segment === "residential";
  const land = segment === "land";
  return {
    segment,
    types: land ? ["Земля"] : residential ? ["Квартира"] : ["Офис"],
    class: residential || land ? "" : "B",
    deal_type: "Аренда",
    area: 0,
    price: 0,
    description: "",
    address: "",
    district: "Кировский",
    lat: null,
    lng: null,
    floor: land ? "-" : "1",
    total_floors: 1,
    ceiling_height: land ? 0 : 3,
    parking: "Нет",
    condition: land ? "" : "Хороший ремонт",
    layout: land ? "" : residential ? "" : "Open-space",
    deposit: "1 месяц",
    contract_term: "1 год",
    cadastral_number: "",
    land_use: "",
    features: [],
    request_type: "free_listing",
    utilities_included: "",
    vat: "",
    indexation: "",
    min_term: "",
    contract_form: "",
    landlord_type: "Собственник",
    sublease: "",
    pedestrian_traffic: undefined,
    metro_minutes: "",
    transport_hub: "",
    entrance_group: "",
    purpose: "",
    rooms: "",
    building_type: "",
    year_built: "",
    balcony: "",
    furniture: "",
    bathroom: "",
    market: "",
    window_view: "",
    living_area: "",
    kitchen_area: "",
    mortgage: false,
    pets_allowed: false,
    children_allowed: false,
    listing_manager_id: "",
    wood_config: "",
    wood_wall: "",
    wood_floors: "",
    wood_foundation: "",
    wood_roof: "",
    wood_finish: "",
    video_urls: [],
    plan_image_url: "",
    developer_project_id: "",
    developer_unit_type_id: "",
  };
}

export function applyListingDraftPatch(
  form: PropertyFormState,
  patch: ListingAiDraftPatch | Record<string, unknown> | null | undefined,
): PropertyFormState {
  if (!patch || typeof patch !== "object") return form;
  const next: PropertyFormState = { ...form };

  const seg = patch.segment;
  if (seg === "commercial" || seg === "residential" || seg === "land") {
    next.segment = seg;
  }
  if (Array.isArray(patch.types) && patch.types.length > 0) {
    next.types = patch.types.map(String).filter(Boolean);
  }
  if (typeof patch.deal_type === "string" && patch.deal_type.trim()) {
    next.deal_type = patch.deal_type.trim();
  }
  if (typeof patch.area === "number" && patch.area > 0) next.area = patch.area;
  if (typeof patch.price === "number" && patch.price > 0)
    next.price = patch.price;
  if (typeof patch.description === "string" && patch.description.trim()) {
    next.description = patch.description.trim();
  }
  if (typeof patch.address === "string" && patch.address.trim()) {
    next.address = patch.address.trim();
  }
  if (typeof patch.district === "string" && patch.district.trim()) {
    next.district = patch.district.trim();
  }
  if (typeof patch.floor === "string" && patch.floor.trim()) {
    next.floor = patch.floor.trim();
  }
  if (typeof patch.total_floors === "number" && patch.total_floors > 0) {
    next.total_floors = patch.total_floors;
  }
  if (typeof patch.ceiling_height === "number" && patch.ceiling_height > 0) {
    next.ceiling_height = patch.ceiling_height;
  }
  if (typeof patch.parking === "string" && patch.parking.trim()) {
    next.parking = patch.parking.trim();
  }
  if (typeof patch.condition === "string" && patch.condition.trim()) {
    next.condition = patch.condition.trim();
  }
  if (typeof patch.layout === "string" && patch.layout.trim()) {
    next.layout = patch.layout.trim();
  }
  if (typeof patch.deposit === "string" && patch.deposit.trim()) {
    next.deposit = patch.deposit.trim();
  }
  if (typeof patch.contract_term === "string" && patch.contract_term.trim()) {
    next.contract_term = patch.contract_term.trim();
  }
  if (typeof patch.rooms === "string" && patch.rooms.trim()) {
    next.rooms = patch.rooms.trim();
  }
  if (typeof patch.building_type === "string" && patch.building_type.trim()) {
    next.building_type = patch.building_type.trim();
  }
  if (typeof patch.land_use === "string" && patch.land_use.trim()) {
    next.land_use = patch.land_use.trim();
  }
  if (
    typeof patch.cadastral_number === "string" &&
    patch.cadastral_number.trim()
  ) {
    next.cadastral_number = patch.cadastral_number.trim();
  }
  if (typeof patch.purpose === "string" && patch.purpose.trim()) {
    next.purpose = patch.purpose.trim();
  }
  if (Array.isArray(patch.features)) {
    next.features = patch.features.map(String).filter(Boolean);
  }
  if (typeof patch.class === "string" && patch.class.trim()) {
    next.class = patch.class.trim();
  }
  if (typeof patch.market === "string" && patch.market.trim()) {
    next.market = patch.market.trim();
  }

  if (isAnyLand(next.types) && next.segment === "commercial") {
    next.segment = "land";
  }

  return next;
}

export function listingMissingFieldLabels(keys: string[]): string[] {
  return keys.map((k) => FIELD_LABELS[k] || k);
}

export function listingFormReadyForPhotos(form: PropertyFormState): boolean {
  return (
    form.types.length > 0 &&
    !!form.deal_type &&
    form.area > 0 &&
    form.price > 0 &&
    form.address.trim().length >= 4 &&
    form.description.trim().length >= 10
  );
}

export function listingPayloadOptions(form: PropertyFormState) {
  return {
    isSale: isSaleDeal(form.deal_type),
    isLand: form.segment === "land" || isAnyLand(form.types),
    asDraft: true as const,
  };
}
