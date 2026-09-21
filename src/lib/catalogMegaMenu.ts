import { SEGMENT_ROUTES } from "@/config/propertySegments";
import { buildCatalogUrl } from "@/lib/catalogPaths";
import { placementCtaPath } from "@/lib/listPropertyLinks";

export type MegaLink = { label: string; href: string };
export type MegaSection = { title: string; links: MegaLink[] };
export type MegaColumn = { sections: MegaSection[] };
export type MegaPromo = {
  title: string;
  text: string;
  cta: string;
  href: string;
};
export type MegaMenuConfig = {
  id: string;
  triggerLabel: string;
  catalogHref: string;
  columns: MegaColumn[];
  /** Правая колонка «Сервисы» или доп. ссылки */
  aside?: MegaSection;
  promo?: MegaPromo;
  /** Подсветка пункта при этих путях / query */
  match?: (pathname: string, search: string) => boolean;
};

export type MainNavMegaMenuOptions = {
  isLoggedIn?: boolean;
  /** Типы из справочника property_type (commercial) — меню строится по ним */
  commercialTypes?: string[];
};

function r(params: Parameters<typeof buildCatalogUrl>[0]) {
  return buildCatalogUrl({ segment: "residential", ...params });
}

function c(params: Parameters<typeof buildCatalogUrl>[0]) {
  return buildCatalogUrl({ segment: "commercial", ...params });
}

function pathDealIs(pathname: string, dealSlug: "kupit" | "snyat" | "posutochno") {
  return pathname.startsWith(`/${dealSlug}/`);
}

function marketIs(search: string, market: string) {
  const m = new URLSearchParams(search).get("market") || "";
  return m.includes(market);
}

/** Подпись в меню для типа из справочника */
export function commercialTypeMenuLabel(type: string): string {
  const map: Record<string, string> = {
    Офис: "Офисы",
    Торговая: "Торговые площади",
    Склад: "Склады",
    Производство: "Производство",
    Павильон: "Павильоны",
    ПСН: "ПСН",
    Общепит: "Общепит",
    Автосервис: "Автосервис",
    "Свободного назначения": "Свободного назначения",
  };
  return map[type] || type;
}

/** Лендинг или фильтр каталога для коммерческого типа */
export function commercialTypeHref(
  type: string,
  deal?: "Аренда" | "Продажа",
): string {
  return c({ types: type, ...(deal ? { deal } : { deal: "Аренда" }) });
}

function commercialDealLinks(
  types: string[],
  deal: "Аренда" | "Продажа",
): MegaLink[] {
  const links = types.map((type) => ({
    label: commercialTypeMenuLabel(type),
    href: commercialTypeHref(type, deal),
  }));
  links.push({ label: "Весь каталог", href: c({ deal }) });
  return links;
}

