/** Локации Иркутска и Иркутской области для поля district (город / район / мкр). */

export type LocationGroup = {
  label: string;
  items: readonly string[];
};

/** Административные районы г. Иркутска */
export const IRKUTSK_CITY_DISTRICTS = [
  "Кировский",
  "Октябрьский",
  "Свердловский",
  "Ленинский",
  "Куйбышевский",
] as const;

/** Микрорайоны и местности г. Иркутска */
export const IRKUTSK_MICRODISTRICTS = [
  "Центр",
  "130-й квартал",
  "Солнечный",
  "Солнечный-2",
  "Университетский",
  "Первомайский",
  "Юбилейный",
  "Байкальский",
  "Ново-Ленино",
  "Синюшина гора",
  "Радищево",
  "Лисиха",
  "Рабочее",
  "Марата",
  "Маратовский",
  "Студгородок",
  "Академгородок",
  "Иркутск-II",
  "Ново-Иркутск",
  "Глазково",
  "Кузьмиха",
  "Топкинский",
  "Топка",
  "Патроны",
  "Ерши",
  "Ершовский",
  "Вересовка",
  "Зелёный",
  "Берёзовый",
  "Приморский",
  "Жилкино",
  "Мельниково",
  "Кирова",
  "Иркутный",
  "Лесной",
  "Свердлова",
  "Боково",
  "Кайская роща",
  "Звёздочка",
  "Комсомольский",
  "Иннокентьевский",
] as const;

/** Города и крупные пгт Иркутской области */
export const IRKUTSK_OBLAST_CITIES = [
  "Ангарск",
  "Братск",
  "Усть-Илимск",
  "Усолье-Сибирское",
  "Черемхово",
  "Шелехов",
  "Тулун",
  "Саянск",
  "Нижнеудинск",
  "Тайшет",
  "Зима",
  "Вихоревка",
  "Слюдянка",
  "Байкальск",
  "Свирск",
  "Алзамай",
  "Бирюсинск",
  "Железногорск-Илимский",
  "Киренск",
  "Усть-Кут",
  "Бодайбо",
  "Усть-Ордынский",
  "Листвянка",
  "Хужир",
  "Еланцы",
  "Култук",
  "Большое Голоустное",
  "Качуг",
  "Балаганск",
  "Залари",
  "Кутулик",
  "Оёк",
  "Хомутово",
  "Смоленщина",
  "Пивовариха",
  "Маркова",
  "Дзержинск",
  "Мегет",
  "Мишелёвка",
  "Тельма",
  "Средний",
  "Китой",
] as const;

/** Муниципальные районы Иркутской области */
export const IRKUTSK_OBLAST_DISTRICTS = [
  "Ангарский район",
  "Балаганский район",
  "Бодайбинский район",
  "Братский район",
  "Жигаловский район",
  "Заларинский район",
  "Зиминский район",
  "Иркутский район",
  "Казачинско-Ленский район",
  "Катангский район",
  "Качугский район",
  "Киренский район",
  "Куйтунский район",
  "Мамско-Чуйский район",
  "Нижнеилимский район",
  "Нижнеудинский район",
  "Ольхонский район",
  "Слюдянский район",
  "Тайшетский район",
  "Тулунский район",
  "Усольский район",
  "Усть-Илимский район",
  "Усть-Кутский район",
  "Усть-Удинский район",
  "Черемховский район",
  "Чунский район",
  "Шелеховский район",
  "Аларский район",
  "Баяндаевский район",
  "Боханский район",
  "Нукутский район",
  "Осинский район",
  "Эхирит-Булагатский район",
] as const;

export const LOCATION_GROUPS: LocationGroup[] = [
  { label: "г. Иркутск — районы", items: IRKUTSK_CITY_DISTRICTS },
  { label: "г. Иркутск — микрорайоны", items: IRKUTSK_MICRODISTRICTS },
  { label: "Города и посёлки области", items: IRKUTSK_OBLAST_CITIES },
  { label: "Районы Иркутской области", items: IRKUTSK_OBLAST_DISTRICTS },
];

/** Плоский список для совместимости с фильтрами и старыми формами */
export const DISTRICTS: readonly string[] = Array.from(
  new Set(LOCATION_GROUPS.flatMap((g) => [...g.items])),
);

const CITY_HINTS: { needle: RegExp; district: string }[] = [
  { needle: /\bангарск/i, district: "Ангарск" },
  { needle: /\bбратск/i, district: "Братск" },
  { needle: /\bусть[-\s]?илимск/i, district: "Усть-Илимск" },
  { needle: /\bусолье/i, district: "Усолье-Сибирское" },
  { needle: /\bшелехов/i, district: "Шелехов" },
  { needle: /\bчеремхов/i, district: "Черемхово" },
  { needle: /\bтулун/i, district: "Тулун" },
  { needle: /\bсаянск/i, district: "Саянск" },
  { needle: /\bнижнеудинск/i, district: "Нижнеудинск" },
  { needle: /\bтайшет/i, district: "Тайшет" },
  { needle: /\bзима\b/i, district: "Зима" },
  { needle: /\bслюдянк/i, district: "Слюдянка" },
  { needle: /\bбайкальск/i, district: "Байкальск" },
  { needle: /\bлиствянк/i, district: "Листвянка" },
  { needle: /\bхужир/i, district: "Хужир" },
  { needle: /\bмаркова/i, district: "Маркова" },
  { needle: /\bхомутов/i, district: "Хомутово" },
  { needle: /\bусть[-\s]?ордын/i, district: "Усть-Ордынский" },
  { needle: /\bусть[-\s]?кут/i, district: "Усть-Кут" },
  { needle: /\bбодайбо/i, district: "Бодайбо" },
];

const IRKUTSK_AREA_HINTS: { needle: RegExp; district: string }[] = [
  { needle: /кировск/i, district: "Кировский" },
  { needle: /октябрьск/i, district: "Октябрьский" },
  { needle: /свердловск/i, district: "Свердловский" },
  { needle: /ленинск/i, district: "Ленинский" },
  { needle: /куйбышевск/i, district: "Куйбышевский" },
  { needle: /солнечн/i, district: "Солнечный" },
  { needle: /университетск/i, district: "Университетский" },
  { needle: /ново[-\s]?ленино/i, district: "Ново-Ленино" },
  { needle: /синюшин/i, district: "Синюшина гора" },
  { needle: /академгород/i, district: "Академгородок" },
  { needle: /студгород/i, district: "Студгородок" },
  { needle: /глазков/i, district: "Глазково" },
  { needle: /лисих/i, district: "Лисиха" },
  { needle: /жилкин/i, district: "Жилкино" },
  { needle: /байкальск/i, district: "Байкальский" },
  { needle: /первомайск/i, district: "Первомайский" },
  { needle: /юбилейн/i, district: "Юбилейный" },
  { needle: /130/i, district: "130-й квартал" },
];

/** Подставить район/город из текста адреса Яндекса */
export function inferDistrictFromAddress(
  address: string,
  fallback = "Кировский",
): string {
  const text = address.trim();
  if (!text) return fallback;

  for (const { needle, district } of CITY_HINTS) {
    if (needle.test(text)) return district;
  }

  const looksLikeIrkutsk =
    /иркутск/i.test(text) || !CITY_HINTS.some((h) => h.needle.test(text));
  if (looksLikeIrkutsk) {
    for (const { needle, district } of IRKUTSK_AREA_HINTS) {
      if (needle.test(text)) return district;
    }
  }

  const exact = DISTRICTS.find((d) =>
    text.toLowerCase().includes(d.toLowerCase()),
  );
  return exact || fallback;
}
