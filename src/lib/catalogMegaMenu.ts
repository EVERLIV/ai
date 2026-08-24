import { SEGMENT_ROUTES } from "@/config/propertySegments";
import { buildCatalogUrl } from "@/lib/catalogLinks";
import { placementCtaPath } from "@/lib/listPropertyLinks";

export type MegaLink = { label: string; href: string };
export type MegaSection = { title: string; links: MegaLink[] };
export type MegaColumn = { sections: MegaSection[] };
export type MegaMenuConfig = {
  triggerLabel: string;
  catalogHref: string;
  columns: MegaColumn[];
  services: MegaSection;
};

function r(params: Parameters<typeof buildCatalogUrl>[0]) {
  return buildCatalogUrl({ segment: "residential", ...params });
}

function c(params: Parameters<typeof buildCatalogUrl>[0]) {
  return buildCatalogUrl({ segment: "commercial", ...params });
}

/** Единое меню недвижимости (жильё + коммерция + участки), как у Avito. */
export function getCatalogMegaMenu(isLoggedIn = false): MegaMenuConfig {
  return {
    triggerLabel: "Недвижимость",
    catalogHref: SEGMENT_ROUTES.commercial.catalog,
    columns: [
      {
        sections: [
          {
            title: "Купить жильё",
            links: [
              {
                label: "Все квартиры",
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
                label: "Новостройки",
                href: r({
                  types: "Квартира",
                  market: "Новостройка",
                  deal: "Продажа",
                }),
              },
              {
                label: "Дома, дачи, коттеджи",
                href: r({ types: ["Дом", "Дача", "Коттедж"], deal: "Продажа" }),
              },
              {
                label: "Таунхаусы",
                href: r({ types: "Таунхаус", deal: "Продажа" }),
              },
              {
                label: "Апартаменты",
                href: r({ types: "Апартаменты", deal: "Продажа" }),
              },
              {
                label: "Комнаты",
                href: r({ types: "Комната", deal: "Продажа" }),
              },
            ],
          },
        ],
      },
      {
        sections: [
          {
            title: "Снять / посуточно",
            links: [
              {
                label: "Квартиры долгосрочно",
                href: r({ types: "Квартира", deal: "Аренда" }),
              },
              {
                label: "Дома, дачи и коттеджи",
                href: r({ types: ["Дом", "Дача", "Коттедж"], deal: "Аренда" }),
              },
              {
                label: "Комнаты",
                href: r({ types: "Комната", deal: "Аренда" }),
              },
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
              {
                label: "Весь каталог жилья",
                href: SEGMENT_ROUTES.residential.catalog,
              },
            ],
          },
        ],
      },
      {
        sections: [
          {
            title: "Коммерческая недвижимость",
            links: [
              { label: "Офисы", href: "/offices" },
              { label: "Торговые площади", href: "/retail" },
              { label: "Склады", href: "/warehouses" },
              { label: "Производство", href: c({ types: "Производство" }) },
              { label: "Весь каталог коммерции", href: c({}) },
              {
                label: "Снять офис",
                href: c({ types: "Офис", deal: "Аренда" }),
              },
              {
                label: "Купить помещение",
                href: c({ types: "Торговая", deal: "Продажа" }),
              },
            ],
          },
        ],
      },
      {
        sections: [
          {
            title: "Участки и прочее",
            links: [
              { label: "Земельные участки", href: "/zhilaya/uchastki" },
              { label: "Земля (коммерция)", href: "/land" },
              {
                label: "Гаражи и машиноместа",
                href: r({ types: ["Гараж", "Машиноместо"] }),
              },
              { label: "Реклама", href: "/ads" },
              { label: "Раздел жилья", href: SEGMENT_ROUTES.residential.home },
            ],
          },
        ],
      },
    ],
    services: {
      title: "Сервисы",
      links: [
        { label: "ИИ-подбор", href: "#ai-wizard" },
        {
          label: "Разместить объект за 0 ₽",
          href: placementCtaPath("commercial", "rent", isLoggedIn),
        },
        {
          label: "Разместить жильё за 0 ₽",
          href: placementCtaPath("residential", "rent", isLoggedIn),
        },
        {
          label: "Передать в управление",
          href: placementCtaPath("commercial", "management", isLoggedIn),
        },
        { label: "О компании", href: "/about" },
        { label: "Контакты", href: "/contacts" },
      ],
    },
  };
}
