import { useState } from "react";
import { ConversationProvider } from "@elevenlabs/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Gate from "./pages/Gate.tsx";
import Index from "./pages/Index.tsx";
import PropertyDetail from "./pages/PropertyDetail.tsx";
import Catalog from "./pages/Catalog.tsx";
import Auth from "./pages/Auth.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import OfficesPage from "./pages/OfficesPage.tsx";
import RetailPage from "./pages/RetailPage.tsx";
import WarehousesPage from "./pages/WarehousesPage.tsx";
import AdsCatalog from "./pages/AdsCatalog.tsx";
import NotFound from "./pages/NotFound.tsx";
import ListProperty from "./pages/ListProperty.tsx";
import NewsPage from "./pages/NewsPage.tsx";
import NewsPostPage from "./pages/NewsPostPage.tsx";
import AboutPage from "./pages/AboutPage.tsx";

const queryClient = new QueryClient();

const App = () => {
  const [unlocked, setUnlocked] = useState(
    () => localStorage.getItem("site_unlocked") === "true"
  );

  if (!unlocked) {
    return <Gate onUnlock={() => setUnlocked(true)} />;
  }

  return (
    <ConversationProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/catalog" element={<Catalog />} />
                <Route path="/property/:id" element={<PropertyDetail />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/offices" element={<OfficesPage />} />
                <Route path="/retail" element={<RetailPage />} />
                <Route path="/warehouses" element={<WarehousesPage />} />
                <Route path="/ads" element={<AdsCatalog />} />
                <Route path="/list-property" element={<ListProperty />} />
                <Route path="/news" element={<NewsPage />} />
                <Route path="/news/:slug" element={<NewsPostPage />} />
                <Route path="/about" element={<AboutPage />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ConversationProvider>
  );
};

export default App;
