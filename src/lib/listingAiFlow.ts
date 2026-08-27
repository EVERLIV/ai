import type { PropertySegment } from "@/config/propertySegments";
import {
  COMMERCIAL_PROPERTY_TYPES,
  LAND_PROPERTY_TYPES,
  RESIDENTIAL_PROPERTY_TYPES,
} from "@/config/propertySegments";
import {
  DISTRICTS,
  IRKUTSK_CITY_DISTRICTS,
  IRKUTSK_OBLAST_CITIES,
  IRKUTSK_OBLAST_DISTRICTS,
} from "@/lib/irkutskLocations";
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

export type LocationScope =
  | "irkutsk"
  | "oblast_city"
  | "oblast_rayon"
  | null;

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
  /** Подменю локации: Иркутск / города / районы области */
  locationScope?: LocationScope;
  /** Фото пропущены («Позже») */
  photosSkipped?: boolean;
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

  if (photoCount < 1 && !opts.photosSkipped) return "photos";
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
      return opts.locationScope === "irkutsk"
        ? "Район города Иркутска:"
        : opts.locationScope === "oblast_city"
        ? "Город или посёлок области:"
        : opts.locationScope === "oblast_rayon"
        ? "Район Иркутской области:"
        : "Где объект — Иркутск, город области или район? Можно открыть каталог.";
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
    case "district": {
      if (opts.locationScope === "irkutsk") {
        return [...IRKUTSK_CITY_DISTRICTS, "Каталог локаций", "Назад", "Введу сам"];
      }
      if (opts.locationScope === "oblast_city") {
        return [
          ...IRKUTSK_OBLAST_CITIES.slice(0, 14),
          "Каталог локаций",
          "Назад",
          "Введу сам",
        ];
      }
      if (opts.locationScope === "oblast_rayon") {
        return [
          ...IRKUTSK_OBLAST_DISTRICTS.slice(0, 14),
          "Каталог локаций",
          "Назад",
          "Введу сам",
        ];
      }
      return [
        "г. Иркутск",
        "Города области",
        "Районы области",
        "Каталог локаций",
        "Введу сам",
        ...IRKUTSK_CITY_DISTRICTS.slice(0, 3),
        ...IRKUTSK_OBLAST_CITIES.slice(0, 4),
      ];
    }
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
  locationScope?: LocationScope;
  /** Открыть LocationPickerModal как в каталоге */
  openLocationPicker?: boolean;
  /** Ждём ручной ввод локации в поле сообщения */
  awaitLocationText?: boolean;
  photosSkipped?: boolean;
};

function phaseFor(field: ListingFlowField): ListingAiPhase {
  if (field === "photos") return "photos";
  if (field === "done") return "preview";
  return "clarify";
}

