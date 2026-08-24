import { ArrowRight, Building2, CheckCircle, Home, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import CategoryContactForm from "@/components/CategoryContactForm";
import CategoryPropertySlider from "@/components/CategoryPropertySlider";
import ListPropertyBlock from "@/components/ListPropertyBlock";
import SeoHead from "@/components/SeoHead";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { absoluteUrl } from "@/config/site";
import { buildCatalogUrl } from "@/lib/catalogLinks";

type Props = {
  title: string;
  description: string;
  badge: string;
  type: string;
  pageUrl: string;
  heroTitle: string;
  heroText: string;
  features: string[];
};

export default function ResidentialCategoryPage({
  title,
  description,
  badge,
  type,
  pageUrl,
  heroTitle,
  heroText,
  features,
}: Props) {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SeoHead
        title={title}
        description={description}
        url={absoluteUrl(pageUrl)}
      />
      <SiteHeader />

      <section className="pt-14 md:pt-[98px] bg-muted/35 border-b border-border/50">
        <div className="container mx-auto px-4 lg:px-8 py-16 lg:py-20">
          <div className="max-w-3xl space-y-6">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-semibold">
              <Home className="w-4 h-4" />
              {badge}
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground leading-tight">
              {heroTitle}
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">
              {heroText}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to={buildCatalogUrl({ segment: "residential", types: type })}
                className="inline-flex items-center gap-2 h-11 px-5 rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
              >
                Смотреть в каталоге <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/zhilaya/list-property?mode=rent"
                className="inline-flex items-center gap-2 h-11 px-5 rounded-md border border-border text-sm font-semibold hover:bg-muted/50 transition-colors"
              >
                Разместить объект за 0 ₽
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid md:grid-cols-3 gap-4">
            {features.map((feature) => (
              <div
                key={feature}
                className="rounded-xl border border-border bg-card p-5 flex items-start gap-3"
              >
                <CheckCircle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm text-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-12 bg-muted/20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-border bg-card p-5">
              <Building2 className="w-5 h-5 text-primary mb-3" />
              <div className="font-semibold text-foreground mb-1">
                Объекты от собственников и агентств
              </div>
              <p className="text-sm text-muted-foreground">
                В каталоге можно быстро сравнить предложения по площади, цене и
                району.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <MapPin className="w-5 h-5 text-primary mb-3" />
              <div className="font-semibold text-foreground mb-1">
                Иркутск и область
              </div>
              <p className="text-sm text-muted-foreground">
                Отдельный жилой раздел внутри ArendaCity без запуска второго
                домена.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-5">
              <Home className="w-5 h-5 text-primary mb-3" />
              <div className="font-semibold text-foreground mb-1">
                Бесплатное размещение
              </div>
              <p className="text-sm text-muted-foreground">
                Собственник может добавить квартиру, дом или комнату за 0 ₽.
              </p>
            </div>
          </div>
        </div>
      </section>

      <CategoryPropertySlider
        segment="residential"
        type={type}
        title={`${type} в каталоге`}
      />
      <CategoryContactForm category={type.toLowerCase()} />
      <ListPropertyBlock segment="residential" />
      <SiteFooter />
    </div>
  );
}
