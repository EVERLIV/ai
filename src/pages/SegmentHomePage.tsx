import { ArrowRight, Building2, Home } from "lucide-react";
import { Link } from "react-router-dom";
import BrandMark from "@/components/BrandMark";
import SeoHead from "@/components/SeoHead";
import { CONTACTS } from "@/config/company";
import { SEGMENT_CHOOSER } from "@/config/propertySegments";
import { absoluteUrl, SITE } from "@/config/site";

export default function SegmentHomePage() {
  const commercial = SEGMENT_CHOOSER.commercial;
  const residential = SEGMENT_CHOOSER.residential;

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      <SeoHead
        title={`${SITE.name} — выберите раздел: коммерческая или жилая недвижимость`}
        description="Аренда и продажа коммерческой и жилой недвижимости в Иркутске и области. Выберите раздел: офисы, склады, торговля или квартиры, дома и комнаты."
        url={absoluteUrl("/")}
      />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 20% 0%, hsl(var(--primary) / 0.08), transparent 55%), radial-gradient(ellipse 70% 45% at 90% 10%, hsl(220 20% 50% / 0.06), transparent 50%), linear-gradient(180deg, hsl(var(--muted) / 0.45) 0%, hsl(var(--background)) 55%)",
        }}
      />

      <header className="relative z-10 border-b border-border/50 bg-card/70 backdrop-blur-md">
        <div className="container mx-auto px-4 lg:px-8 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <BrandMark className="h-3.5 w-auto shrink-0" />
            <div className="leading-none min-w-0">
              <div className="font-sans text-[16px] font-bold tracking-tight text-foreground">
                АРЕНДА<span className="text-primary">СИТИ</span>
              </div>
              <div className="text-[9px] font-medium tracking-wide text-muted-foreground mt-0.5 uppercase hidden sm:block">
                Недвижимость в Иркутске
              </div>
            </div>
          </div>
          <a
            href={`tel:${CONTACTS.phoneTel}`}
            className="text-xs sm:text-sm font-medium text-foreground hover:text-primary transition-colors shrink-0"
          >
            {CONTACTS.phone}
          </a>
        </div>
      </header>

      <main className="relative z-10 flex-1 container mx-auto px-4 lg:px-8 py-10 sm:py-14 lg:py-16">
        <div className="max-w-5xl mx-auto">
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground tracking-tight text-center">
            АрендаСити
          </h1>
          <p className="mt-3 text-center text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
            Выберите раздел — и перейдите к нужным объектам. Сменить раздел
            можно в любой момент в шапке сайта.
          </p>

          <div className="mt-8 sm:mt-10 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
            <SegmentCard
              icon={Building2}
              title={commercial.title}
              subtitle={commercial.subtitle}
              href={commercial.href}
              categories={[...commercial.categories]}
              cta="Перейти в коммерческую"
            />
            <SegmentCard
              icon={Home}
              title={residential.title}
              subtitle={residential.subtitle}
              href={residential.href}
              categories={[...residential.categories]}
              cta="Перейти в жилую"
            />
          </div>
        </div>
      </main>
    </div>
  );
}

function SegmentCard({
  icon: Icon,
  title,
  subtitle,
  href,
  categories,
  cta,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  href: string;
  categories: { label: string; desc: string; href: string }[];
  cta: string;
}) {
  return (
    <section className="flex flex-col rounded-2xl border border-border bg-card/90 shadow-[0_12px_40px_-24px_rgba(0,0,0,0.35)] overflow-hidden">
      <Link
        to={href}
        className="group block px-5 sm:px-6 pt-6 pb-5 border-b border-border/60 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
              {title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              {subtitle}
            </p>
          </div>
          <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0 mt-1" />
        </div>
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
          {cta}
          <ArrowRight className="w-4 h-4" />
        </span>
      </Link>

      <ul className="px-5 sm:px-6 py-4 space-y-1 flex-1">
        {categories.map((item) => (
          <li key={item.href}>
            <Link
              to={item.href}
              className="flex flex-col sm:flex-row sm:items-baseline sm:gap-2 rounded-lg px-2 py-2.5 -mx-2 hover:bg-muted/50 transition-colors"
            >
              <span className="text-sm font-semibold text-foreground shrink-0">
                {item.label}
              </span>
              <span className="text-xs sm:text-sm text-muted-foreground leading-snug">
                {item.desc}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
