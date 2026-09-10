import {
  ArrowRight,
  Building2,
  MapPin,
  Megaphone,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import ctaRentOutBg from "@/assets/cta-rent-out.jpg";
import { COMPANY, CONTACTS } from "@/config/company";

const highlights = [
  { icon: MapPin, label: "Иркутск и область", hint: "локальный каталог" },
  { icon: Building2, label: "Жильё и коммерция", hint: "в одном месте" },
  { icon: Megaphone, label: "Реклама на сайте", hint: "баннеры и промо" },
  { icon: Sparkles, label: "Бесплатное размещение", hint: "для собственников" },
];

export default function CompanyStatsSidebar() {
  return (
    <aside className="w-full space-y-5 min-w-0">
      <div className="bg-card border border-border p-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">
          О {COMPANY.brand}
        </p>
        <h3 className="font-display text-lg font-bold text-foreground leading-snug mb-3">
          Открытый каталог недвижимости региона
        </h3>
        <p className="text-[12px] text-muted-foreground leading-relaxed mb-4">
          {COMPANY.brand} — портал для жителей и бизнеса Иркутска и области.
          Собственники размещают объекты бесплатно, агентства и риелторы ведут
          профили, рекламодатели продвигаются баннерами на сайте.
        </p>
        <div className="grid grid-cols-2 gap-2.5">
          {highlights.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-muted/40 p-3">
                <Icon className="w-4 h-4 text-primary mb-1.5" />
                <div className="text-[11px] font-semibold text-foreground leading-tight">
                  {s.label}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                  {s.hint}
                </div>
              </div>
            );
          })}
        </div>
        <Link
          to="/about"
          className="inline-flex items-center gap-1 mt-4 text-xs font-medium text-primary hover:underline"
        >
          Подробнее о проекте <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div
        className="relative overflow-hidden text-background"
        style={{ minHeight: 240 }}
      >
        <img
          src={ctaRentOutBg}
          alt=""
          aria-hidden
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover object-[center_35%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/75 to-foreground/55" />
        <div
          className="relative p-5 flex flex-col h-full"
          style={{ minHeight: 240 }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest text-primary mb-2">
            {COMPANY.brand}
          </p>
          <h4 className="font-display text-base font-bold text-background mb-1">
            Разместите объект бесплатно
          </h4>
          <p className="text-[11px] text-background/75 leading-relaxed mb-4">
            Карточка в каталоге, просмотры жителей региона и заявки — без платы
            за публикацию для собственников.
          </p>
          <Link
            to="/list-property"
            className="flex items-center justify-center gap-1.5 h-9 w-full bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity mt-auto"
          >
            Разместить объект <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      <div className="bg-foreground text-background p-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-background/50 mb-2">
          Отклик на вакансию
        </p>
        <p className="text-sm font-medium leading-snug mb-3">
          Пришлите резюме на email — ответим в рабочее время.
        </p>
        <a
          href={`mailto:${CONTACTS.email}?subject=${encodeURIComponent("Отклик на вакансию — ДАДАТУТ")}`}
          className="flex items-center justify-center gap-2 w-full h-9 bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity break-all px-2"
        >
          {CONTACTS.email}
        </a>
      </div>
    </aside>
  );
}
