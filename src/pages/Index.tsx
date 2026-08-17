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
      <SiteFooter />
      <ConsultationWidget />
    </div>
  );
}

