import type { PropertySegment } from "@/config/propertySegments";
import {
  COMMERCIAL_PROPERTY_TYPES,
  LAND_PROPERTY_TYPES,
  RESIDENTIAL_PROPERTY_TYPES,
} from "@/config/propertySegments";
import { IRKUTSK_CITY_DISTRICTS } from "@/lib/irkutskLocations";
import {
  createEmptyListingForm,
  type ListingAiPhase,
} from "@/lib/listingAiDraft";
import type { PropertyFormState } from "@/lib/propertyFormMapper";

export type ListingFlowField =
  | "segment"
  | "types"
  | "deal_type"
  | "district"
  | "area"
  | "price"
  | "address"
  | "rooms"
  | "floor"
  | "condition"
  | "parking"
  | "description"
  | "manager"
  | "photos"
  | "done";

export type ListingAiManager = {
  id: string;
  full_name: string;
  phone: string;
  photo_url?: string | null;
};

export type AccountRoleKind = "agency" | "developer" | "owner";

export type ListingFlowOpts = {
  photoCount?: number;
  managers?: ListingAiManager[];
  isAgency?: boolean;
  isDeveloper?: boolean;
  /** Пользователь уже выбрал Жилая / Коммерческая / Земля */
  segmentChosen?: boolean;
  firstName?: string;
  accountRole?: AccountRoleKind;
  companyName?: string;
};

export type ListingFlowStep = {
  key: string;
  label: string;
};

export const LISTING_AI_STEPS: ListingFlowStep[] = [
  { key: "basic", label: "Основное" },
  { key: "location", label: "Локация" },
  { key: "details", label: "Детали" },
  { key: "media", label: "Фото" },
  { key: "submit", label: "Черновик" },
];

export function createAiListingForm(
  segment: PropertySegment = "commercial",
): PropertyFormState {
  return {
    ...createEmptyListingForm(segment),
    types: [],
    deal_type: "",
    district: "",
    area: 0,
    price: 0,
    address: "",
    description: "",
    floor: "",
    condition: "",
    parking: "",
    rooms: "",
    /** Не спрашиваем «собственник» — выставим при сохранении */
    landlord_type: "",
    listing_manager_id: "",
  };
}

function typesFor(segment: PropertySegment): string[] {
  if (segment === "residential") return [...RESIDENTIAL_PROPERTY_TYPES];
  if (segment === "land") return [...LAND_PROPERTY_TYPES];
  return [...COMMERCIAL_PROPERTY_TYPES];
}

function needsManager(opts: ListingFlowOpts): boolean {
  return Boolean(opts.isAgency && (opts.managers?.length ?? 0) > 0);
}

/** Маркер «менеджер выбран или пропущен» — пустая строка = ещё не спрашивали; "__none__" = пропуск */
const MANAGER_SKIP = "__none__";

export function nextListingField(
  form: PropertyFormState,
  opts: ListingFlowOpts = {},
): ListingFlowField {
  const photoCount = opts.photoCount ?? 0;
  if (!opts.segmentChosen) return "segment";
  if (!form.types.length) return "types";
  if (!form.deal_type.trim()) return "deal_type";
  if (!form.district.trim()) return "district";
  if (!(form.area > 0)) return "area";
  if (!(form.price > 0)) return "price";
  if (form.address.trim().length < 4) return "address";

  if (form.segment === "residential" && !form.rooms.trim()) return "rooms";
  if (form.segment !== "land" && !form.floor.trim()) return "floor";
  if (form.segment !== "land" && !form.condition.trim()) return "condition";
  if (form.segment === "commercial" && !form.parking.trim()) return "parking";

  if (form.description.trim().length < 10) return "description";

  if (needsManager(opts)) {
    const mid = form.listing_manager_id.trim();
    if (!mid) return "manager";
  }

  if (photoCount < 1) return "photos";
  return "done";
}

export function listingStepIndex(
  form: PropertyFormState,
  opts: ListingFlowOpts = {},
): number {
  const field = nextListingField(form, opts);
  if (
    field === "types" ||
    field === "deal_type" ||
    field === "area" ||
    field === "price"
  ) {
    return 0;
  }
  if (field === "district" || field === "address") return 1;
  if (
    field === "rooms" ||
    field === "floor" ||
    field === "condition" ||
    field === "parking" ||
    field === "description" ||
    field === "manager"
  ) {
    return 2;
  }
  if (field === "photos") return 3;
  return 4;
}