function formatAddressHint(location: string): string {
  const loc = location.trim();
  if (!loc) return "Иркутская область";
  if (IRKUTSK_CITY_DISTRICTS.some((d) => d.toLowerCase() === loc.toLowerCase())) {
    return `г. Иркутск, ${loc}`;
  }
  return loc;
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
    if (lower === "назад") {
      return {
        form: next,
        ack: promptForField("district", next, { ...opts, locationScope: null }),
        nextField: "district",
        suggestions: chipsForField("district", next, {
          ...opts,
          locationScope: null,
        }),
        phase: "clarify",
        handled: true,
        locationScope: null,
      };
    }
    if (lower.includes("каталог")) {
      return {
        form: next,
        ack: "Открою каталог городов и районов области — как в поиске на сайте.",
        nextField: "district",
        suggestions: chipsForField("district", next, opts),
        phase: "clarify",
        handled: true,
        openLocationPicker: true,
        locationScope: opts.locationScope ?? null,
      };
    }
    if (lower.includes("введу") || lower === "другое" || lower === "свой") {
      return {
        form: next,
        ack: "Напишите город, район или населённый пункт области сообщением.",
        nextField: "district",
        suggestions: ["Каталог локаций", "Назад"],
        phase: "clarify",
        handled: true,
        awaitLocationText: true,
        locationScope: opts.locationScope ?? null,
      };
    }
    if (lower === "г. иркутск" || lower === "иркутск") {
      const scopeOpts = { ...opts, locationScope: "irkutsk" as const };
      return {
        form: next,
        ack: promptForField("district", next, scopeOpts),
        nextField: "district",
        suggestions: chipsForField("district", next, scopeOpts),
        phase: "clarify",
        handled: true,
        locationScope: "irkutsk",
      };
    }
    if (lower.includes("город") && lower.includes("област")) {
      const scopeOpts = { ...opts, locationScope: "oblast_city" as const };
      return {
        form: next,
        ack: promptForField("district", next, scopeOpts),
        nextField: "district",
        suggestions: chipsForField("district", next, scopeOpts),
        phase: "clarify",
        handled: true,
        locationScope: "oblast_city",
      };
    }
    if (lower.includes("район") && lower.includes("област")) {
      const scopeOpts = { ...opts, locationScope: "oblast_rayon" as const };
      return {
        form: next,
        ack: promptForField("district", next, scopeOpts),
        nextField: "district",
        suggestions: chipsForField("district", next, scopeOpts),
        phase: "clarify",
        handled: true,
        locationScope: "oblast_rayon",
      };
    }

    const catalogHit = DISTRICTS.find((d) => d.toLowerCase() === lower);
    if (catalogHit) {
      next.district = catalogHit;
      if (!next.address.trim()) {
        next.address = formatAddressHint(catalogHit);
      }
      handled = true;
    } else if (raw.length >= 2 && !raw.includes("?")) {
      next.district = raw;
      if (!next.address.trim()) next.address = raw;
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
      next.address = next.district.trim() || "Иркутская область";
      handled = true;
    } else if (lower === "центр") {
      next.address = next.district
        ? `${formatAddressHint(next.district)}, центр`
        : "г. Иркутск, центр";
      if (!next.district) next.district = "Кировский";
      handled = true;
    } else if (lower.includes("остановк")) {
      next.address = next.district
        ? `${formatAddressHint(next.district)}, рядом с остановкой`
        : "рядом с остановкой";
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
    if (lower.includes("позже")) {
      handled = true;
    }
  } else if (field === "done" && lower.includes("создать")) {
    handled = true;
  }

  if (!handled) return null;

  const photosSkipped =
    Boolean(opts.photosSkipped) ||
    (field === "photos" && lower.includes("позже"));

  const nextOpts: ListingFlowOpts = {
    ...opts,
    segmentChosen,
    photosSkipped,
    locationScope:
      field === "district" && next.district.trim()
        ? null
        : (opts.locationScope ?? null),
  };
  const nf = nextListingField(next, nextOpts);
  const label =
    field === "manager" && next.listing_manager_id === MANAGER_SKIP
      ? "без закрепления"
      : field === "photos" && photosSkipped
      ? "фото позже"
      : raw;

  let ack = `Записал: ${label}. ${promptForField(nf, next, nextOpts)}`;
  if (field === "photos" && photosSkipped) {
    ack = `Ок, фото можно добавить в кабинете. ${promptForField(nf, next, nextOpts)}`;
  }
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
    locationScope: nextOpts.locationScope ?? null,
    photosSkipped,
  };
}

/** Привлекательное SEO-описание по фактам клиента (Иркутск / область). */
export function buildSeoDescription(form: PropertyFormState): string {
  const type = form.types[0] || "Объект";
  const typeLower = type.toLowerCase();
  const deal = form.deal_type || "Аренда";
  const dealWord =
    deal === "Продажа"
      ? "продажа"
      : deal === "Посуточно"
      ? "посуточная аренда"
      : "аренда";
  const district = form.district.trim();
  const address = form.address.trim();
  let loc = address || (district ? `${district}, Иркутская область` : "Иркутская область");
  if (
    district &&
    address &&
    !address.toLowerCase().includes(district.toLowerCase())
  ) {
    loc = `${address}, ${district}`;
  }

  const areaNum = form.area > 0 ? form.area : 0;
  const area = areaNum > 0 ? `${areaNum} м²` : "";
  const roomsRaw = form.rooms.trim();
  const roomsNum =
    roomsRaw === "Студия" ? 0 : Number.parseInt(roomsRaw, 10) || 0;
  const roomsLabel =
    roomsRaw === "Студия"
      ? "студия"
      : roomsNum > 0
      ? `${roomsNum}-комнатная`
      : "";
  const floor = form.floor.trim();
  const condition = form.condition.trim();
  const parking =
    form.parking && form.parking !== "Нет" ? form.parking : "";

  const priceNum = form.price > 0 ? form.price.toLocaleString("ru-RU") : "";
  const priceLine =
    priceNum && deal === "Продажа"
      ? `Цена ${priceNum} ₽.`
      : priceNum && deal === "Посуточно"
      ? `${priceNum} ₽ за сутки.`
      : priceNum
      ? `${priceNum} ₽ в месяц.`
      : "";

  const hook = buildSeoHook({
    segment: form.segment,
    type,
    typeLower,
    deal,
    dealWord,
    roomsNum,
    roomsLabel,
    areaNum,
    area,
    condition,
    parking,
    district,
  });

  const factsBits = [
    roomsLabel && !hook.includes(roomsLabel) ? roomsLabel : "",
    area,
    floor ? `этаж ${floor}` : "",
    condition,
    parking ? `парковка: ${parking}` : "",
  ].filter(Boolean);

  const placeLine = `Локация: ${loc}.`;
  const factsLine = factsBits.length
    ? `В карточке: ${factsBits.join(", ")}.`
    : "";

  const cta =
    deal === "Продажа"
      ? "Смотрите объявление на АрендаСити и запишитесь на просмотр — ответим быстро."
      : deal === "Посуточно"
      ? "Свободные даты и бронь — на АрендаСити."
      : "Условия и просмотр — на АрендаСити, напишите в объявлении.";

  return [hook, placeLine, factsLine, priceLine, cta].filter(Boolean).join(" ");
}

