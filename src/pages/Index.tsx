import { Home } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import AboutSection from "@/components/AboutSection";
import FeaturesSection from "@/components/FeaturesSection";
import HeroSection from "@/components/HeroSection";
import HomesGallerySection from "@/components/HomesGallerySection";
import MapSection from "@/components/MapSection";
import MobileHomeSearch from "@/components/mobile/MobileHomeSearch";
import NewsSection from "@/components/NewsSection";
import OrganizationJsonLd from "@/components/OrganizationJsonLd";
import PopularPropertiesSlider from "@/components/PopularPropertiesSlider";
import PropertyAIChat from "@/components/PropertyAIChat";
import PropertyGrid from "@/components/PropertyGrid";
import RealtorsGallerySection from "@/components/RealtorsGallerySection";
import RentSection from "@/components/RentSection";
import SearchFilters, {
  defaultFilters,
  type PropertyFilters,
} from "@/components/SearchFilters";
import SeoHead from "@/components/SeoHead";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { absoluteUrl, SITE } from "@/config/site";

const HOME_QUICK_LINKS = [
  { label: "Квартиры", href: "/zhilaya/kvartiry" },
  { label: "Дома", href: "/zhilaya/doma" },
  { label: "Комнаты", href: "/zhilaya/komnaty" },
  { label: "Земля", href: "/zemlya" },
  { label: "Офисы", href: "/offices" },
  { label: "Торговая", href: "/retail" },
  { label: "Склады", href: "/warehouses" },
  { label: "Посуточно", href: "/zhilaya/catalog?deal=%D0%9F%D0%BE%D1%81%D1%83%D1%82%D0%BE%D1%87%D0%BD%D0%BE" },
] as const;

export default function Index() {
  const [filters, setFilters] = useState<PropertyFilters>(defaultFilters);

  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title={SITE.title}
        description={SITE.description}
        url={absoluteUrl("/")}
      />
      <OrganizationJsonLd />
      <SiteHeader />
      <MobileHomeSearch />
      <HeroSection />

      <section className="hidden lg:block border-b border-border/60 bg-muted/20">
        <div className="container mx-auto px-4 lg:px-8 py-4">
          <div className="flex flex-wrap gap-2 items-center">
            {HOME_QUICK_LINKS.map((link) => (
              <Link
                key={link.href + link.label}
                to={link.href}
                className="inline-flex items-center h-8 px-3 rounded-lg border border-border bg-card text-sm font-medium text-foreground hover:border-primary/40 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link
              to="/rieltory"
              className="inline-flex items-center h-8 px-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Риелторы →
            </Link>
          </div>
        </div>
      </section>

      <section className="py-10 bg-muted/20 border-b border-border/40">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="rounded-2xl border border-border bg-card p-6 lg:p-8 flex flex-col lg:flex-row gap-5 lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 text-primary text-sm font-semibold mb-2">
                <Home className="w-4 h-4" />
                Весь каталог
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground">
                Квартиры, дома, земля и коммерция
              </h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                Купить, снять надолго или посуточно в Иркутске и области.
                Размещение для собственников — бесплатно.
              </p>
            </div>
            <Link
              to="/zhilaya/catalog"
              className="inline-flex items-center justify-center h-9 px-4 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Смотреть объявления
            </Link>
          </div>
        </div>
      </section>

      <div className="hidden lg:block">
        <SearchFilters
          onAIClick={() => {}}
          filters={filters}
          onChange={setFilters}
        />
      </div>
      <PropertyGrid filters={filters} />
      <PopularPropertiesSlider />
      <RentSection />
      <MapSection />
      <FeaturesSection />
      <AboutSection />
      <HomesGallerySection />
      <RealtorsGallerySection />
      <NewsSection />
      <SiteFooter />
      <PropertyAIChat showFab={false} />
    </div>
  );
}
