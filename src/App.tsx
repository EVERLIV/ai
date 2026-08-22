import { lazy, Suspense } from "react";
import { ConversationProvider } from "@elevenlabs/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";

// Ленивая загрузка — не попадает в основной бандл
const TasksPage          = lazy(() => import("./pages/TasksPage"));
const TaskNewPage        = lazy(() => import("./pages/TaskNewPage"));
const TaskDetailPage     = lazy(() => import("./pages/TaskDetailPage"));
const TaskReportsPage    = lazy(() => import("./pages/TaskReportsPage"));
const TaskAnalyticsPage  = lazy(() => import("./pages/TaskAnalyticsPage"));
import Index from "./pages/Index.tsx";
import PropertyDetail from "./pages/PropertyDetail.tsx";
import Catalog from "./pages/Catalog.tsx";
import Auth from "./pages/Auth.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import OfficesPage from "./pages/OfficesPage.tsx";
import RetailPage from "./pages/RetailPage.tsx";
import WarehousesPage from "./pages/WarehousesPage.tsx";
import LandPage from "./pages/LandPage.tsx";
import AdsCatalog from "./pages/AdsCatalog.tsx";
import NotFound from "./pages/NotFound.tsx";
import ListProperty from "./pages/ListProperty.tsx";
import NewsPage from "./pages/NewsPage.tsx";
import NewsPostPage from "./pages/NewsPostPage.tsx";
import AboutPage from "./pages/AboutPage.tsx";
import AccountPage from "./pages/AccountPage.tsx";
import AgencyPublicPage from "./pages/AgencyPublicPage.tsx";
import ContactsPage from "./pages/ContactsPage.tsx";
import VacanciesPage from "./pages/VacanciesPage.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import ResidentialHomePage from "./pages/residential/ResidentialHomePage.tsx";
import ResidentialCatalog from "./pages/residential/ResidentialCatalog.tsx";
import ApartmentsPage from "./pages/residential/ApartmentsPage.tsx";
import HousesPage from "./pages/residential/HousesPage.tsx";
import RoomsPage from "./pages/residential/RoomsPage.tsx";
import PlotsPage from "./pages/residential/PlotsPage.tsx";
import InstallPrompt from "@/components/InstallPrompt";
import CookieBanner from "@/components/CookieBanner";
import MobileBottomNav from "@/components/mobile/MobileBottomNav";
const queryClient = new QueryClient();

const App = () => {
  return (
    <ConversationProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <MotionConfig reducedMotion="user">
            <BrowserRouter>
              <InstallPrompt />
              <CookieBanner />
              <div className="pb-mobile-nav">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/kommercheskaya" element={<Navigate to="/" replace />} />
                <Route path="/catalog" element={<Catalog />} />
                <Route path="/property/:id" element={<PropertyDetail />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/offices" element={<OfficesPage />} />
                <Route path="/retail" element={<RetailPage />} />
                <Route path="/warehouses" element={<WarehousesPage />} />
                <Route path="/land" element={<LandPage />} />
                <Route path="/ads" element={<AdsCatalog />} />
                <Route path="/list-property" element={<ListProperty />} />
                <Route path="/news" element={<NewsPage />} />
                <Route path="/news/:slug" element={<NewsPostPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/account" element={<AccountPage />} />
                <Route path="/agentstvo/:id" element={<AgencyPublicPage />} />
                <Route path="/contacts" element={<ContactsPage />} />
                <Route path="/vacancies" element={<VacanciesPage />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/zhilaya" element={<ResidentialHomePage />} />
                <Route path="/zhilaya/catalog" element={<ResidentialCatalog />} />
                <Route path="/zhilaya/kvartiry" element={<ApartmentsPage />} />
                <Route path="/zhilaya/doma" element={<HousesPage />} />
                <Route path="/zhilaya/komnaty" element={<RoomsPage />} />
                <Route path="/zhilaya/uchastki" element={<PlotsPage />} />
                <Route path="/zhilaya/list-property" element={<ListProperty segment="residential" />} />
                {/* Таск-менеджер — lazy, не влияет на основной бандл */}
                <Route path="/tasks" element={
                  <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-sm text-gray-400">Загрузка...</div>}>
                    <TasksPage />
                  </Suspense>
                } />
                <Route path="/tasks/new" element={
                  <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-sm text-gray-400">Загрузка...</div>}>
                    <TaskNewPage />
                  </Suspense>
                } />
                <Route path="/tasks/:id" element={
                  <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-sm text-gray-400">Загрузка...</div>}>
                    <TaskDetailPage />
                  </Suspense>
                } />
                <Route path="/reports" element={
                  <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-sm text-gray-400">Загрузка...</div>}>
                    <TaskReportsPage />
                  </Suspense>
                } />
                <Route path="/analytics" element={
                  <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-sm text-gray-400">Загрузка...</div>}>
                    <TaskAnalyticsPage />
                  </Suspense>
                } />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </div>
              <MobileBottomNav />
            </BrowserRouter>
            </MotionConfig>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ConversationProvider>
  );
};

export default App;
