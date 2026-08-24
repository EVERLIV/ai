/** Общие справочники полей объекта — единый источник для формы, админки и карточек */
import {
  COMMERCIAL_PROPERTY_TYPES,
  RESIDENTIAL_PROPERTY_TYPES,
} from "@/config/propertySegments";

export { COMMERCIAL_PROPERTY_TYPES, RESIDENTIAL_PROPERTY_TYPES };

export const PROPERTY_TYPES = COMMERCIAL_PROPERTY_TYPES;
export const PROPERTY_CLASSES = ["A", "A+", "B+", "B", "C", "-"] as const;
export const DEAL_TYPES = ["Аренда", "Продажа"] as const;
export const RESIDENTIAL_DEAL_TYPES = [
  "Аренда",
  "Продажа",
  "Посуточно",
] as const;
export const MARKET_OPTIONS = ["Вторичка", "Новостройка"] as const;

export {
  DISTRICTS,
  IRKUTSK_CITY_DISTRICTS,
  IRKUTSK_MICRODISTRICTS,
  IRKUTSK_OBLAST_CITIES,
  IRKUTSK_OBLAST_DISTRICTS,
  inferDistrictFromAddress,
  LOCATION_GROUPS,
} from "@/lib/irkutskLocations";

export const FLOORS = [
  "-",
  "Цоколь",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
  "20",
  "Мансарда",
] as const;

export const TOTAL_FLOORS_OPTIONS = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "12",
  "14",
  "16",
  "18",
  "20",
  "25",
  "30",
] as const;

export const CEILING_HEIGHTS = [
  "2.5",
  "2.7",
  "2.8",
  "3.0",
  "3.2",
  "3.5",
  "4.0",
  "4.2",
  "4.5",
  "5.0",
  "6.0",
  "7.0",
  "8.0",
  "10.0",
  "12.0",
] as const;

export const CONDITIONS = [
  "Евроремонт",
  "Хороший ремонт",
  "Косметический ремонт",
  "Рабочее состояние",
  "Под чистовую отделку",
  "Shell & Core",
  "Требуется ремонт",
  "Без отделки",
  "Новое",
  "Без строений",
] as const;

export const RESIDENTIAL_CONDITIONS = [
  "Евроремонт",
  "Дизайнерский",
  "Хороший ремонт",
  "Косметический ремонт",
  "Требуется ремонт",
  "Черновая отделка",
  "Под чистовую отделку",
  "Без отделки",
  "Новое",
] as const;

export const LAYOUTS = [
  "Open-space",
  "Open-space + кабинеты",
  "Кабинетная",
  "Свободная планировка",
  "2 кабинета + приёмная",
  "Open-space + 2 кабинета",
  "Open-space + 3 кабинета",
  "Единое пространство",
  "Единое пространство + офис",
  "Студия",
  "Прямоугольная",
  "Г-образная",
  "Кабинеты + open-space",
  "Смешанная",
] as const;

export const PARKING_OPTIONS = [
  "Нет",
  "Наземный, 1 м/м",
  "Наземный, 2 м/м",
  "Наземный, 3 м/м",
  "Наземный, 5 м/м",
  "Наземный, 10 м/м",
  "Подземный",
  "Подземный, 1 м/м",
  "Подземный, 2 м/м",
  "Открытая, 5 м/м",
  "Открытая, 8 м/м",
  "Открытая, 10 м/м",
  "Открытая, 20 м/м",
  "Гостевая",
  "Бесплатная для арендаторов",
] as const;

export const DEPOSIT_OPTIONS = [
  "Нет",
  "1 месяц",
  "2 месяца",
  "3 месяца",
  "6 месяцев",
  "50%",
  "100%",
  "По договорённости",
] as const;

export const CONTRACT_TERMS = [
  "от 1 мес",
  "от 3 мес",
  "от 6 мес",
  "от 11 мес",
  "1 год",
  "2 года",
  "3 года",
  "4 года",
  "5 лет",
  "7 лет",
  "10 лет",
  "Бессрочный",
] as const;

/** Посуточная аренда — без «договор на 1 год» */
export const DAILY_DEPOSIT_OPTIONS = [
  "Нет",
  "1 сутки",
  "2 суток",
  "3 суток",
  "Фиксированная сумма",
  "По договорённости",
] as const;

