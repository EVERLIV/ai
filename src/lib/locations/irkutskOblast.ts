import {
  IRKUTSK_REGION_ID,
  IRKUTSK_REGION_NAME,
  type LocationKind,
  type LocationNode,
} from "@/lib/locations/types";

function node(
  id: string,
  name: string,
  kind: LocationKind,
  parentId: string | null,
  opts?: { lat?: number; lng?: number; aliases?: string[] },
): LocationNode {
  return {
    id,
    name,
    kind,
    parentId,
    lat: opts?.lat,
    lng: opts?.lng,
    aliases: opts?.aliases,
  };
}

const REGION = node(IRKUTSK_REGION_ID, IRKUTSK_REGION_NAME, "region", null, {
  lat: 52.2869,
  lng: 104.305,
});

function city(
  slug: string,
  name: string,
  lat: number,
  lng: number,
  aliases?: string[],
): LocationNode {
  return node(`city:${slug}`, name, "city", IRKUTSK_REGION_ID, {
    lat,
    lng,
    aliases,
  });
}

function child(
  parentSlug: string,
  slug: string,
  name: string,
  kind: LocationKind,
  opts?: { lat?: number; lng?: number; aliases?: string[] },
): LocationNode {
  return node(`loc:${parentSlug}:${slug}`, name, kind, `city:${parentSlug}`, opts);
}

/** Адм. районы Иркутска */
const IRKUTSK_DISTRICTS: LocationNode[] = [
  child("irkutsk", "kirovsky", "Кировский", "district", {
    lat: 52.289,
    lng: 104.28,
  }),
  child("irkutsk", "oktyabrsky", "Октябрьский", "district", {
    lat: 52.275,
    lng: 104.32,
  }),
  child("irkutsk", "sverdlovsky", "Свердловский", "district", {
    lat: 52.25,
    lng: 104.27,
  }),
  child("irkutsk", "leninsky", "Ленинский", "district", {
    lat: 52.34,
    lng: 104.2,
  }),
  child("irkutsk", "kuybyshevsky", "Куйбышевский", "district", {
    lat: 52.3,
    lng: 104.35,
  }),
];

const IRKUTSK_MICROS: { slug: string; name: string }[] = [
  { slug: "center", name: "Центр" },
  { slug: "130", name: "130-й квартал" },
  { slug: "solnechny", name: "Солнечный" },
  { slug: "solnechny-2", name: "Солнечный-2" },
  { slug: "university", name: "Университетский" },
  { slug: "pervomaysky", name: "Первомайский" },
  { slug: "yubileyny", name: "Юбилейный" },
  { slug: "baykalsky", name: "Байкальский" },
  { slug: "novo-lenino", name: "Ново-Ленино" },
  { slug: "sinyushina", name: "Синюшина гора" },
  { slug: "radishchevo", name: "Радищево" },
  { slug: "lisiha", name: "Лисиха" },
  { slug: "rabochee", name: "Рабочее" },
  { slug: "marata", name: "Марата" },
  { slug: "maratovsky", name: "Маратовский" },
  { slug: "studgorodok", name: "Студгородок" },
  { slug: "akadem", name: "Академгородок" },
  { slug: "irkutsk-2", name: "Иркутск-II" },
  { slug: "novo-irkutsk", name: "Ново-Иркутск" },
  { slug: "glazkovo", name: "Глазково" },
  { slug: "kuzmiha", name: "Кузьмиха" },
  { slug: "topkinsky", name: "Топкинский" },
  { slug: "topka", name: "Топка" },
  { slug: "patrony", name: "Патроны" },
  { slug: "ershi", name: "Ерши" },
  { slug: "ershovsky", name: "Ершовский" },
  { slug: "veresovka", name: "Вересовка" },
  { slug: "zeleny", name: "Зелёный" },
  { slug: "berezovy", name: "Берёзовый" },
  { slug: "primorsky", name: "Приморский" },
  { slug: "zhilkino", name: "Жилкино" },
  { slug: "melnikovo", name: "Мельниково" },
  { slug: "kirova", name: "Кирова" },
  { slug: "irkutny", name: "Иркутный" },
  { slug: "lesnoy", name: "Лесной" },
  { slug: "sverdlova", name: "Свердлова" },
  { slug: "bokovo", name: "Боково" },
  { slug: "kaiskaya", name: "Кайская роща" },
  { slug: "zvyozdochka", name: "Звёздочка" },
  { slug: "komsomolsky", name: "Комсомольский" },
  { slug: "innokentyevsky", name: "Иннокентьевский" },
];