export function promptForField(
  field: ListingFlowField,
  form: PropertyFormState,
  opts: ListingFlowOpts = {},
): string {
  const deal = form.deal_type || "Аренда";
  const name = opts.firstName?.trim();
  const hi = name ? `${name}, ` : "";
  switch (field) {
    case "segment":
      return `${hi}что размещаем — жилую, коммерческую или землю?`;
    case "types":
      return form.segment === "residential"
        ? "Какой тип жилья?"
        : form.segment === "land"
        ? "Земля или участок?"
        : "Какой тип коммерции?";
    case "deal_type":
      return "Тип сделки:";
    case "district":
      return "Район Иркутска:";
    case "area":
      return "Площадь:";
    case "price":
      return deal === "Продажа"
        ? "Цена продажи:"
        : deal === "Посуточно"
        ? "Цена за сутки:"
        : "Месячная ставка:";
    case "address":
      return "Улица и дом:";
    case "rooms":
      return "Сколько комнат?";
    case "floor":
      return "Этаж:";
    case "condition":
      return "Состояние / ремонт:";
    case "parking":
      return "Парковка:";
    case "description":
      return "Соберу SEO-описание по вашим данным — или напишите сами:";
    case "manager":
      return "За каким агентом закрепить объект?";
    case "photos":
      return "Добавьте фото:";
    default:
      return "Карточка готова. Создайте черновик.";
  }
}

export function chipsForField(
  field: ListingFlowField,
  form: PropertyFormState,
  opts: ListingFlowOpts = {},
): string[] {
  switch (field) {
    case "segment":
      if (opts.isDeveloper) return ["Жилая", "Коммерческая"];
      return ["Жилая", "Коммерческая", "Земля"];
    case "types":
      return typesFor(form.segment).slice(0, 8);
    case "deal_type":
      return form.segment === "residential"
        ? ["Аренда", "Продажа", "Посуточно"]
        : ["Аренда", "Продажа"];
    case "district":
      return [...IRKUTSK_CITY_DISTRICTS];
    case "area":
      return form.segment === "land"
        ? ["6 соток", "10 соток", "15 соток", "20 соток", "50 соток"]
        : form.segment === "residential"
        ? ["30 м²", "45 м²", "60 м²", "80 м²", "100 м²"]
        : ["30 м²", "50 м²", "80 м²", "120 м²", "200 м²", "300 м²"];
    case "price":
      if (form.deal_type === "Продажа") {
        return form.segment === "residential"
          ? ["3 млн ₽", "5 млн ₽", "8 млн ₽", "12 млн ₽"]
          : ["5 млн ₽", "10 млн ₽", "20 млн ₽", "50 млн ₽"];
      }
      if (form.deal_type === "Посуточно") {
        return ["2 000 ₽/сутки", "3 500 ₽/сутки", "5 000 ₽/сутки"];
      }
      return form.segment === "residential"
        ? ["20 000 ₽/мес", "30 000 ₽/мес", "45 000 ₽/мес", "60 000 ₽/мес"]
        : ["30 000 ₽/мес", "50 000 ₽/мес", "80 000 ₽/мес", "150 000 ₽/мес"];
    case "address":
      return ["Центр", "Укажу позже", "Рядом с остановкой"];
    case "rooms":
      return ["Студия", "1", "2", "3", "4", "5+"];
    case "floor":
      return ["Цоколь", "1", "2", "3", "4", "5", "Выше 5"];
    case "condition":
      return [
        "Без ремонта",
        "Косметический",
        "Хороший ремонт",
        "Евроремонт",
        "Под чистовую",
      ];
    case "parking":
      return ["Нет", "Во дворе", "Охраняемая", "Подземная", "На территории"];
    case "description":
      return ["SEO-описание", "Напишу сам"];
    case "manager": {
      const names = (opts.managers || []).map((m) => m.full_name).slice(0, 8);
      return [...names, "Не закреплён"];
    }
    case "photos":
      return ["Позже"];
    default:
      return ["Создать черновик"];
  }
}