export const DAILY_TERM_OPTIONS = [
  "от 1 суток",
  "от 2 суток",
  "от 3 суток",
  "от 7 суток",
  "от 14 суток",
  "от 30 суток",
  "По договорённости",
] as const;

export const UTILITIES_OPTIONS = [
  "Включены",
  "Отдельно",
  "По счётчикам",
  "Частично включены",
  "Не включены",
] as const;

export const VAT_OPTIONS = [
  "Не облагается",
  "20%",
  "Включён в ставку",
  "УСН",
  "Без НДС",
] as const;

export const INDEXATION_OPTIONS = [
  "Нет",
  "Раз в год",
  "Раз в 6 мес",
  "По индексу",
  "Не более 5%",
  "Не более 10%",
  "По договорённости",
] as const;

export const CONTRACT_FORM_OPTIONS = [
  "Краткосрочный",
  "Долгосрочный",
  "Бессрочный",
  "Субаренда",
  "Прямая аренда",
] as const;

export const LANDLORD_TYPES = [
  "Собственник",
  "Физ. лицо",
  "ИП",
  "Юр. лицо",
  "Управляющая компания",
  "Застройщик",
  "Банк",
  "Государство",
] as const;

export const SUBLEASE_OPTIONS = [
  "Разрешена",
  "Запрещена",
  "По согласованию",
  "Только с согласия арендодателя",
] as const;

export const PEDESTRIAN_TRAFFIC_LEVELS = [
  { value: 1, label: "1 — Низкий", short: "Низкий" },
  { value: 2, label: "2 — Средний", short: "Средний" },
  { value: 3, label: "3 — Высокий", short: "Высокий" },
  { value: 4, label: "4 — Очень высокий", short: "Очень высокий" },
] as const;

export const TRANSPORT_HUB_OPTIONS = [
  "Рядом остановка",
  "До 100 м",
  "100–250 м",
  "250–500 м",
  "500–1000 м",
  "Рядом Ж/Д вокзал",
  "Рядом автовокзал",
  "Рядом аэропорт",
  "Трамвайная линия",
  "Нет рядом",
] as const;

export const ENTRANCE_OPTIONS = [
  "С улицы",
  "Со двора",
  "Общий вход",
  "Отдельный вход",
  "Через БЦ",
  "Через ТЦ",
  "Второй этаж",
  "Цоколь",
] as const;

export const PURPOSE_OPTIONS = [
  "Офис",
  "Коворкинг",
  "Торговля",
  "Общепит",
  "Услуги",
  "Медицина",
  "Образование",
  "Склад",
  "Производство",
  "Автосервис",
  "Спорт",
  "Красота",
  "HoReCa",
  "Свободное назначение",
] as const;

export const ROOMS_OPTIONS = [
  "Студия",
  "1",
  "2",
  "3",
  "4+",
  "5",
  "6+",
] as const;

export const BUILDING_TYPES = [
  "Панельный",
  "Кирпичный",
  "Монолит",
  "Деревянный",
  "Блочный",
  "Монолит-кирпич",
] as const;

export const BALCONY_OPTIONS = [
  "Нет",
  "Балкон",
  "Лоджия",
  "Балкон и лоджия",
  "2 балкона",
] as const;
export const FURNITURE_OPTIONS = [
  "С мебелью",
  "Без мебели",
  "Частично",
] as const;
export const BATHROOM_OPTIONS = [
  "Совмещённый",
  "Раздельный",
  "2 санузла",
  "Несколько санузлов",
] as const;
export const WINDOW_VIEW_OPTIONS = [
  "Во двор",
  "На улицу",
  "На парк",
  "На реку",
  "На горы",
] as const;

