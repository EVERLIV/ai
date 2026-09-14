import type { LucideIcon } from "lucide-react";
import {
  Building2,
  Home,
  KeyRound,
  LandPlot,
  MapPin,
  Store,
  Warehouse,
} from "lucide-react";
import { Link } from "react-router-dom";
import PropertyGridCard, {
  PropertyGridCardSkeleton,
} from "@/components/PropertyGridCard";
import RealtySearchPanel from "@/components/realty/RealtySearchPanel";
import SeoHead from "@/components/SeoHead";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import {
  HOME_MAIN_CATEGORIES,
  type HomeMainCategory,
} from "@/config/homeSearchCategories";
import { absoluteUrl } from "@/config/site";
import { useProperties } from "@/hooks/useProperties";
import { buildCatalogUrl } from "@/lib/catalogLinks";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  apartments: Home,
  rooms: KeyRound,
  houses: Home,
  garages: Warehouse,
  offices: Building2,
  retail: Store,
  warehouses: Warehouse,
  land: LandPlot,
};

function categoryHref(cat: HomeMainCategory): string {
  return buildCatalogUrl({
    segment: cat.segment,
    types: [...cat.types],
    deal: "Продажа",
  });
}

export default function NedvijimostPage() {
  const { data: properties = [], isLoading } = useProperties();
  const recommendations = properties.slice(0, 8);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SeoHead
        title="Недвижимость"
        description="Каталог недвижимости ДАДАТУТ: квартиры, дома, земля, офисы — купить, снять или посуточно в Иркутске и области."
        url={absoluteUrl("/nedvijimost")}
      />
      <SiteHeader />

      <main className="flex-1 mt-[56px] lg:mt-[104px]">
        <section className="bg-muted/60 px-3 pt-4 pb-4 lg:px-8 lg:pt-8 lg:pb-8">
          <div className="container mx-auto max-w-3xl px-0">
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground tracking-tight">
              Недвижимость
            </h1>
            <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
              Иркутск и область
            </p>

            <div className="mt-3 lg:mt-4">
              <RealtySearchPanel searchLabel="Показать объявления" />
            </div>
          </div>
        </section>

        <section className="px-3 lg:px-8 py-5 border-b border-border/60">
          <div className="container mx-auto max-w-3xl px-0">
            <h2 className="text-sm font-semibold text-foreground mb-2.5">
              Категории
            </h2>
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
              {HOME_MAIN_CATEGORIES.map((cat) => {
                const Icon = CATEGORY_ICONS[cat.id] ?? Home;
                return (
                  <Link
                    key={cat.id}
                    to={categoryHref(cat)}
                    className="flex flex-col items-center gap-1 rounded-lg border border-border bg-card px-1 py-2.5 text-center hover:border-primary/40 transition-colors"
                  >
                    <span className="w-8 h-8 rounded-md bg-muted flex items-center justify-center text-primary">
                      <Icon className="w-4 h-4" />
                    </span>
                    <span className="text-[10px] sm:text-[11px] font-medium text-foreground leading-tight">
                      {cat.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="px-3 lg:px-8 py-6">
          <div className="container mx-auto max-w-5xl px-0">
            <h2 className="font-display text-lg lg:text-xl font-bold text-foreground mb-3">
              Рекомендации
            </h2>
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <PropertyGridCardSkeleton key={i} />
                ))}
              </div>
            ) : recommendations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Пока нет объявлений. Загляните позже или измените фильтры.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {recommendations.map((p) => (
                  <PropertyGridCard key={p.id} property={p} />
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