/** Отбросить «вопросы» от модели — в чипах только готовые ответы. */
function isAnswerChip(text: string): boolean {
  const t = text.trim();
  if (!t || t.length > 48) return false;
  if (t.includes("?")) return false;
  if (/^(где|как|какой|какая|какие|сколько|что|когда|укажите|назовите|расскажите|введите)\b/i.test(t)) {
    return false;
  }
  return true;
}

export function enrichSuggestions(
  form: PropertyFormState,
  fromAi: string[],
  opts: ListingFlowOpts = {},
): string[] {
  const field = nextListingField(form, opts);
  const chips = chipsForField(field, form, opts);
  // Сначала наши ответы по полю, потом только валидные ответы от ИИ
  const fromModel = (fromAi || []).filter(isAnswerChip);
  const merged = [...chips, ...fromModel];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of merged) {
    const key = c.trim();
    if (!key || !isAnswerChip(key) || seen.has(key.toLowerCase())) continue;
    seen.add(key.toLowerCase());
    out.push(key);
    if (out.length >= 12) break;
  }
  return out.length ? out : chips;
}

function parseArea(text: string): number | null {
  const t = text.toLowerCase().replace(/\s/g, " ").trim();
  const sotki = t.match(/(\d+(?:[.,]\d+)?)\s*сот/);
  if (sotki) {
    const n = Number(sotki[1].replace(",", "."));
    return Number.isFinite(n) ? Math.round(n * 100) : null;
  }
  const m = t.match(/(\d+(?:[.,]\d+)?)\s*(м²|м2|кв)?/);
  if (!m) return null;
  const n = Number(m[1].replace(",", "."));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function parsePrice(text: string): number | null {
  const t = text.toLowerCase().replace(/\s/g, " ").trim();
  const mln = t.match(/(\d+(?:[.,]\d+)?)\s*млн/);
  if (mln) {
    const n = Number(mln[1].replace(",", "."));
    return Number.isFinite(n) ? Math.round(n * 1_000_000) : null;
  }
  const digits = t.replace(/[^\d]/g, "");
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) && n > 0 ? n : null;
}

export type QuickApplyResult = {
  form: PropertyFormState;
  ack: string;
  nextField: ListingFlowField;
  suggestions: string[];
  phase: ListingAiPhase;
  handled: boolean;
  segmentChosen?: boolean;
};

function phaseFor(field: ListingFlowField): ListingAiPhase {
  if (field === "photos") return "photos";
  if (field === "done") return "preview";
  return "clarify";
}

export function firstNameFromFullName(fullName?: string | null): string {
  const t = (fullName || "").trim();
  if (!t) return "";
  return t.split(/\s+/)[0] || "";
}

export function buildWelcomeMessage(opts: ListingFlowOpts): string {
  const name = opts.firstName?.trim();
  const hello = name ? `${name}, здравствуйте!` : "Здравствуйте!";
  let roleLine = "";
  if (opts.accountRole === "agency") {
    roleLine = opts.companyName
      ? ` Вижу аккаунт агентства «${opts.companyName}».`
      : " Вижу аккаунт агентства.";
  } else if (opts.accountRole === "developer") {
    roleLine = opts.companyName
      ? ` Вижу профиль застройщика «${opts.companyName}».`
      : " Вижу профиль застройщика.";
  } else {
    roleLine = " Размещаем от собственника.";
  }
  return `${hello}${roleLine} Сначала выберите категорию — я подставлю нужные типы объектов.`;
}