/** Районы / поселения Ангарска (Китой — не отдельный город области) */
const ANGARSK_LOCALITIES: LocationNode[] = [
  child("angarsk", "kitoy", "Китой", "settlement", {
    lat: 52.535,
    lng: 103.92,
    aliases: ["р-н Китой", "Ангарск Китой", "пос. Китой"],
  }),
  child("angarsk", "maysk", "Майск", "settlement", {
    lat: 52.52,
    lng: 103.95,
    aliases: ["пос. Майск"],
  }),
  child("angarsk", "center", "Центр", "district", {
    lat: 52.545,
    lng: 103.888,
  }),
  child("angarsk", "yugo-zapad", "Юго-Западный", "district", {
    lat: 52.53,
    lng: 103.87,
  }),
  child("angarsk", "novy", "Новый", "district"),
  child("angarsk", "staraya-angara", "Старая Ангара", "settlement"),
];

type CityDef = {
  slug: string;
  name: string;
  lat: number;
  lng: number;
  aliases?: string[];
};

const CITIES: CityDef[] = [
  { slug: "irkutsk", name: "Иркутск", lat: 52.2869, lng: 104.305 },
  { slug: "angarsk", name: "Ангарск", lat: 52.5444, lng: 103.8886 },
  { slug: "bratsk", name: "Братск", lat: 56.1325, lng: 101.6142 },
  { slug: "ust-ilimsk", name: "Усть-Илимск", lat: 58.0, lng: 102.6667 },
  {
    slug: "usolie",
    name: "Усолье-Сибирское",
    lat: 52.7531,
    lng: 103.6483,
    aliases: ["Усолье"],
  },
  { slug: "cheremkhovo", name: "Черемхово", lat: 53.15, lng: 103.0667 },
  { slug: "shelekhov", name: "Шелехов", lat: 52.2139, lng: 104.1 },
  { slug: "tulun", name: "Тулун", lat: 54.5667, lng: 100.5667 },
  { slug: "sayansk", name: "Саянск", lat: 54.1167, lng: 101.7 },
  { slug: "nizhneudinsk", name: "Нижнеудинск", lat: 54.9, lng: 99.0333 },
  { slug: "tayshet", name: "Тайшет", lat: 55.9333, lng: 98.0167 },
  { slug: "zima", name: "Зима", lat: 53.9167, lng: 102.05 },
  { slug: "vikhorevka", name: "Вихоревка", lat: 56.1167, lng: 101.2 },
  { slug: "sludyanka", name: "Слюдянка", lat: 51.65, lng: 103.7 },
  { slug: "baykalsk", name: "Байкальск", lat: 51.5167, lng: 104.15 },
  { slug: "svirsk", name: "Свирск", lat: 53.0833, lng: 103.3333 },
  { slug: "alzamay", name: "Алзамай", lat: 55.55, lng: 98.6667 },
  { slug: "biryusinsk", name: "Бирюсинск", lat: 55.9667, lng: 97.8167 },
  {
    slug: "zheleznogorsk",
    name: "Железногорск-Илимский",
    lat: 56.5833,
    lng: 104.1333,
  },
  { slug: "kirensk", name: "Киренск", lat: 57.7833, lng: 108.1 },
  { slug: "ust-kut", name: "Усть-Кут", lat: 56.7833, lng: 105.7667 },
  { slug: "bodaibo", name: "Бодайбо", lat: 57.85, lng: 114.2 },
  {
    slug: "ust-ordynsky",
    name: "Усть-Ордынский",
    lat: 52.8167,
    lng: 104.75,
  },
  { slug: "listvyanka", name: "Листвянка", lat: 51.8667, lng: 104.85 },
  { slug: "khuzhir", name: "Хужир", lat: 53.2, lng: 107.35 },
  { slug: "yelantsy", name: "Еланцы", lat: 52.8, lng: 106.45 },
  { slug: "kultuk", name: "Култук", lat: 51.7167, lng: 103.7 },
  {
    slug: "bolshoe-goloustnoe",
    name: "Большое Голоустное",
    lat: 52.0333,
    lng: 105.4,
  },
  { slug: "kachug", name: "Качуг", lat: 53.9667, lng: 105.8667 },
  { slug: "balagansk", name: "Балаганск", lat: 54.0, lng: 103.05 },
  { slug: "zalari", name: "Залари", lat: 53.5667, lng: 102.5 },
  { slug: "kutulik", name: "Кутулик", lat: 53.35, lng: 102.7833 },
  { slug: "oyek", name: "Оёк", lat: 52.5833, lng: 104.45 },
  { slug: "khomutovo", name: "Хомутово", lat: 52.4667, lng: 104.4 },
  { slug: "smolenshchina", name: "Смоленщина", lat: 52.25, lng: 104.2 },
  { slug: "pivovarikha", name: "Пивовариха", lat: 52.2667, lng: 104.45 },
  { slug: "markova", name: "Маркова", lat: 52.2167, lng: 104.4 },
  { slug: "dzerzhinsk", name: "Дзержинск", lat: 52.3, lng: 104.15 },
  { slug: "meget", name: "Мегет", lat: 52.4167, lng: 104.15 },
  { slug: "mishelyovka", name: "Мишелёвка", lat: 52.85, lng: 103.2 },
  { slug: "telma", name: "Тельма", lat: 52.7, lng: 103.7 },
  { slug: "sredny", name: "Средний", lat: 52.9, lng: 103.3 },
];

