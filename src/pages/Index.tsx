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
import SiteFooter from "@/components/SiteFooter";
import SeoHead from "@/components/SeoHead";
import OrganizationJsonLd from "@/components/OrganizationJsonLd";
import { SITE } from "@/config/site";
import { Link } from "react-router-dom";
import { Home } from "lucide-react";

export default function Index() {
  const [filters, setFilters] = useState<PropertyFilters>(defaultFilters);

  return (
    <div className="min-h-screen bg-background">
      <SeoHead title={SITE.title} description={SITE.description} />
      <OrganizationJsonLd />
      <SiteHeader />
      <HeroSection />
      <NewsSection />
      <SearchFilters onAIClick={() => {}} filters={filters} onChange={setFilters} />
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
                Новый раздел
              </div>
              <h2 className="font-display text-2xl font-bold text-foreground">Квартиры, дома и комнаты</h2>
              <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
                Отдельный раздел для жилья в Иркутске и области: снять, купить или сдать квартиру, дом или комнату. Тот же личный кабинет, что и для коммерции, а размещение для собственников — бесплатно.
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

