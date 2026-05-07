import { useState } from "react";
import SiteHeader from "@/components/SiteHeader";
import HeroSection from "@/components/HeroSection";
import SearchFilters from "@/components/SearchFilters";
import PropertyGrid from "@/components/PropertyGrid";
import RentSection from "@/components/RentSection";
import AIAssistant from "@/components/AIAssistant";
import MapSection from "@/components/MapSection";
import FeaturesSection from "@/components/FeaturesSection";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import OwnerSection from "@/components/OwnerSection";
import AboutSection from "@/components/AboutSection";
import SiteFooter from "@/components/SiteFooter";

export default function Index() {
  const [aiOpen, setAiOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <HeroSection />
      <SearchFilters onAIClick={() => setAiOpen(true)} />
      <PropertyGrid />
      <RentSection />
      <MapSection />
      <FeaturesSection />
      <AnalyticsDashboard />
      <AboutSection />
      <OwnerSection />
      <SiteFooter />
      <AIAssistant open={aiOpen} onToggle={() => setAiOpen(!aiOpen)} />
    </div>
  );
}
