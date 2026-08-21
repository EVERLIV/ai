import { buildCatalogUrl } from "@/lib/catalogLinks";
import { placementCtaPath } from "@/lib/listPropertyLinks";
import { SEGMENT_ROUTES, type PropertySegment } from "@/config/propertySegments";

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

function buildResidentialMenu(isLoggedIn: boolean): MegaMenuConfig {
  return {
    triggerLabel: "Каталог жилья",
    catalogHref: SEGMENT_ROUTES.residential.catalog,
    columns: [
      {
        sections: [
          {
            title: "Купить жильё",
            links: [
              { label: "Все квартиры", href: r({ types: "Квартира", deal: "Продажа" }) },
              { label: "Вторичка", href: r({ types: "Квартира", market: "Вторичка", deal: "Продажа" }) },
              { label: "Новостройки", href: r({ types: "Квартира", market: "Новостройка", deal: "Продажа" }) },
              { label: "Дома, дачи, коттеджи", href: r({ types: ["Дом", "Дача", "Коттедж"], deal: "Продажа" }) },
              { label: "Таунхаусы", href: r({ types: "Таунхаус", deal: "Продажа" }) },
              { label: "Апартаменты", href: r({ types: "Апартаменты", deal: "Продажа" }) },
              { label: "Комнаты", href: r({ types: "Комната", deal: "Продажа" }) },
              { label: "Участки", href: r({ types: "Участок", deal: "Продажа" }) },
            ],
          },
        ],
      },
      {
        sections: [
          {
            title: "Посуточно",
            links: [
              { label: "Квартиры посуточно", href: r({ types: "Квартира", deal: "Посуточно" }) },
              { label: "Дома, дачи и коттеджи", href: r({ types: ["Дом", "Дача", "Коттедж"], deal: "Посуточно" }) },
              { label: "Комнаты", href: r({ types: "Комната", deal: "Посуточно" }) },
              { label: "Апартаменты", href: r({ types: "Апартаменты", deal: "Посуточно" }) },
            ],
          },
          {
            title: "Снять долгосрочно",
            links: [
              { label: "Квартиры", href: r({ types: "Квартира", deal: "Аренда" }) },
              { label: "Дома, дачи и коттеджи", href: r({ types: ["Дом", "Дача", "Коттедж"], deal: "Аренда" }) },
              { label: "Комнаты", href: r({ types: "Комната", deal: "Аренда" }) },
              { label: "Таунхаусы", href: r({ types: "Таунхаус", deal: "Аренда" }) },
              { label: "Апартаменты", href: r({ types: "Апартаменты", deal: "Аренда" }) },
            ],
          },
        ],
      },
      {
        sections: [
          {
            title: "Другие категории",
            links: [
              { label: "Весь каталог жилья", href: r({}) },
              { label: "Гаражи и машиноместа", href: r({ types: ["Гараж", "Машиноместо"] }) },
              { label: "Доли", href: r({ types: "Доля" }) },
              { label: "Земельные участки", href: r({ types: "Участок" }) },
            ],
          },
        ],
      },
    ],
    services: {
      title: "Сервисы",
      links: [
        { label: "ИИ-подбор", href: "#ai-wizard" },
        { label: "Разместить жильё за 0 ₽", href: placementCtaPath("residential", "rent", isLoggedIn) },
        { label: "Передать в управление", href: placementCtaPath("residential", "management", isLoggedIn) },
        { label: "Квартиры", href: "/zhilaya/kvartiry" },
        { label: "Дома", href: "/zhilaya/doma" },
        { label: "Комнаты", href: "/zhilaya/komnaty" },
      ],
    },
  };
}

function buildCommercialMenu(isLoggedIn: boolean): MegaMenuConfig {
  return {
    triggerLabel: "Каталог",
    catalogHref: SEGMENT_ROUTES.commercial.catalog,
    columns: [
      {
        sections: [
          {
            title: "Купить",
            links: [
              { label: "Офисы", href: c({ types: "Офис", deal: "Продажа" }) },
              { label: "Торговые площади", href: c({ types: "Торговая", deal: "Продажа" }) },
              { label: "Склады", href: c({ types: "Склад", deal: "Продажа" }) },
              { label: "Производство", href: c({ types: "Производство", deal: "Продажа" }) },
              { label: "Земельные участки", href: c({ types: "Земля", deal: "Продажа" }) },
            ],
          },
        ],
      },
      {
        sections: [
          {
            title: "Снять",
            links: [
              { label: "Офисы", href: c({ types: "Офис", deal: "Аренда" }) },
              { label: "Торговые площади", href: c({ types: "Торговая", deal: "Аренда" }) },
              { label: "Склады", href: c({ types: "Склад", deal: "Аренда" }) },
              { label: "Производство", href: c({ types: "Производство", deal: "Аренда" }) },
              { label: "Земельные участки", href: c({ types: "Земля", deal: "Аренда" }) },
            ],
          },
        ],
      },
      {
        sections: [
          {
            title: "По типу",
            links: [
              { label: "Все объекты", href: c({}) },
              { label: "Офисы", href: "/offices" },
              { label: "Торговля", href: "/retail" },
              { label: "Склады", href: "/warehouses" },
              { label: "Земля", href: "/land" },
              { label: "Реклама", href: "/ads" },
            ],
          },
        ],
      },
    ],
    services: {
      title: "Сервисы",
      links: [
        { label: "ИИ-подбор", href: "#ai-wizard" },
        { label: "Разместить объект за 0 ₽", href: placementCtaPath("commercial", "rent", isLoggedIn) },
        { label: "Передать в управление", href: placementCtaPath("commercial", "management", isLoggedIn) },
      ],
    },
  };
}

export function getCatalogMegaMenu(
  segment: PropertySegment,
  isLoggedIn = false,
): MegaMenuConfig {
  return segment === "residential"
    ? buildResidentialMenu(isLoggedIn)
    : buildCommercialMenu(isLoggedIn);
}
