import {
  BookMarked,
  BookOpen,
  ChevronRight,
  Clock,
  FileText,
  HelpCircle,
  LifeBuoy,
  Mail,
  Scale,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";
import SeoHead from "@/components/SeoHead";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { COMPANY, CONTACTS } from "@/config/company";
import { absoluteUrl } from "@/config/site";
import { useAuth } from "@/hooks/useAuth";
import { RECOMMENDATION_TECH_NAME } from "@/lib/recommendationEngine";

type SidebarLink = {
  href: string;
  label: string;
  icon: React.ElementType;
};

const SIDEBAR_SECTIONS: { title: string; links: SidebarLink[] }[] = [
  {
    title: "Справочник",
    links: [
      { href: "/help", label: "Справочный центр", icon: HelpCircle },
      { href: "/docs", label: "Документация портала", icon: BookMarked },
      { href: "/docs#list", label: "Как разместить объект", icon: BookOpen },
      { href: "/docs#account", label: "Личный кабинет", icon: BookOpen },
      { href: "/docs#faq", label: "Частые вопросы", icon: HelpCircle },
    ],
  },
  {
    title: "Сервисы",
    links: [
      { href: "/list-property", label: "Разместить объект", icon: BookOpen },
      { href: "/catalog", label: "Каталог", icon: BookOpen },
      { href: "/app", label: "Приложение", icon: Smartphone },
      { href: "/account", label: "Личный кабинет", icon: BookOpen },
    ],
  },
  {
    title: "Документы",
    links: [
      { href: "/privacy", label: "Конфиденциальность", icon: Scale },
      { href: "/terms", label: "Правила сайта", icon: FileText },
      {
        href: "/recommendations",
        label: `Рекомендации (${RECOMMENDATION_TECH_NAME})`,
        icon: Sparkles,
      },
      { href: "/about", label: "О нас", icon: BookOpen },
    ],
  },
];

export default function SupportPage() {
  const { user } = useAuth();
  const lkHref = user
    ? "/account#support"
    : "/auth?tab=login&redirect=%2Faccount%23support";

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fb]">
      <SeoHead
        title="Поддержка — ДАДАТУТ"
        description="Служба поддержки ДАДАТУТ: support@dadatut.ru или обращение через личный кабинет."
        url={absoluteUrl("/support")}
      />
      <SiteHeader />

      <main className="flex-1 mt-[56px] lg:mt-[104px]">
        <div className="container mx-auto px-4 lg:px-8 py-5 lg:py-7 max-w-6xl">
          <nav className="text-[11px] text-muted-foreground mb-4 flex items-center gap-1.5">
            <Link to="/" className="hover:text-foreground">
              Главная
            </Link>
            <ChevronRight className="w-3 h-3 opacity-40" />
            <Link to="/help" className="hover:text-foreground">
              Справочный центр
            </Link>
            <ChevronRight className="w-3 h-3 opacity-40" />
            <span className="text-foreground">Поддержка</span>
          </nav>

          <div className="flex flex-col lg:flex-row gap-5 lg:gap-6 items-start">
            <aside className="w-full lg:w-[220px] xl:w-[240px] shrink-0">
              <div className="lg:sticky lg:top-28 border border-border bg-card">
                <div className="px-3 py-2.5 border-b border-border bg-muted/30">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Полезные разделы
                  </p>
                </div>
                <nav className="p-2 space-y-3">
                  {SIDEBAR_SECTIONS.map((section) => (
                    <div key={section.title}>
                      <p className="px-2 mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground/80">
                        {section.title}
                      </p>
                      <ul className="space-y-0.5">
                        {section.links.map(({ href, label, icon: Icon }) => (
                          <li key={href}>
                            <Link
                              to={href}
                              className="flex items-center gap-2 px-2 py-1.5 text-[13px] text-foreground/80 hover:text-foreground hover:bg-muted/50 transition-colors"
                            >
                              <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                              <span className="leading-snug">{label}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </nav>
              </div>
            </aside>

            <div className="flex-1 min-w-0 w-full border border-border bg-card">
              <div className="px-4 sm:px-5 py-3.5 border-b border-border">
                <h1 className="text-lg font-semibold text-foreground">
                  Поддержка {COMPANY.brand}
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {CONTACTS.hours}
                </p>
              </div>

              <div className="p-4 sm:p-5 space-y-4">
                <div className="border border-border bg-muted/20 px-4 py-4 space-y-3">
                  <p className="text-sm text-foreground leading-relaxed">
                    Обращения принимаются двумя способами: письмо на email или
                    форма в личном кабинете (раздел «Поддержка»). В ЛК вы
                    получите номер обращения и сможете прочитать ответ
                    поддержки.
                  </p>

                  <div className="grid sm:grid-cols-2 gap-3">
                    <a
                      href={`mailto:${CONTACTS.email}`}
                      className="flex items-start gap-3 border border-border bg-card px-3 py-3 hover:border-foreground/20 transition-colors"
                    >
                      <Mail className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-foreground">
                          Написать на email
                        </p>
                        <p className="text-xs text-primary mt-0.5 break-all">
                          {CONTACTS.email}
                        </p>
                      </div>
                    </a>

                    <Link
                      to={lkHref}
                      className="flex items-start gap-3 border border-border bg-card px-3 py-3 hover:border-foreground/20 transition-colors"
                    >
                      <LifeBuoy className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-foreground">
                          Личный кабинет
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {user
                            ? "Создать обращение с номером тикета"
                            : "Войти и создать обращение"}
                        </p>
                      </div>
                    </Link>
                  </div>
                </div>

                <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  Ответ на email или в ЛК — в рабочее время
                </p>

                <p className="text-[11px] text-muted-foreground leading-relaxed pt-2 border-t border-border">
                  Сначала проверьте{" "}
                  <Link to="/docs#faq" className="text-primary hover:underline">
                    частые вопросы
                  </Link>{" "}
                  и{" "}
                  <Link to="/docs" className="text-primary hover:underline">
                    справочник
                  </Link>{" "}
                  — возможно, ответ уже есть.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
