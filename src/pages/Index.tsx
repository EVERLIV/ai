import { useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import HeroSection from "@/components/HeroSection";
import SearchFilters, { defaultFilters, type PropertyFilters } from "@/components/SearchFilters";
import PropertyGrid from "@/components/PropertyGrid";
import RentSection from "@/components/RentSection";
import MapSection from "@/components/MapSection";
import FeaturesSection from "@/components/FeaturesSection";
import OwnerSection from "@/components/OwnerSection";
import AboutSection from "@/components/AboutSection";
import ListPropertyBlock from "@/components/ListPropertyBlock";
import NewsSection from "@/components/NewsSection";
import PopularPropertiesSlider from "@/components/PopularPropertiesSlider";
import ConsultationWidget from "@/components/ConsultationWidget";
import MobileHomeSearch from "@/components/mobile/MobileHomeSearch";
import SiteFooter from "@/components/SiteFooter";
import SeoHead from "@/components/SeoHead";
import OrganizationJsonLd from "@/components/OrganizationJsonLd";
import { absoluteUrl } from "@/config/site";
import { Link } from "react-router-dom";
import { Building2, Home, TreePine } from "lucide-react";

export default function Index() {
  const [filters, setFilters] = useState<PropertyFilters>(defaultFilters);

  return (
    <div className="min-h-screen bg-background">
      <SeoHead
        title="Аренда и продажа недвижимости в Иркутске — АрендаСити"
        description="Единый портал жилой и коммерческой недвижимости в Иркутске и области. Бесплатный каталог без переплат на агрегаторах и лишних комиссий."
        url={absoluteUrl("/")}
      />
      <OrganizationJsonLd />
      <SiteHeader />
      <MobileHomeSearch />
      <HeroSection />

      <section className="hidden lg:block border-b border-border/60 bg-muted/20">
        <div className="container mx-auto px-4 lg:px-8 py-4">
          <div className="flex flex-wrap gap-2">
            <Link
              to="/zhilaya"
              className="inline-flex items-center gap-2 h-9 px-3.5 rounded-md border border-border bg-card text-sm font-medium text-foreground hover:border-primary/40 transition-colors"
            >
              <Home className="w-4 h-4 text-primary" /> Жилая
            </Link>
            <Link
              to="/catalog"
              className="inline-flex items-center gap-2 h-9 px-3.5 rounded-md border border-border bg-card text-sm font-medium text-foreground hover:border-primary/40 transition-colors"
            >
              <Building2 className="w-4 h-4 text-primary" /> Коммерция
            </Link>
            <Link
              to="/zhilaya/uchastki"
              className="inline-flex items-center gap-2 h-9 px-3.5 rounded-md border border-border bg-card text-sm font-medium text-foreground hover:border-primary/40 transition-colors"
            >
              <TreePine className="w-4 h-4 text-primary" /> Участки
            </Link>
            <Link
              to="/zhilaya/catalog"
              className="inline-flex items-center gap-2 h-9 px-3.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Каталог жилья →
            </Link>
          </div>
        </div>
      </section>

      <NewsSection />
      <div className="hidden lg:block">
        <SearchFilters onAIClick={() => {}} filters={filters} onChange={setFilters} />
      </div>
      <PropertyGrid filters={filters} />
      <PopularPropertiesSlider />
      <RentSection />
      <MapSection />
      <FeaturesSection />
      <AboutSection />
      <OwnerSection />
      <ListPropertyBlock />
      <section className="py-10 bg-muted/20 border-y border-border/40">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="rounded-2xl border border-border bg-card p-6 lg:p-8 flex flex-col lg:flex-row gap-5 lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 text-primary text-sm font-semibold mb-2">
                <Home className="w-4 h-4" />
                Жилая недвижимость
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground">Квартиры, дома, комнаты и участки</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                Снять, купить или сдать жильё в Иркутске и области. Размещение для собственников — бесплатно.
              </p>
            </div>
            <Link to="/zhilaya" className="inline-flex items-center justify-center h-11 px-5 rounded-md bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity">
              Перейти в жилой каталог
            </Link>
          </div>
        </div>
      </section>
      <SiteFooter />
      <ConsultationWidget />
    </div>
  );
}