/** Муниципальные районы области (как населённые узлы-города для выбора) */
const OBLAST_RAYONS: { slug: string; name: string }[] = [
  { slug: "angarsky-rayon", name: "Ангарский район" },
  { slug: "balagansky-rayon", name: "Балаганский район" },
  { slug: "bodaibinsky-rayon", name: "Бодайбинский район" },
  { slug: "bratsky-rayon", name: "Братский район" },
  { slug: "zhigalovsky-rayon", name: "Жигаловский район" },
  { slug: "zalarinsky-rayon", name: "Заларинский район" },
  { slug: "ziminsky-rayon", name: "Зиминский район" },
  { slug: "irkutsky-rayon", name: "Иркутский район" },
  { slug: "kazachinsko-lensky-rayon", name: "Казачинско-Ленский район" },
  { slug: "katangsky-rayon", name: "Катангский район" },
  { slug: "kachugsky-rayon", name: "Качугский район" },
  { slug: "kirensky-rayon", name: "Киренский район" },
  { slug: "kuytuhsky-rayon", name: "Куйтунский район" },
  { slug: "mamsko-chuysky-rayon", name: "Мамско-Чуйский район" },
  { slug: "nizhneilimsky-rayon", name: "Нижнеилимский район" },
  { slug: "nizhneudinsky-rayon", name: "Нижнеудинский район" },
  { slug: "olkhonsky-rayon", name: "Ольхонский район" },
  { slug: "sludyansky-rayon", name: "Слюдянский район" },
  { slug: "tayshetsky-rayon", name: "Тайшетский район" },
  { slug: "tulunsky-rayon", name: "Тулунский район" },
  { slug: "usolsky-rayon", name: "Усольский район" },
  { slug: "ust-ilimsky-rayon", name: "Усть-Илимский район" },
  { slug: "ust-kutsky-rayon", name: "Усть-Кутский район" },
  { slug: "ust-udinsky-rayon", name: "Усть-Удинский район" },
  { slug: "cheremkhovsky-rayon", name: "Черемховский район" },
  { slug: "chunsky-rayon", name: "Чунский район" },
  { slug: "shelekhovsky-rayon", name: "Шелеховский район" },
  { slug: "alarsky-rayon", name: "Аларский район" },
  { slug: "bayandayevsky-rayon", name: "Баяндаевский район" },
  { slug: "bokhansky-rayon", name: "Боханский район" },
  { slug: "nukutsky-rayon", name: "Нукутский район" },
  { slug: "osinsky-rayon", name: "Осинский район" },
  { slug: "ekhirit-bulagatsky-rayon", name: "Эхирит-Булагатский район" },
];

function buildNodes(): LocationNode[] {
  const out: LocationNode[] = [REGION];

  for (const c of CITIES) {
    out.push(city(c.slug, c.name, c.lat, c.lng, c.aliases));
  }

  out.push(...IRKUTSK_DISTRICTS);
  for (const m of IRKUTSK_MICROS) {
    out.push(child("irkutsk", m.slug, m.name, "microdistrict"));
  }
  out.push(...ANGARSK_LOCALITIES);

  for (const r of OBLAST_RAYONS) {
    out.push(
      node(`rayon:${r.slug}`, r.name, "district", IRKUTSK_REGION_ID, {
        aliases: [r.name.replace(/ район$/i, "")],
      }),
    );
  }

  return out;
}

/** Полный справочник локаций Иркутской области */
export const IRKUTSK_LOCATION_NODES: readonly LocationNode[] = buildNodes();