/** Верхнее меню в стиле агрегатора: Аренда / Продажа / Новостройки… */
export function getMainNavMegaMenus(
  options: MainNavMegaMenuOptions | boolean = {},
): MegaMenuConfig[] {
  const opts: MainNavMegaMenuOptions =
    typeof options === "boolean" ? { isLoggedIn: options } : options;
  const isLoggedIn = !!opts.isLoggedIn;
  const commercialTypes = (
    opts.commercialTypes?.length
      ? opts.commercialTypes
      : ["Офис", "Торговая", "Склад", "Производство", "Павильон", "ПСН"]
  ).filter((t) => t !== "Земля" && t !== "Участок");

  const listRent = placementCtaPath("residential", "rent", isLoggedIn);
  const listSale = placementCtaPath("residential", "sale", isLoggedIn);
  const listCommercial = placementCtaPath("commercial", "rent", isLoggedIn);
  const listLand = placementCtaPath("land", "rent", isLoggedIn);

  return [
    {
      id: "rent",
      triggerLabel: "Аренда",
      catalogHref: r({ deal: "Аренда" }),
      match: (pathname) =>
        pathDealIs(pathname, "snyat") &&
        !pathname.includes("/kommercheskaya") &&
        !pathname.includes("/zemlya"),
      columns: [
        {
          sections: [
            {
              title: "Длительная аренда",
              links: [
                {
                  label: "Квартиры",
                  href: r({ types: "Квартира", deal: "Аренда" }),
                },
                {
                  label: "Комнаты",
                  href: r({ types: "Комната", deal: "Аренда" }),
                },
                {
                  label: "Дома и коттеджи",
                  href: r({
                    types: ["Дом", "Дача", "Коттедж"],
                    deal: "Аренда",
                  }),
                },
                {
                  label: "Апартаменты",
                  href: r({ types: "Апартаменты", deal: "Аренда" }),
                },
              ],
            },
            {
              title: "Посуточная аренда",
              links: [
                {
                  label: "Квартиры посуточно",
                  href: r({ types: "Квартира", deal: "Посуточно" }),
                },
                {
                  label: "Дома посуточно",
                  href: r({
                    types: ["Дом", "Дача", "Коттедж"],
                    deal: "Посуточно",
                  }),
                },
              ],
            },
            {
              title: "Сдать",
              links: [
                { label: "Сдать квартиру или дом", href: listRent },
              ],
            },
          ],
        },
        {
          sections: [
            {
              title: "Полезное",
              links: [
                { label: "Умный подбор жилья", href: "#ai-wizard" },
                { label: "Каталог риелторов", href: "/rieltory" },
                { label: "Новости рынка", href: "/news" },
                { label: "Весь каталог жилья", href: r({ deal: "Аренда" }) },
              ],
            },
          ],
        },
      ],
      promo: {
        title: "Сдайте жильё за 0 ₽",
        text: "Разместите объявление бесплатно — заявки приходят напрямую",
        cta: "Разместить",
        href: listRent,
      },
    },
    {
      id: "sale",
      triggerLabel: "Продажа",
      catalogHref: r({ deal: "Продажа" }),
      match: (pathname, search) =>
        (pathDealIs(pathname, "kupit") &&
          !pathname.includes("/kommercheskaya") &&
          !pathname.includes("/zemlya") &&
          !pathname.includes("/novostroyki") &&
          !marketIs(search, "На заказ")) ||
        false,
      columns: [
        {
          sections: [
            {
              title: "Купить",
              links: [
                {
                  label: "Квартиры",
                  href: r({ types: "Квартира", deal: "Продажа" }),
                },
                {
                  label: "Комнаты",
                  href: r({ types: "Комната", deal: "Продажа" }),
                },
                {
                  label: "Дома и коттеджи",
                  href: r({
                    types: ["Дом", "Дача", "Коттедж"],
                    deal: "Продажа",
                  }),
                },
                {
                  label: "Дом на заказ",
                  href: r({
                    types: ["Дом", "Дача", "Коттедж"],
                    market: "На заказ",
                    deal: "Продажа",
                  }),
                },
                {
                  label: "Апартаменты",
                  href: r({ types: "Апартаменты", deal: "Продажа" }),
                },
                {
                  label: "Таунхаусы",
                  href: r({ types: "Таунхаус", deal: "Продажа" }),
                },
              ],
            },
            {
              title: "Продать",
              links: [
                { label: "Продать жильё", href: listSale },
              ],
            },
          ],
        },
        {
          sections: [
            {
              title: "Полезное",
              links: [
                { label: "Умный подбор", href: "#ai-wizard" },
                { label: "Риелторы", href: "/rieltory" },
                { label: "Весь каталог", href: r({ deal: "Продажа" }) },
              ],
            },
          ],
        },
      ],
      promo: {
        title: "Продайте за 0 ₽",
        text: "Разместите объявление — покупатели найдут вас сами",
        cta: "Разместить",
        href: listSale,
      },
    },
    {
      id: "newbuilds",
      triggerLabel: "Новостройки",
      catalogHref: "/kupit/kvartiry/novostroyki",
      match: (pathname) =>
        pathname.includes("/novostroyki") || pathname.includes("/vtorichka"),
      columns: [
        {
          sections: [
            {
              title: "Новостройки",
              links: [
                {
                  label: "Все новостройки",
                  href: "/kupit/kvartiry/novostroyki",
                },
                {
                  label: "Квартиры (вторичка)",
                  href: "/kupit/kvartiry/vtorichka",
                },
                {
                  label: "Дом на заказ",
                  href: "/kupit/doma/na-zakaz",
                },
                { label: "Застройщики", href: "/zastroyshchiki" },
              ],
            },
          ],
        },
        {
          sections: [
            {
              title: "Сервисы",
              links: [
                { label: "Подбор новостройки", href: "#ai-wizard" },
                { label: "Риелторы", href: "/rieltory" },
              ],
            },
          ],
        },
      ],
      promo: {
        title: "Подберём новостройку",
        text: "Оставьте заявку — специалист подберёт варианты под ваш бюджет",
        cta: "Оставить заявку",
        href: "/rieltory",
      },
    },
    {
      id: "houses",
      triggerLabel: "Дома",
      catalogHref: r({ types: ["Дом", "Коттедж", "Дача"] }),
      match: (pathname, search) => {
        if (pathname.includes("/zemlya") || pathname.startsWith("/land"))
          return false;
        if (marketIs(search, "На заказ")) return true;
        return pathname.includes("/doma");
      },
      columns: [
        {
          sections: [
            {
              title: "Дома",
              links: [
                {
                  label: "Купить дом",
                  href: r({
                    types: ["Дом", "Коттедж", "Дача"],
                    deal: "Продажа",
                  }),
                },
                {
                  label: "Снять дом",
                  href: r({
                    types: ["Дом", "Коттедж", "Дача"],
                    deal: "Аренда",
                  }),
                },
                {
                  label: "Дом на заказ",
                  href: "/kupit/doma/na-zakaz",
                },
                {
                  label: "Таунхаусы",
                  href: "/kupit/doma/taunhausy",
                },
              ],
            },
          ],
        },
        {
          sections: [
            {
              title: "На заказ",
              links: [
                {
                  label: "Все дома на заказ",
                  href: "/kupit/doma/na-zakaz",
                },
                {
                  label: "Деревянные / каркас",
                  href: "/zastroyshchiki?tab=derevo",
                },
                {
                  label: "Застройщики домов",
                  href: "/zastroyshchiki",
                },
              ],
            },
            {
              title: "Сервисы",
              links: [
                { label: "Разместить дом", href: listRent },
                { label: "Риелторы", href: "/rieltory" },
                {
                  label: "Каталог земли",
                  href: buildCatalogUrl({ segment: "land" }),
                },
              ],
            },
          ],
        },
      ],
      promo: {
        title: "Дом на заказ",
        text: "Индивидуальная сборка: каркас, брус, модули — под ваш участок",
        cta: "Смотреть",
        href: "/kupit/doma/na-zakaz",
      },
    },
    {
      id: "commercial",
      triggerLabel: "Коммерческая",
      catalogHref: SEGMENT_ROUTES.commercial.catalog,
      match: (pathname) =>
        pathname.includes("/kommercheskaya") ||
        pathname.startsWith("/catalog") ||
        pathname.startsWith("/offices") ||
        pathname.startsWith("/retail") ||
        pathname.startsWith("/warehouses"),
      columns: [
        {
          sections: [
            {
              title: "Снять",
              links: commercialDealLinks(commercialTypes, "Аренда"),
            },
            {
              title: "Купить",
              links: commercialDealLinks(commercialTypes, "Продажа"),
            },
          ],
        },
        {
          sections: [
            {
              title: "Сервисы",
              links: [
                { label: "Умный подбор", href: "#ai-wizard" },
                { label: "Разместить за 0 ₽", href: listCommercial },
                { label: "Риелторы", href: "/rieltory" },
              ],
            },
          ],
        },
      ],
      promo: {
        title: "Сдайте коммерцию за 0 ₽",
        text: "Офис, склад, павильон или производство — объявление бесплатно",
        cta: "Разместить",
        href: listCommercial,
      },
    },
    {
      id: "land",
      triggerLabel: "Земля",
      catalogHref: SEGMENT_ROUTES.land.catalog,
      match: (pathname) =>
        pathname.includes("/zemlya") ||
        pathname.startsWith("/land") ||
        pathname.startsWith("/zemlya"),
      columns: [
        {
          sections: [
            {
              title: "Каталог",
              links: [
                {
                  label: "Все участки",
                  href: buildCatalogUrl({ segment: "land" }),
                },
                {
                  label: "ИЖС",
                  href: buildCatalogUrl({
                    segment: "land",
                    landUse: "ИЖС",
                  }),
                },
                {
                  label: "Жилая",
                  href: buildCatalogUrl({
                    segment: "land",
                    landUse: "Жилая",
                  }),
                },
                {
                  label: "Коммерческая",
                  href: buildCatalogUrl({
                    segment: "land",
                    landUse: "Коммерческая",
                  }),
                },
                {
                  label: "Сельхоз",
                  href: buildCatalogUrl({
                    segment: "land",
                    landUse: "Сельскохозяйственная",
                  }),
                },
              ],
            },
            {
              title: "Тип",
              links: [
                {
                  label: "Земля",
                  href: buildCatalogUrl({ segment: "land", types: "Земля" }),
                },
                {
                  label: "Участок",
                  href: buildCatalogUrl({
                    segment: "land",
                    types: "Участок",
                  }),
                },
              ],
            },
          ],
        },
        {
          sections: [
            {
              title: "Сервисы",
              links: [
                {
                  label: "Разместить участок",
                  href: listLand,
                },
                { label: "Риелторы", href: "/rieltory" },
              ],
            },
          ],
        },
      ],
      promo: {
        title: "Разместите участок за 0 ₽",
        text: "ИЖС, жилая или коммерческая земля — объявление бесплатно",
        cta: "Разместить",
        href: listLand,
      },
    },
  ];
}

/** @deprecated единое меню «Недвижимость» — оставлено для совместимости */
export function getCatalogMegaMenu(isLoggedIn = false): MegaMenuConfig & {
  services: MegaSection;
} {
  const menus = getMainNavMegaMenus({ isLoggedIn });
  const commercial = menus.find((m) => m.id === "commercial")!;
  return {
    ...commercial,
    triggerLabel: "Недвижимость",
    services: commercial.columns[1]?.sections[0] ?? {
      title: "Сервисы",
      links: [],
    },
  };
}