export function tryQuickApplyChip(
  chip: string,
  form: PropertyFormState,
  opts: ListingFlowOpts = {},
): QuickApplyResult | null {
  const field = nextListingField(form, opts);
  const raw = chip.trim();
  if (!raw) return null;
  const lower = raw.toLowerCase();
  const next = { ...form };
  let handled = false;
  let segmentChosen = Boolean(opts.segmentChosen);

  if (field === "segment") {
    if (lower.startsWith("жил")) {
      next.segment = "residential";
      next.types = [];
      segmentChosen = true;
      handled = true;
    } else if (lower.startsWith("коммерч")) {
      next.segment = "commercial";
      next.types = [];
      segmentChosen = true;
      handled = true;
    } else if (lower.startsWith("земл") || lower.includes("участок")) {
      next.segment = "land";
      next.types = [];
      segmentChosen = true;
      handled = true;
    }
  } else if (field === "types") {
    const hit = typesFor(form.segment).find((t) => t.toLowerCase() === lower);
    if (hit) {
      next.types = [hit];
      handled = true;
    }
  } else if (field === "deal_type") {
    if (["аренда", "продажа", "посуточно"].includes(lower)) {
      next.deal_type =
        lower === "аренда"
          ? "Аренда"
          : lower === "продажа"
          ? "Продажа"
          : "Посуточно";
      handled = true;
    }
  } else if (field === "district") {
    const hit = IRKUTSK_CITY_DISTRICTS.find((d) => d.toLowerCase() === lower);
    if (hit) {
      next.district = hit;
      if (!next.address.trim()) next.address = `г. Иркутск, ${hit}`;
      handled = true;
    }
  } else if (field === "area") {
    const area = parseArea(raw);
    if (area) {
      next.area = area;
      handled = true;
    }
  } else if (field === "price") {
    const price = parsePrice(raw);
    if (price) {
      next.price = price;
      handled = true;
    }
  } else if (field === "address") {
    if (lower === "укажу позже") {
      next.address = next.district
        ? `г. Иркутск, ${next.district}`
        : "г. Иркутск";
      handled = true;
    } else if (lower === "центр") {
      next.address = "г. Иркутск, центр";
      if (!next.district) next.district = "Кировский";
      handled = true;
    } else if (lower.includes("остановк")) {
      next.address = next.district
        ? `г. Иркутск, ${next.district}, рядом с остановкой`
        : "г. Иркутск, рядом с остановкой";
      handled = true;
    }
  } else if (field === "rooms") {
    if (lower === "студия") {
      next.rooms = "Студия";
      handled = true;
    } else if (lower === "5+" || lower === "5") {
      next.rooms = "5";
      handled = true;
    } else if (/^[1-4]$/.test(lower)) {
      next.rooms = lower;
      handled = true;
    }
  } else if (field === "floor") {
    if (lower === "цоколь") {
      next.floor = "Цоколь";
      handled = true;
    } else if (lower.includes("выше")) {
      next.floor = "6";
      handled = true;
    } else if (/^\d+$/.test(lower)) {
      next.floor = lower;
      handled = true;
    }
  } else if (field === "condition") {
    const optsCond = [
      "Без ремонта",
      "Косметический",
      "Хороший ремонт",
      "Евроремонт",
      "Под чистовую",
    ];
    const hit = optsCond.find((c) => c.toLowerCase() === lower);
    if (hit) {
      next.condition = hit;
      handled = true;
    }
  } else if (field === "parking") {
    const optsPark = [
      "Нет",
      "Во дворе",
      "Охраняемая",
      "Подземная",
      "На территории",
    ];
    const hit = optsPark.find((c) => c.toLowerCase() === lower);
    if (hit) {
      next.parking = hit;
      handled = true;
    }
  } else if (field === "description") {
    if (
      lower.includes("seo") ||
      lower.includes("сео") ||
      lower.includes("составить") ||
      lower.includes("описание")
    ) {
      next.description = buildSeoDescription(next);
      handled = true;
    }
  } else if (field === "manager") {
    if (lower.includes("не закреп") || lower === "пропустить") {
      next.listing_manager_id = MANAGER_SKIP;
      handled = true;
    } else {
      const hit = (opts.managers || []).find(
        (m) => m.full_name.toLowerCase() === lower,
      );
      if (hit) {
        next.listing_manager_id = hit.id;
        handled = true;
      }
    }
  } else if (field === "photos") {
    if (lower.includes("позже")) handled = true;
  } else if (field === "done" && lower.includes("создать")) {
    handled = true;
  }

  if (!handled) return null;

  const nextOpts: ListingFlowOpts = { ...opts, segmentChosen };
  const nf = nextListingField(next, nextOpts);
  const label =
    field === "manager" && next.listing_manager_id === MANAGER_SKIP
      ? "без закрепления"
      : field === "segment"
      ? raw
      : raw;

  let ack = `Записал: ${label}. ${promptForField(nf, next, nextOpts)}`;
  if (field === "description" && next.description.trim().length >= 10) {
    ack = `Готово — SEO-описание для карточки:\n\n${next.description}\n\n${promptForField(nf, next, nextOpts)}`;
  }

  return {
    form: next,
    ack,
    nextField: nf,
    suggestions: chipsForField(nf, next, nextOpts),
    phase: phaseFor(nf),
    handled: true,
    segmentChosen,
  };
}

