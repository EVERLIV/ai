import { Heart, Mail, Sparkles, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import heroImg from "@/assets/hero-commercial.jpg";
import CompanyStatsSidebar from "@/components/CompanyStatsSidebar";
import SeoHead from "@/components/SeoHead";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import VacancyCard from "@/components/VacancyCard";
import { COMPANY, CONTACTS } from "@/config/company";
import { absoluteUrl } from "@/config/site";
import { VACANCIES } from "@/data/vacancies";

const perks = [
  {
    icon: Users,
    text: "Небольшая продуктовая команда — решения принимаются быстро",
  },
  {
    icon: Heart,
    text: "Реальный региональный продукт, а не «витрина агентства»",
  },
  {
    icon: Sparkles,
    text: "Влияние на рост каталога, рекламы и партнёрств ДАДАТУТ",
  },
];

export default function VacanciesPage() {
  const [scrollPct, setScrollPct] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      setScrollPct(docH > 0 ? Math.min(100, (window.scrollY / docH) * 100) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      <SeoHead
        title="Вакансии ДАДАТУТ"
        description="Работа в команде ДАДАТУТ: sales-менеджер по продукту и маркетолог проекта. Открытый каталог недвижимости Иркутска и области."
        url={absoluteUrl("/vacancies")}
      />
      <SiteHeader />

      <div className="sticky top-[56px] lg:top-[104px] z-30 mt-[56px] lg:mt-[104px] bg-card/90 backdrop-blur-xl shadow-[0_1px_0_0_hsl(var(--border)/0.5)]">
        <div className="container mx-auto px-4 lg:px-8 h-10 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">
            Главная
          </Link>
          <span className="opacity-50">/</span>
          <span className="text-foreground">Вакансии</span>
        </div>
        <div className="h-px bg-border/30">
          <div
            className="h-full bg-foreground/20 transition-[width] duration-100"
            style={{ width: `${scrollPct}%` }}
          />
        </div>
      </div>

      <main className="flex-1">
        <section className="relative overflow-hidden border-b border-border">
          <div className="relative h-[280px] lg:h-[320px]">
            <img
              src={heroImg}
              alt=""
              className="w-full h-full object-cover"
              aria-hidden
            />
            <div className="absolute inset-0 bg-foreground/70" />
            <div className="absolute inset-0 flex items-center">
              <div className="container mx-auto px-4 lg:px-8">
                <p className="text-primary text-xs font-semibold uppercase tracking-widest mb-3">
                  Карьера
                </p>
                <h1 className="font-display text-4xl lg:text-5xl font-bold text-background leading-tight mb-4">
                  Вакансии в {COMPANY.brand}
                </h1>
                <p className="text-background/75 text-base max-w-2xl leading-relaxed">
                  Строим открытый каталог недвижимости Иркутска и области.
                  Ищем sales-менеджера по продукту и маркетолога проекта —
                  отклик только по email с резюме.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1 min-w-0 space-y-8">
                <div className="grid sm:grid-cols-3 gap-3">
                  {perks.map((p) => {
                    const Icon = p.icon;
                    return (
                      <div
                        key={p.text}
                        className="flex gap-3 p-4 bg-muted/30 border border-border"
                      >
                        <Icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {p.text}
                        </p>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-6">
                  <div>
                    <h2 className="font-display text-2xl font-bold text-foreground mb-1">
                      Открытые позиции
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {VACANCIES.length} вакансии · резюме на{" "}
                      <a
                        href={`mailto:${CONTACTS.email}`}
                        className="text-primary hover:underline"
                      >
                        {CONTACTS.email}
                      </a>
                    </p>
                  </div>
                  {VACANCIES.map((vacancy) => (
                    <VacancyCard key={vacancy.id} vacancy={vacancy} />
                  ))}
                </div>

                <div
                  id="vacancy-apply"
                  className="bg-card border border-border p-6 sm:p-8 scroll-mt-28"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                    <div className="w-12 h-12 bg-primary/10 flex items-center justify-center shrink-0">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-display text-xl font-bold text-foreground mb-1">
                        Как откликнуться
                      </h2>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Формы заявки нет — пришлите резюме (PDF/ссылка) на
                        почту. В теме письма укажите название вакансии. Ответим
                        в рабочие часы: {CONTACTS.hours}.
                      </p>
                    </div>
                    <a
                      href={`mailto:${CONTACTS.email}?subject=${encodeURIComponent("Резюме — вакансия ДАДАТУТ")}`}
                      className="shrink-0 inline-flex items-center justify-center gap-2 h-11 px-5 bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
                    >
                      <Mail className="w-4 h-4" />
                      {CONTACTS.email}
                    </a>
                  </div>
                </div>
              </div>

              <div className="hidden lg:block lg:w-[280px] xl:w-[300px] shrink-0 sticky top-[110px] self-start">
                <CompanyStatsSidebar />
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
