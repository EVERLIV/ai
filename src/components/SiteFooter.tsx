import { COMPANY, CONTACTS } from "@/config/company";

const legalLinks = [
  { label: "Политика конфиденциальности", href: "#" },
  { label: "Условия использования", href: "#" },
];

const cols = [
  {
    title: "Разделы",
    links: ["Офисы", "Торговые площади", "Склады", "Земельные участки", "Жилая аренда"],
  },
  {
    title: "Города",
    links: ["Ангарск", "Иркутск", "Шелехов", "Усолье-Сибирское", "Братск"],
  },
  {
    title: "Контакты",
    links: [CONTACTS.phone, CONTACTS.email, COMPANY.officeAddress],
  },
];

export default function SiteFooter() {
  return (
    <footer className="bg-foreground text-background/70">
      <div className="container mx-auto px-4 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-base tracking-tight">А</span>
              </div>
              <span className="flex flex-col leading-none">
                <span className="font-sans text-[17px] font-bold tracking-tight text-background">
                  АРЕНДА<span className="text-primary">СИТИ</span>
                </span>
                <span className="text-[10px] font-medium tracking-wide text-background/60 mt-0.5 uppercase">
                  Коммерческая недвижимость и реклама
                </span>
              </span>
            </div>
            <p className="text-sm leading-relaxed">
              Агентство коммерческой недвижимости в Ангарске и Иркутской области. Профессиональный подбор и управление объектами.
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

          {cols.map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-background mb-4">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-sm hover:text-background transition-colors">{l}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

      </div>

      {/* Bottom bar */}
      <div>
        <div className="container mx-auto px-4 lg:px-8 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <p className="text-[11px] text-background/40">
            © 2025 {COMPANY.shortName} Все права защищены.
          </p>
          <p className="text-[11px] text-background/40">
            Создано в{" "}
            <a
              href="https://2a-digital.com"
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