function buildSeoHook(input: {
  segment: PropertyFormState["segment"];
  type: string;
  typeLower: string;
  deal: string;
  dealWord: string;
  roomsNum: number;
  roomsLabel: string;
  areaNum: number;
  area: string;
  condition: string;
  parking: string;
  district: string;
}): string {
  const {
    segment,
    type,
    typeLower,
    deal,
    dealWord,
    roomsNum,
    roomsLabel,
    areaNum,
    area,
    condition,
    parking,
    district,
  } = input;
  const where = district ? `в районе ${district}` : "в Иркутской области";
  const size = area ? ` ${area}` : "";

  if (segment === "land" || typeLower.includes("земл") || typeLower.includes("участ")) {
    const sizeHint =
      areaNum >= 1500
        ? "Просторный участок — удобно под дом, хозяйство или коммерческий проект."
        : areaNum >= 600
        ? "Удобный размер для строительства и обустройства территории."
        : "Компактный участок — удобно начать проект без лишних затрат.";
    return `${type}${size} — ${dealWord} ${where}. ${sizeHint}`;
  }

  if (segment === "residential") {
    let audience = "";
    if (roomsLabel === "студия") {
      audience =
        deal === "Посуточно"
          ? "Уютный формат для поездок и короткого проживания — всё необходимое под рукой."
          : "Лёгкий старт для одного или пары: минимум лишнего, максимум удобства.";
    } else if (roomsNum >= 4) {
      audience =
        "Просторная планировка — комфортно большой семье, есть место для работы и отдыха.";
    } else if (roomsNum === 3) {
      audience =
        "Отличный вариант для семьи: отдельные комнаты, удобно жить и принимать гостей.";
    } else if (roomsNum === 2) {
      audience =
        "Сбалансированный вариант для пары или небольшой семьи — спальня и общая зона.";
    } else if (roomsNum === 1) {
      audience =
        "Компактная однушка: удобно для себя или как первая инвестиция в жильё.";
    } else {
      audience = "Удобное жильё с понятной планировкой для повседневной жизни.";
    }

    const finish = condition
      ? condition.toLowerCase().includes("евро") ||
        condition.toLowerCase().includes("хорош")
        ? ` Состояние радует: ${condition.toLowerCase()} — можно заезжать без долгого ремонта.`
        : condition.toLowerCase().includes("без") ||
          condition.toLowerCase().includes("чистовую")
        ? ` Состояние: ${condition.toLowerCase()} — можно сделать «под себя».`
        : ` Отделка: ${condition.toLowerCase()}.`
      : "";

    const head = roomsLabel
      ? `${type}, ${roomsLabel}${size}`
      : `${type}${size}`;
    return `${head} — ${dealWord} ${where}. ${audience}${finish}`;
  }

  // commercial
  const byType: Record<string, string> = {
    офис:
      areaNum >= 120
        ? "Просторный офис для команды: зоны для переговоров и спокойной работы."
        : "Удобный офис для небольшого штата или кабинета специалиста.",
    торговая:
      areaNum >= 100
        ? "Витринная торговая площадь — хорошо заметна потоку, удобно под магазин или шоурум."
        : "Компактная торговая точка — удобно под островок, бутик или пункт выдачи.",
    склад:
      areaNum >= 200
        ? "Складской объём под логистику и хранение — удобный заезд и понятная планировка."
        : "Небольшой склад / кладовая для бизнеса без лишних площадей.",
    производство:
      "Производственное помещение под цех или мастерскую — формат под рабочие процессы.",
    павильон:
      "Павильон с хорошей видимостью — удобно под торговлю, услуги или сезонную точку.",
    псн: "Помещение свободного назначения — гибко под услуги, офис или торговлю.",
    общепит:
      "Формат под кафе, пекарню или кухню на вынос — важна локация и посадочные сценарии.",
    автосервис:
      "Площадка под автосервис или смежные услуги — удобный заезд для клиентов.",
  };

  const key = Object.keys(byType).find((k) => typeLower.includes(k));
  let audience =
    (key && byType[key]) ||
    `Помещение формата «${type}» — удобно под бизнес и смежные сценарии.`;

  if (areaNum >= 200 && !key) {
    audience =
      "Крупная площадь — хорошо под сеть, шоурум, обучение или несколько зон в одном объекте.";
  } else if (areaNum > 0 && areaNum < 40) {
    audience =
      "Компактный метраж — экономный старт для услуг, пункта выдачи или кабинета.";
  }

  const park = parking
    ? ` Есть парковка (${parking.toLowerCase()}) — плюс для клиентов и сотрудников.`
    : "";
  const finish = condition
    ? ` Состояние: ${condition.toLowerCase()}.`
    : "";

  return `${type}${size} — ${dealWord} ${where}. ${audience}${park}${finish}`;
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
