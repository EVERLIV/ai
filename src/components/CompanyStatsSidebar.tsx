import {
  ArrowRight,
  Award,
  Phone,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import ctaRentOutBg from "@/assets/cta-rent-out.jpg";
import { CONTACTS } from "@/config/company";

const stats = [
  { icon: TrendingUp, value: "12+", label: "лет на рынке" },
  { icon: Users, value: "850+", label: "арендаторов" },
  { icon: ShieldCheck, value: "320+", label: "объектов" },
  { icon: Award, value: "98%", label: "повторных сделок" },
];

export default function CompanyStatsSidebar() {
  return (
    <aside className="w-full space-y-5 min-w-0">
      <div className="bg-card border border-border p-5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-4">
          АрендаСити в цифрах
        </p>
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.label} className="bg-muted/40 p-3 text-center">
                <Icon className="w-4 h-4 text-primary mx-auto mb-1.5" />
                <div className="font-display text-xl font-bold text-foreground leading-none">
                  {s.value}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1 leading-tight">
                  {s.label}
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed mt-4">
          Работаем в Иркутске, Ангарске и Шелехове. Полный цикл: подбор
          арендаторов, юридическое сопровождение и управление объектами.
        </p>
        <Link
          to="/about"
          className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-primary hover:underline"
        >
          О компании <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div
        className="relative overflow-hidden text-background"
        style={{ minHeight: 260 }}
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
          style={{ minHeight: 260 }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-widest text-primary mb-2">
            Рекламный блок
          </p>
          <h4 className="font-display text-base font-bold text-background mb-1">
            Сдайте объект с АрендаСити
          </h4>
          <p className="text-[11px] text-background/75 leading-relaxed mb-4">
            Профессиональный маркетинг, проверенные арендаторы и юридическая
            поддержка — без комиссии для собственников.
          </p>
          <Link
            to="/list-property?mode=management"
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
          Отправьте резюме или позвоните — мы ответим в рабочее время.
        </p>
        <a
          href={`tel:${CONTACTS.phoneTel}`}
          className="flex items-center justify-center gap-2 w-full h-9 bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          <Phone className="w-3.5 h-3.5" /> {CONTACTS.phone}
        </a>
        <a
          href={`mailto:${CONTACTS.email}?subject=Отклик на вакансию`}
          className="block text-center text-[11px] text-background/60 hover:text-background mt-2 transition-colors"
        >
          {CONTACTS.email}
        </a>
      </div>
    </aside>
  );
}