/** Привлекательное SEO-описание по фактам клиента (Иркутск). */
export function buildSeoDescription(form: PropertyFormState): string {
  const type = form.types[0] || "Объект";
  const deal = form.deal_type || "Аренда";
  const dealWord =
    deal === "Продажа"
      ? "продажа"
      : deal === "Посуточно"
      ? "посуточно"
      : "аренда";
  const district = form.district.trim();
  const address = form.address.trim();
  // Не дублировать район в адресе
  let loc = address || (district ? `${district}, Иркутск` : "Иркутск");
  if (district && address && !address.toLowerCase().includes(district.toLowerCase())) {
    loc = `${address}, ${district}`;
  }

  const area = form.area > 0 ? `${form.area} м²` : "";
  const rooms =
    form.rooms && form.rooms !== "Студия"
      ? `${form.rooms}-комнатная`
      : form.rooms === "Студия"
      ? "студия"
      : "";
  const floor = form.floor ? `этаж ${form.floor}` : "";
  const condition = form.condition || "";
  const parking =
    form.parking && form.parking !== "Нет" ? `парковка ${form.parking}` : "";

  const priceNum = form.price > 0 ? form.price.toLocaleString("ru-RU") : "";
  const priceLine =
    priceNum && deal === "Продажа"
      ? `Цена ${priceNum} ₽.`
      : priceNum && deal === "Посуточно"
      ? `${priceNum} ₽/сутки.`
      : priceNum
      ? `${priceNum} ₽/мес.`
      : "";

  const headline = [type, rooms, area && `${area}`, `— ${dealWord}`]
    .filter(Boolean)
    .join(" ");

  const facts = [floor, condition, parking].filter(Boolean).join(", ");

  const para2 =
    form.segment === "land"
      ? "Уточняйте назначение и коммуникации при просмотре."
      : form.segment === "residential"
      ? "Удобная локация для жизни: рядом инфраструктура района."
      : `Подойдёт под ${type.toLowerCase()} и смежные форматы бизнеса.`;

  const cta =
    deal === "Продажа"
      ? "Смотрите на АрендаСити — запишитесь на просмотр."
      : "Условия и просмотр — на АрендаСити.";

  return [headline + ".", loc + ".", facts && `Характеристики: ${facts}.`, priceLine, para2, cta]
    .filter(Boolean)
    .join(" ");
}

/** @deprecated используйте buildSeoDescription */
export function buildAutoDescription(form: PropertyFormState): string {
  return buildSeoDescription(form);
}

export function missingKeysFromForm(
  form: PropertyFormState,
  opts: ListingFlowOpts = {},
): string[] {
  const keys: string[] = [];
  if (!opts.segmentChosen) keys.push("segment");
  if (!form.types.length) keys.push("types");
  if (!form.deal_type.trim()) keys.push("deal_type");
  if (!form.district.trim()) keys.push("district");
  if (!(form.area > 0)) keys.push("area");
  if (!(form.price > 0)) keys.push("price");
  if (form.address.trim().length < 4) keys.push("address");
  if (form.segment === "residential" && !form.rooms.trim()) keys.push("rooms");
  if (form.segment !== "land" && !form.floor.trim()) keys.push("floor");
  if (form.segment !== "land" && !form.condition.trim()) keys.push("condition");
  if (form.segment === "commercial" && !form.parking.trim()) keys.push("parking");
  if (form.description.trim().length < 10) keys.push("description");
  if (needsManager(opts) && !form.listing_manager_id.trim()) keys.push("manager");
  return keys;
}

/** landlord_type без вопроса «собственник» */
export function resolveLandlordType(opts: ListingFlowOpts): string {
  if (opts.isDeveloper) return "Застройщик";
  if (opts.isAgency) return "Агентство";
  return "Собственник";
}

export function isManagerSkipped(id: string): boolean {
  return id === MANAGER_SKIP || !id;
}
