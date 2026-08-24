import { SEGMENT_ROUTES } from "@/config/propertySegments";
import { buildCatalogUrl } from "@/lib/catalogLinks";
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

function r(params: Parameters<typeof buildCatalogUrl>[0]) {
  return buildCatalogUrl({ segment: "residential", ...params });
}

function c(params: Parameters<typeof buildCatalogUrl>[0]) {
  return buildCatalogUrl({ segment: "commercial", ...params });
}

function dealIs(search: string, deal: string) {
  return new URLSearchParams(search).get("deal") === deal;
}

function marketIs(search: string, market: string) {
  const m = new URLSearchParams(search).get("market") || "";
  return m.includes(market);
}

/** Верхнее меню в стиле агрегатора: Аренда / Продажа / Новостройки… */
export function getMainNavMegaMenus(isLoggedIn = false): MegaMenuConfig[] {
  const listRent = placementCtaPath("residential", "rent", isLoggedIn);
  const listSale = placementCtaPath("residential", "sale", isLoggedIn);
  const listCommercial = placementCtaPath("commercial", "rent", isLoggedIn);

  return [
    {
      id: "rent",
      triggerLabel: "Аренда",
      catalogHref: r({ deal: "Аренда" }),
      match: (pathname, search) =>
        (pathname.startsWith("/zhilaya") || pathname === "/catalog") &&
        dealIs(search, "Аренда"),
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
                {
                  label: "Передать в управление",
                  href: placementCtaPath(
                    "residential",
                    "management",
                    isLoggedIn,
                  ),
                },
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
        (pathname.startsWith("/zhilaya") || pathname === "/catalog") &&
        dealIs(search, "Продажа") &&
        !marketIs(search, "Новостройка"),
      columns: [
        {
          sections: [
            {
              title: "Купить жильё",
              links: [
                {
                  label: "Квартиры",
                  href: r({ types: "Квартира", deal: "Продажа" }),
                },
                {
                  label: "Вторичка",
                  href: r({
                    types: "Квартира",
                    market: "Вторичка",
                    deal: "Продажа",
                  }),
                },
                {
                  label: "Комнаты",
                  href: r({ types: "Комната", deal: "Продажа" }),
                },
                {
                  label: "Апартаменты",
                  href: r({ types: "Апартаменты", deal: "Продажа" }),
                },
                {
                  label: "Дома и коттеджи",
                  href: r({
                    types: ["Дом", "Дача", "Коттедж"],
                    deal: "Продажа",
                  }),
                },
                {
                  label: "Таунхаусы",
                  href: r({ types: "Таунхаус", deal: "Продажа" }),
                },
              ],
            },
            {
              title: "Продать",
              links: [{ label: "Продать жильё", href: listSale }],
            },
          ],
        },
        {
          sections: [
            {
              title: "Полезное",
              links: [
                { label: "Умный подбор", href: "#ai-wizard" },
                { label: "Каталог риелторов", href: "/rieltory" },
                { label: "Новости", href: "/news" },
              ],
            },
          ],
        },
      ],
      promo: {
        title: "Продайте объект за 0 ₽",
        text: "Объявление в каталоге бесплатно — без скрытых комиссий площадки",
        cta: "Разместить",
        href: listSale,
      },
    },
    {
      id: "newbuilds",
      triggerLabel: "Новостройки",
      catalogHref: r({
        types: "Квартира",
        market: "Новостройка",
        deal: "Продажа",
      }),
      match: (pathname, search) =>
        pathname.startsWith("/zhilaya") && marketIs(search, "Новостройка"),
      columns: [
        {
          sections: [
            {
              title: "Новостройки",
              links: [
                {
                  label: "Квартиры в новостройках",
                  href: r({
                    types: "Квартира",
                    market: "Новостройка",
                    deal: "Продажа",
                  }),
                },
                {
                  label: "Апартаменты",
                  href: r({
                    types: "Апартаменты",
                    market: "Новостройка",
                    deal: "Продажа",
                  }),
                },
                {
                  label: "Все новостройки",
                  href: r({ market: "Новостройка", deal: "Продажа" }),
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
                { label: "Умный подбор", href: "#ai-wizard" },
                { label: "Риелторы", href: "/rieltory" },
                { label: "Разместить за 0 ₽", href: listSale },
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
      triggerLabel: "Дома и участки",
      catalogHref: r({ types: ["Дом", "Участок"] }),
      match: (pathname, search) => {
        if (pathname.startsWith("/zhilaya/uchastki")) return true;
        if (pathname.startsWith("/land")) return true;
        const types = new URLSearchParams(search).get("types") || "";
        return (
          pathname.startsWith("/zhilaya") &&
          (types.includes("Дом") ||
            types.includes("Участок") ||
            types.includes("Коттедж") ||
            types.includes("Дача"))
        );
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
                  label: "Таунхаусы",
                  href: r({ types: "Таунхаус" }),
                },
              ],
            },
            {
              title: "Участки",
              links: [
                { label: "Участки (жильё)", href: "/zhilaya/uchastki" },
                { label: "Земля коммерческая", href: "/land" },
              ],
            },
          ],
        },
        {
          sections: [
            {
              title: "Сервисы",
              links: [
                { label: "Разместить участок", href: listRent },
                { label: "Риелторы", href: "/rieltory" },
              ],
            },
          ],
        },
      ],
      promo: {
        title: "Участок или дом?",
        text: "Разместите объявление бесплатно или найдите специалиста",
        cta: "Разместить",
        href: listRent,
      },
    },
    {
      id: "commercial",
      triggerLabel: "Коммерческая",
      catalogHref: SEGMENT_ROUTES.commercial.catalog,
      match: (pathname) =>
        pathname === "/catalog" ||
        pathname.startsWith("/offices") ||
        pathname.startsWith("/retail") ||
        pathname.startsWith("/warehouses") ||
        (pathname.startsWith("/land") && !pathname.startsWith("/zhilaya")),
      columns: [
        {
          sections: [
            {
              title: "Снять",
              links: [
                { label: "Офисы", href: "/offices" },
                { label: "Торговые площади", href: "/retail" },
                { label: "Склады", href: "/warehouses" },
                {
                  label: "Производство",
                  href: c({ types: "Производство", deal: "Аренда" }),
                },
                { label: "Весь каталог", href: c({ deal: "Аренда" }) },
              ],
            },
            {
              title: "Купить",
              links: [
                {
                  label: "Офисы",
                  href: c({ types: "Офис", deal: "Продажа" }),
                },
                {
                  label: "Торговая",
                  href: c({ types: "Торговая", deal: "Продажа" }),
                },
                {
                  label: "Склады",
                  href: c({ types: "Склад", deal: "Продажа" }),
                },
                { label: "Земля", href: "/land" },
              ],
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
        text: "Офис, склад или торговое помещение — объявление бесплатно",
        cta: "Разместить",
        href: listCommercial,
      },
    },
  ];
}

/** @deprecated единое меню «Недвижимость» — оставлено для совместимости */
export function getCatalogMegaMenu(isLoggedIn = false): MegaMenuConfig & {
  services: MegaSection;
} {
  const menus = getMainNavMegaMenus(isLoggedIn);
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