export const FEATURE_GROUPS: { title: string; items: string[] }[] = [
  {
    title: "Инженерия и коммуникации",
    items: [
      "Кондиционирование",
      "Центральное кондиционирование",
      "Сплит-система",
      "Чиллер",
      "Отопление",
      "Центральное отопление",
      "Автономное отопление",
      "Вентиляция",
      "Приточно-вытяжная вентиляция",
      "Приточная вентиляция",
      "Интернет",
      "Оптоволокно",
      "Wi-Fi",
      "Телефония",
      "Электричество 15 кВт",
      "Электричество 25 кВт",
      "Электричество 40 кВт",
      "Электричество 63 кВт",
      "Электричество 80 кВт",
      "Электричество 100 кВт",
      "Электричество 150 кВт",
      "Электричество 200+ кВт",
      "Водоснабжение",
      "Канализация",
      "Горячая вода",
      "Газ",
    ],
  },
  {
    title: "Безопасность",
    items: [
      "Охрана",
      "Круглосуточная охрана",
      "Видеонаблюдение",
      "СКУД",
      "Пожарная сигнализация",
      "Охрана территории",
      "Охранная сигнализация",
      "Турникеты",
    ],
  },
  {
    title: "Парковка и доступ",
    items: [
      "Парковка",
      "Наземная парковка",
      "Подземная парковка",
      "Гостевая парковка",
      "Лифт",
      "Грузовой лифт",
      "Пассажирский лифт",
      "Эскалатор",
      "Рампа",
      "Погрузочная зона",
      "Грузовой подъезд",
      "Погрузка",
      "Ворота",
      "Доковые ворота",
      "Ворота 4×4 м",
      "Пандус",
      "Отдельный вход",
      "Вход с улицы",
      "Вход со двора",
    ],
  },
  {
    title: "Локация и трафик",
    items: [
      "Первая линия",
      "Вторая линия",
      "Угол здания",
      "Проходное место",
      "Высокий трафик",
      "Средний трафик",
      "ТЦ / БЦ",
      "Стрит-ритейл",
      "Витрины",
      "Фасадное остекление",
      "Вывеска",
      "Рекламное место",
      "Баннерное место",
    ],
  },
  {
    title: "Планировка и отделка",
    items: [
      "Open-space",
      "Кабинетная планировка",
      "Свободная планировка",
      "Смешанная планировка",
      "Мебель",
      "Мебель частично",
      "Кухня",
      "Кухня-столовая",
      "Санузел",
      "Душ",
      "Раздевалка",
      "Переговорная",
      "Ресепшн",
      "Серверная",
      "Архив",
      "Складское помещение",
      "Мокрая точка",
      "Вытяжка",
      "Кухонное оборудование",
      "Под чистовую",
    ],
  },
  {
    title: "Торговля и общепит",
    items: [
      "Витрины",
      "Входная группа",
      "Кассовая зона",
      "Склад при магазине",
      "Холодильное оборудование",
      "Торговое оборудование",
      "Кафе / бар зона",
      "Посадочные места",
      "Летняя веранда",
      "Алкогольная лицензия",
    ],
  },
  {
    title: "Склад и производство",
    items: [
      "Кран-балка",
      "Мостовой кран",
      "Высота потолков 6+ м",
      "Высота потолков 8+ м",
      "Полы под нагрузку",
      "Промышленный пол",
      "Тёплый склад",
      "Холодный склад",
      "Офисный блок",
      "Бытовые помещения",
      "Площадка для фур",
      "Ж/Д ветка",
    ],
  },
  {
    title: "Земельный участок",
    items: [
      "Электричество",
      "Водопровод",
      "Асфальтированный подъезд",
      "Ровный рельеф",
      "Коммерческое назначение",
      "Ограждение",
      "Охрана периметра",
      "Подъезд для фур",
      "Газопровод",
      "Кадастровый учёт",
      "Без обременений",
    ],
  },
];

export const RESIDENTIAL_FEATURE_GROUPS: { title: string; items: string[] }[] =
  [
    {
      title: "Комфорт",
      items: [
        "Балкон",
        "Лоджия",
        "Гардеробная",
        "Кондиционер",
        "Тёплый пол",
        "Кухня",
        "Мебель",
        "Техника",
      ],
    },
    {
      title: "Техника",
      items: [
        "Стиральная машина",
        "Холодильник",
        "Посудомоечная машина",
        "Телевизор",
        "Интернет",
      ],
    },
    {
      title: "Дом и двор",
      items: [
        "Лифт",
        "Грузовой лифт",
        "Консьерж",
        "Закрытый двор",
        "Детская площадка",
        "Парковка",
        "Подземная парковка",
        "Охрана",
      ],
    },
    {
      title: "Локация",
      items: [
        "Рядом школа",
        "Рядом детский сад",
        "Рядом парк",
        "Рядом остановка",
        "Центр города",
        "Вид на реку",
        "Тихий двор",
      ],
    },
    {
      title: "Дом / участок",
      items: ["Баня", "Гараж на участке", "Сад", "Огород"],
    },
  ];

