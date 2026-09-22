import { SITE } from "@/config/site";

export type PageSeo = {
  title: string;
  description: string;
};

/** Оптимизированные title/description для публичных страниц (без суффикса бренда — его добавит SeoHead). */
export const PAGE_SEO = {
  home: {
    title: SITE.title,
    description: SITE.description,
  },
  catalogCommercial: {
    title: "Каталог коммерческой недвижимости в Иркутске",
    description:
      "Офисы, торговые площади, склады и производство в Иркутске и области: аренда и продажа. Фильтры по цене, площади и району — ДАДАТУТ.",
  },
  offices: {
    title: "Офисы в аренду и на продажу в Иркутске",
    description:
      "Актуальные офисы в Иркутске и области: классы A–C, готовые и под отделку. Сравните площадь, ставку и район в каталоге ДАДАТУТ.",
  },
  retail: {
    title: "Торговые помещения в Иркутске — аренда и продажа",
    description:
      "Помещения под магазин, общепит и услуги в Иркутске и области. Первая линия, трафик и готовые площади в каталоге ДАДАТУТ.",
  },
  warehouses: {
    title: "Склады и производство в Иркутске",
    description:
      "Склады, производство и логистика в Иркутске и области: площадь, высота потолков, подъезд. Аренда и продажа на ДАДАТУТ.",
  },
  catalogResidential: {
    title: "Каталог жилья в Иркутске — квартиры, дома, комнаты",
    description:
      "Квартиры, дома и комнаты в Иркутске и области: снять, купить или сдать. Фильтры по комнатам, цене и району — ДАДАТУТ.",
  },
  apartments: {
    title: "Квартиры в Иркутске — снять и купить",
    description:
      "Квартиры в Иркутске и области: аренда и продажа, от студий до многокомнатных. Актуальные объявления в каталоге ДАДАТУТ.",
  },
  houses: {
    title: "Дома и коттеджи в Иркутске и области",
    description:
      "Частные дома, коттеджи и таунхаусы в Иркутске и области — аренда и продажа. Смотрите площадь, участок и цену на ДАДАТУТ.",
  },
  rooms: {
    title: "Комнаты в аренду в Иркутске",
    description:
      "Снять комнату в Иркутске и области: объявления от собственников и агентств. Фильтры по цене и району — ДАДАТУТ.",
  },
  plotsResidential: {
    title: "Участки под жильё в Иркутске и области",
    description:
      "Земельные участки ИЖС и под дом в Иркутске и области. Продажа и аренда — каталог ДАДАТУТ.",
  },
  residentialHome: {
    title: "Жилая недвижимость Иркутска — снять, сдать и купить",
    description:
      "Квартиры, дома и комнаты в Иркутске и области. Снимайте, покупайте и размещайте жильё бесплатно в каталоге ДАДАТУТ.",
  },
  landHome: {
    title: "Земля и участки в Иркутске и области",
    description:
      "Участки ИЖС, под бизнес и коммерцию в Иркутске и области. Аренда и продажа земли в каталоге ДАДАТУТ.",
  },
  catalogLand: {
    title: "Каталог земли и участков в Иркутске",
    description:
      "Земельные участки в Иркутске и области: ИЖС, жилая и коммерческая земля. Фильтры по типу, цене и площади — ДАДАТУТ.",
  },
  listCommercial: {
    title: "Разместить коммерческий объект бесплатно",
    description:
      "Сдайте или продайте офис, торговлю, склад или производство на ДАДАТУТ бесплатно. Иркутск и область.",
  },
  listResidential: {
    title: "Разместить жильё бесплатно",
    description:
      "Сдайте или продайте квартиру, дом или комнату на ДАДАТУТ бесплатно. Иркутск и область.",
  },
  listLand: {
    title: "Разместить участок бесплатно",
    description:
      "Выставьте землю на продажу или в аренду на ДАДАТУТ бесплатно. Иркутск и область.",
  },
  smartListing: {
    title: "Умное создание объявления с ИИ",
    description:
      "Опишите объект — ИИ поможет оформить объявление для каталога ДАДАТУТ. Быстрая публикация недвижимости в Иркутске.",
  },
  specialists: {
    title: "Риелторы и агентства недвижимости Иркутска",
    description:
      "Каталог проверенных риелторов и агентств Иркутска и области. Контакты, объекты и отзывы — ДАДАТУТ.",
  },
  developers: {
    title: "Застройщики Иркутска и области",
    description:
      "Каталог застройщиков и жилых проектов Иркутска и области. Новостройки и предложения от девелоперов — ДАДАТУТ.",
  },
  developersLanding: {
    title: "Застройщикам — размещение проектов на ДАДАТУТ",
    description:
      "Продвижение жилых проектов и объектов застройщика в каталоге ДАДАТУТ. Иркутск и область.",
  },
  ads: {
    title: "Реклама и баннеры на ДАДАТУТ",
    description:
      "Рекламные размещения и баннеры на площадке ДАДАТУТ: охват аудитории, ищущей недвижимость в Иркутске.",
  },
  news: {
    title: "Новости недвижимости Иркутска",
    description:
      "Новости рынка жилья и коммерческой недвижимости Иркутска и области. Обзоры и полезные материалы — ДАДАТУТ.",
  },
  about: {
    title: "О проекте ДАДАТУТ",
    description:
      "ДАДАТУТ — открытый каталог жилья и коммерции Иркутска и области. Миссия, возможности и контакты проекта.",
  },
  support: {
    title: "Поддержка и контакты ДАДАТУТ",
    description:
      "Свяжитесь с командой ДАДАТУТ: вопросы по каталогу, размещению объявлений и рекламе. Email support@dadatut.ru.",
  },
  vacancies: {
    title: "Вакансии ДАДАТУТ — работа в продуктовой команде",
    description:
      "Открытые вакансии ДАДАТУТ: sales-менеджер по продукту и маркетолог. Региональный каталог недвижимости.",
  },
  help: {
    title: "Справочный центр ДАДАТУТ",
    description:
      "Ответы на вопросы о каталоге, размещении объявлений, аккаунте и рекламе на ДАДАТУТ.",
  },
  docs: {
    title: "Документация и справочник ДАДАТУТ",
    description:
      "Как пользоваться каталогом ДАДАТУТ: размещение, модерация, аккаунт и юридические документы.",
  },
  app: {
    title: "Приложение ДАДАТУТ — установка на телефон",
    description:
      "Установите ДАДАТУТ на iPhone и Android: быстрый доступ к каталогу недвижимости Иркутска.",
  },
  compare: {
    title: "Сравнение объектов недвижимости",
    description:
      "Сравните выбранные объекты по цене, площади и условиям. Каталог ДАДАТУТ — Иркутск и область.",
  },
  auth: {
    title: "Вход и регистрация",
    description:
      "Войдите в личный кабинет ДАДАТУТ или создайте аккаунт: избранное, заявки и размещение объектов.",
  },
  resetPassword: {
    title: "Сброс пароля",
    description: "Восстановление доступа к личному кабинету ДАДАТУТ.",
  },
  privacy: {
    title: "Политика конфиденциальности",
    description:
      "Политика обработки персональных данных ДАДАТУТ (оператор — ИП Панова М.Г.).",
  },
  terms: {
    title: "Правила пользования",
    description:
      "Правила пользования сайтом и лицензионное соглашение ДАДАТУТ.",
  },
  recommendations: {
    title: "Правила рекомендательных технологий",
    description:
      "Как ДАДАТУТ применяет рекомендательные технологии в выдаче объявлений (Quality Match).",
  },
} as const satisfies Record<string, PageSeo>;

