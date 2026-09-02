import { Link } from "react-router-dom";
import BrandMark from "@/components/BrandMark";
import { COMPANY, CONTACTS } from "@/config/company";
import {
  buildCatalogUrl,
  footerCityLinks,
  footerResidentialLinks,
  footerSectionLinks,
} from "@/lib/catalogLinks";

type FooterLink = { label: string; href: string; external?: boolean };

/** Колонки как у Циан: плоский список без заголовков */
const FOOTER_COLUMNS: FooterLink[][] = [
  [
    { label: "Справочный центр", href: "/help" },
    { label: "Приложение", href: "/app" },
    { label: "Документация", href: "/docs" },
    { label: "Тарифы и цены", href: "/list-property" },
    { label: "Карьера в ДАДАТУТ", href: "/vacancies" },
  ],
  [
    { label: "Юридические документы", href: "/privacy" },
    { label: "Реклама на сайте", href: "/support" },
    { label: "О компании", href: "/about" },
  ],
  [
    { label: "Поиск на карте", href: "/catalog" },
    { label: "Разместить объявление", href: "/list-property" },
  ],
  [
    { label: "Риелторы", href: "/rieltory" },
    { label: "Агентства", href: "/rieltory?tab=agentstva" },
    { label: "Застройщики", href: "/zastroyshchiki" },
    { label: "Застройщикам", href: "/zastroyshchikam" },
    { label: "Поддержка", href: "/support" },
  ],
  [
    { label: "Коммерческая недвижимость", href: buildCatalogUrl() },
    { label: "Жилая недвижимость", href: "/zhilaya" },
  ],
  [
    { label: "Новости", href: "/news" },
    { label: "Сравнить объекты", href: "/compare" },
  ],
];

const legalInlineClass =
  "text-[#2a6fdb] underline underline-offset-2 hover:text-[#1a5cc4] transition-colors";

function FooterNavLink({ item }: { item: FooterLink }) {
  const className =
    "text-[13px] leading-5 text-[#4a5568] hover:text-foreground transition-colors";
  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noreferrer"
        className={className}
      >
        {item.label}
      </a>
    );
  }
  return (
    <Link to={item.href} className={className}>
      {item.label}
    </Link>
  );
}

export default function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#f4f7f9] text-[#4a5568] border-t border-[#e6ebf0]">
      <div className="container mx-auto px-4 lg:px-8 pt-10 pb-8">
        {/* Ссылки — сетка колонок */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-6">
          {FOOTER_COLUMNS.map((col, i) => (
            <ul key={i} className="space-y-2.5">
              {col.map((item) => (
                <li key={item.label}>
                  <FooterNavLink item={item} />
                </li>
              ))}
            </ul>
          ))}
        </div>

        {/* Доп. ряды: типы и города — компактно, как у агрегаторов */}
        <div className="mt-8 pt-6 border-t border-[#e6ebf0] grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-[#8a94a6] mb-2.5">
              Коммерция
            </p>
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              {footerSectionLinks.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.href}
                    className="text-[13px] text-[#4a5568] hover:text-foreground transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[11px] font-medium uppercase tracking-wide text-[#8a94a6] mb-2.5">
              Жилая
            </p>
            <ul className="flex flex-wrap gap-x-4 gap-y-2">
              {footerResidentialLinks.slice(0, 6).map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.href}
                    className="text-[13px] text-[#4a5568] hover:text-foreground transition-colors"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-5">
          <p className="text-[11px] font-medium uppercase tracking-wide text-[#8a94a6] mb-2.5">
            Города
          </p>
          <ul className="flex flex-wrap gap-x-4 gap-y-2">
            {footerCityLinks.map((l) => (
              <li key={l.label}>
                <Link
                  to={l.href}
                  className="text-[13px] text-[#4a5568] hover:text-foreground transition-colors"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Юридический текст */}
        <p className="mt-8 text-[12px] leading-[1.55] text-[#6b7280] max-w-5xl">
          {COMPANY.brand} — база проверенных объявлений о продаже и аренде
          жилой, загородной и коммерческой недвижимости. Используя сервис, вы
          соглашаетесь с{" "}
          <Link to="/terms" className={legalInlineClass}>
            Правилами пользования сайтом {COMPANY.brand}
          </Link>
          . Оплачивая услуги, вы принимаете{" "}
          <Link to="/terms" className={legalInlineClass}>
            Лицензионное соглашение
          </Link>
          . С условиями обработки ваших персональных данных вы можете
          ознакомиться в{" "}
          <Link to="/privacy" className={legalInlineClass}>
            Политике конфиденциальности
          </Link>
          . {COMPANY.legalName}, email:{" "}
          <a href={`mailto:${CONTACTS.email}`} className={legalInlineClass}>
            {CONTACTS.email}
          </a>
          . На информационном ресурсе применяются{" "}
          <Link to="/recommendations" className={legalInlineClass}>
            Рекомендательные технологии
          </Link>
          .
        </p>
      </div>

      <div className="border-t border-[#e6ebf0]">
        <div className="container mx-auto px-4 lg:px-8 py-5 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
          <Link
            to="/"
            className="flex items-center shrink-0"
            aria-label="DADATYT"
          >
            <BrandMark className="h-8" />
          </Link>
        </div>

        <div className="container mx-auto px-4 lg:px-8 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-[11px] text-[#8a94a6]">
            © {year} {COMPANY.shortName} Все права защищены.
          </p>
          <p className="text-[11px] text-[#8a94a6]">
            Создано в{" "}
            <a
              href="https://dvaait.com"
              target="_blank"
              rel="noreferrer"
              className="text-[#6b7280] hover:text-foreground transition-colors font-medium"
            >
              2А Цифровые Решения
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
