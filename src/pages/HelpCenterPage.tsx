import {
  BookMarked,
  BookOpen,
  FileText,
  HelpCircle,
  Scale,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import SeoHead from "@/components/SeoHead";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { COMPANY } from "@/config/company";
import { absoluteUrl } from "@/config/site";
import {
  RECOMMENDATION_TECH_NAME,
  RECOMMENDATION_TECH_NAME_RU,
} from "@/lib/recommendationEngine";

const articles = [
  {
    href: "/docs",
    icon: BookMarked,
    title: "Документация портала",
    desc: `Полный справочник ${COMPANY.brand}: разделы, роли, размещение и редактирование объектов, кабинет и форма «я нашёл баг».`,
  },
  {
    href: "/recommendations",
    icon: Sparkles,
    title: `Рекомендательные технологии (${RECOMMENDATION_TECH_NAME})`,
    desc: `Как ${COMPANY.brand} показывает объекты: качественный подбор, а не оплата позиции. Правила применения рекомендательных технологий.`,
  },
  {
    href: "/privacy",
    icon: Scale,
    title: "Политика конфиденциальности",
    desc: "Какие данные обрабатываются, cookie и рекомендательные технологии.",
  },
  {
    href: "/terms",
    icon: FileText,
    title: "Правила пользования и лицензионное соглашение",
    desc: "Условия доступа к сайту и платных услуг.",
  },
  {
    href: "/app",
    icon: Smartphone,
    title: "Приложение на телефон",
    desc: "Как установить АрендаСити на iPhone (Safari) и Android (Chrome). QR-код для быстрого доступа.",
  },
  {
    href: "/about",
    icon: BookOpen,
    title: "О компании",
    desc: `Кто стоит за ${COMPANY.brand} и как мы работаем с объектами.`,
  },
  {
    href: "/contacts",
    icon: HelpCircle,
    title: "Помощь и контакты",
    desc: "Телефон, почта и адрес офиса — если не нашли ответ в справочнике.",
  },
];

export default function HelpCenterPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SeoHead
        title={`Справочный центр — ${COMPANY.brand}`}
        description={`Правила сайта, конфиденциальность и рекомендательные технологии ${RECOMMENDATION_TECH_NAME_RU}.`}
        url={absoluteUrl("/help")}
      />
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 lg:px-8 py-10 mt-[56px] lg:mt-[104px] max-w-3xl">
        <nav className="text-[11px] text-muted-foreground mb-6 flex items-center gap-1.5">
          <Link to="/" className="hover:text-foreground transition-colors">
            Главная
          </Link>
          <span className="opacity-50">/</span>
          <span className="text-foreground">Справочный центр</span>
        </nav>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground mb-2">
          Справочный центр
        </h1>
        <p className="text-sm text-muted-foreground mb-8">
          Документация по разделам и ролям, юридические документы и ответы о
          работе каталога.
        </p>

        <ul className="space-y-3">
          {articles.map((a) => (
            <li key={a.href}>
              <Link
                to={a.href}
                className="flex gap-3 p-4 rounded-lg border border-border bg-card hover:border-primary/30 transition-colors"
              >
                <a.icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span>
                  <span className="block text-sm font-semibold text-foreground">
                    {a.title}
                  </span>
                  <span className="block text-xs text-muted-foreground mt-1 leading-relaxed">
                    {a.desc}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <SiteFooter />
    </div>
  );
}
