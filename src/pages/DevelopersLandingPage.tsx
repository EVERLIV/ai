import { ArrowRight, Building2, FileCheck, LayoutGrid } from "lucide-react";
import { Link } from "react-router-dom";
import SeoHead from "@/components/SeoHead";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

const BENEFITS = [
  {
    icon: LayoutGrid,
    title: "Каталог проектов",
    text: "ЖК и серии домов с планировками — в одном кабинете.",
  },
  {
    icon: FileCheck,
    title: "Верификация",
    text: "Значок доверия после проверки документов модератором.",
  },
  {
    icon: Building2,
    title: "Фильтр «от застройщика»",
    text: "Объекты видны в общем каталоге с отдельным фильтром.",
  },
];

export default function DevelopersLandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SeoHead
        title="Застройщикам — АрендаСити"
        description="Разместите проекты и планировки на АрендаСити: кабинет, верификация, заявки."
      />
      <SiteHeader />

      <main className="flex-1 mt-[56px] lg:mt-[104px]">
        <section className="border-b border-border/50 bg-gradient-to-b from-muted/40 to-background">
          <div className="container mx-auto px-4 lg:px-8 py-14 sm:py-20 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary mb-3">
              B2B
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground leading-tight">
              АрендаСити для застройщиков
            </h1>
            <p className="mt-4 text-base text-muted-foreground leading-relaxed">
              Публикуйте ЖК и серии домов, принимайте заявки и показывайте ход
              строительства. Отдельный тип аккаунта — не путается с агентствами.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/auth?tab=register&type=developer"
                className="inline-flex items-center gap-2 h-11 px-5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
              >
                Зарегистрироваться
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/zastroyshchiki"
                className="inline-flex items-center h-11 px-5 rounded-lg border border-border text-sm font-medium hover:bg-muted/50"
              >
                Смотреть каталог
              </Link>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 lg:px-8 py-12 grid sm:grid-cols-3 gap-6">
          {BENEFITS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="space-y-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-sm font-semibold">{title}</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                {text}
              </p>
            </div>
          ))}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
