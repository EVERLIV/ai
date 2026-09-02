import { ArrowRight, Map } from "lucide-react";
import { Link } from "react-router-dom";
import SeoHead from "@/components/SeoHead";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { SEGMENT_QUICK_LINKS, SEGMENT_ROUTES } from "@/config/propertySegments";
import { absoluteUrl } from "@/config/site";

export default function LandHomePage() {
  const land = SEGMENT_QUICK_LINKS.land;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SeoHead
        title="Земля и участки — ДАДАТУТ"
        description="Каталог земли и участков в Иркутске: ИЖС, жилая и коммерческая земля. Аренда и продажа."
        url={absoluteUrl(SEGMENT_ROUTES.land.home)}
      />
      <SiteHeader contextSegment="land" />
      <main className="flex-1 mt-[56px] lg:mt-[104px]">
        <section className="container mx-auto px-4 lg:px-8 py-10 sm:py-14">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 text-primary mb-4">
              <Map className="w-5 h-5" />
              <span className="text-xs font-semibold uppercase tracking-wide">
                Раздел
              </span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
              {land.title}
            </h1>
            <p className="mt-3 text-muted-foreground text-sm sm:text-base max-w-xl">
              {land.subtitle}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                to={SEGMENT_ROUTES.land.catalog}
                className="inline-flex items-center gap-2 h-11 px-5 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Смотреть каталог
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to={SEGMENT_ROUTES.land.listProperty}
                className="inline-flex items-center gap-2 h-11 px-5 rounded-md border border-border text-sm font-medium hover:bg-muted transition-colors"
              >
                Разместить участок
              </Link>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {land.categories.map((cat) => (
              <Link
                key={cat.href + cat.label}
                to={cat.href}
                className="rounded-lg border border-border/80 bg-card p-4 hover:border-primary/40 transition-colors"
              >
                <div className="font-semibold text-sm text-foreground">
                  {cat.label}
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  {cat.desc}
                </p>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