/** SEO для статических маршрутов (sitemap / postbuild HTML). */
export const ROUTE_SEO: Record<string, PageSeo> = {
  "/": PAGE_SEO.home,
  "/catalog": PAGE_SEO.catalogCommercial,
  "/offices": PAGE_SEO.offices,
  "/retail": PAGE_SEO.retail,
  "/warehouses": PAGE_SEO.warehouses,
  "/zemlya": PAGE_SEO.landHome,
  "/zemlya/catalog": PAGE_SEO.catalogLand,
  "/zemlya/list-property": PAGE_SEO.listLand,
  "/zhilaya": PAGE_SEO.residentialHome,
  "/zhilaya/catalog": PAGE_SEO.catalogResidential,
  "/zhilaya/kvartiry": PAGE_SEO.apartments,
  "/zhilaya/doma": PAGE_SEO.houses,
  "/zhilaya/komnaty": PAGE_SEO.rooms,
  "/zhilaya/uchastki": PAGE_SEO.plotsResidential,
  "/zhilaya/list-property": PAGE_SEO.listResidential,
  "/list-property": PAGE_SEO.listCommercial,
  "/list-property/ai": PAGE_SEO.smartListing,
  "/rieltory": PAGE_SEO.specialists,
  "/zastroyshchiki": PAGE_SEO.developers,
  "/zastroyshchikam": PAGE_SEO.developersLanding,
  "/ads": PAGE_SEO.ads,
  "/news": PAGE_SEO.news,
  "/about": PAGE_SEO.about,
  "/support": PAGE_SEO.support,
  "/vacancies": PAGE_SEO.vacancies,
  "/help": PAGE_SEO.help,
  "/docs": PAGE_SEO.docs,
  "/app": PAGE_SEO.app,
  "/compare": PAGE_SEO.compare,
  "/auth": PAGE_SEO.auth,
  "/reset-password": PAGE_SEO.resetPassword,
  "/privacy": PAGE_SEO.privacy,
  "/terms": PAGE_SEO.terms,
  "/recommendations": PAGE_SEO.recommendations,
};
