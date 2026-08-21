import { Link } from "react-router-dom";
import { COMPANY, CONTACTS } from "@/config/company";
import { footerCityLinks, footerResidentialLinks, footerSectionLinks } from "@/lib/catalogLinks";
import BrandMark from "@/components/BrandMark";

const legalLinks = [
  { label: "Политика конфиденциальности", href: "#" },
  { label: "Условия использования", href: "#" },
];

const contactLinks = [
  { label: CONTACTS.phone, href: `tel:${CONTACTS.phoneTel}` },
  { label: CONTACTS.email, href: `mailto:${CONTACTS.email}` },
  { label: COMPANY.officeAddress, href: "/contacts" },
];

export default function SiteFooter() {
  return (
    <footer className="bg-foreground text-background/70">
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <BrandMark className="w-9 h-9" />
              <span className="flex flex-col leading-none">
                <span className="font-sans text-[17px] font-bold tracking-tight text-background">
                  АРЕНДА<span className="text-primary">СИТИ</span>
                </span>
                <span className="text-[10px] font-medium tracking-wide text-background/60 mt-0.5 uppercase">
                  Коммерческая и жилая недвижимость
                </span>
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              Аренда и продажа коммерческой и жилой недвижимости в Иркутске и области. Профессиональный подбор и управление объектами.
            </p>

            <ul className="mt-4 space-y-2">
              {legalLinks.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="text-sm hover:text-background transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-background mb-4">Разделы</h4>
            <ul className="space-y-2">
              {footerSectionLinks.map((l) => (
                <li key={l.label}>
                  <Link to={l.href} className="text-sm hover:text-background transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-background mb-4">Города</h4>
            <ul className="space-y-2">
              {footerCityLinks.map((l) => (
                <li key={l.label}>
                  <Link to={l.href} className="text-sm hover:text-background transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-background mb-4">Жилая недвижимость</h4>
            <ul className="space-y-2">
              {footerResidentialLinks.map((l) => (
                <li key={l.label}>
                  <Link to={l.href} className="text-sm hover:text-background transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-background mb-4">Контакты</h4>
            <ul className="space-y-2">
              {contactLinks.map((l) => (
                <li key={l.label}>
                  {l.href.startsWith("/") ? (
                    <Link to={l.href} className="text-sm hover:text-background transition-colors">
                      {l.label}
                    </Link>
                  ) : (
                    <a href={l.href} className="text-sm hover:text-background transition-colors">
                      {l.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div>
        <div className="container mx-auto px-4 lg:px-8 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="text-[11px] text-background/40">
            © 2025 {COMPANY.shortName} Все права защищены.
          </p>
          <p className="text-[11px] text-background/40">
            Создано в{" "}
            <a
              href="https://dvaait.com"
              target="_blank"
              rel="noreferrer"
              className="text-background/60 hover:text-background transition-colors font-medium"
            >
              2А Цифровые Решения
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