export const FEATURES_LIST: string[] = Array.from(
  new Set(FEATURE_GROUPS.flatMap((g) => g.items)),
);

export const RESIDENTIAL_FEATURES_LIST: string[] = Array.from(
  new Set(RESIDENTIAL_FEATURE_GROUPS.flatMap((g) => g.items)),
);

export const CATALOG_FEATURES_PREVIEW = 5;

type FeatureGroup = { title: string; items: string[] };

const COMMERCIAL_GROUP_BY_TYPE: Record<string, string[]> = {
  Офис: [
    "Инженерия и коммуникации",
    "Безопасность",
    "Парковка и доступ",
    "Локация и трафик",
    "Планировка и отделка",
  ],
  Торговая: [
    "Инженерия и коммуникации",
    "Безопасность",
    "Парковка и доступ",
    "Локация и трафик",
    "Планировка и отделка",
    "Торговля и общепит",
  ],
  Склад: [
    "Инженерия и коммуникации",
    "Безопасность",
    "Парковка и доступ",
    "Склад и производство",
  ],
  Производство: [
    "Инженерия и коммуникации",
    "Безопасность",
    "Парковка и доступ",
    "Склад и производство",
  ],
  Земля: ["Земельный участок"],
};

const RESIDENTIAL_GROUP_BY_FAMILY = {
  flat: ["Комфорт", "Техника", "Дом и двор", "Локация"],
  house: ["Комфорт", "Техника", "Дом и двор", "Локация", "Дом / участок"],
  land: ["Дом / участок", "Локация"],
  parking: ["Дом и двор", "Локация"],
} as const;

function pickGroups(
  all: FeatureGroup[],
  titles: readonly string[],
): FeatureGroup[] {
  const set = new Set(titles);
  return all.filter((g) => set.has(g.title));
}

/** Группы особенностей под сегмент и выбранные типы объекта */
export function getFeatureGroupsFor(
  segment: "commercial" | "residential",
  types: string[],
): FeatureGroup[] {
  const primary = types[0] || (segment === "residential" ? "Квартира" : "Офис");

  if (segment === "residential") {
    if (primary === "Участок" || types.includes("Участок")) {
      return pickGroups(
        RESIDENTIAL_FEATURE_GROUPS,
        RESIDENTIAL_GROUP_BY_FAMILY.land,
      );
    }
    if (["Гараж", "Машиноместо"].includes(primary)) {
      return pickGroups(
        RESIDENTIAL_FEATURE_GROUPS,
        RESIDENTIAL_GROUP_BY_FAMILY.parking,
      );
    }
    if (["Дом", "Коттедж", "Дача", "Таунхаус"].includes(primary)) {
      return pickGroups(
        RESIDENTIAL_FEATURE_GROUPS,
        RESIDENTIAL_GROUP_BY_FAMILY.house,
      );
    }
    return pickGroups(
      RESIDENTIAL_FEATURE_GROUPS,
      RESIDENTIAL_GROUP_BY_FAMILY.flat,
    );
  }

  if (primary === "Земля" || types.includes("Земля")) {
    return pickGroups(FEATURE_GROUPS, COMMERCIAL_GROUP_BY_TYPE.Земля);
  }

  const titleSets = types
    .map((t) => COMMERCIAL_GROUP_BY_TYPE[t])
    .filter(Boolean);
  if (titleSets.length === 0) {
    return pickGroups(FEATURE_GROUPS, COMMERCIAL_GROUP_BY_TYPE.Офис);
  }
  const merged = new Set(titleSets.flat());
  return pickGroups(FEATURE_GROUPS, [...merged]);
}
