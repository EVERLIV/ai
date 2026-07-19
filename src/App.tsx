import { useState, lazy, Suspense } from "react";
import { ConversationProvider } from "@elevenlabs/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Gate from "./pages/Gate.tsx";

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
import AdsCatalog from "./pages/AdsCatalog.tsx";
import NotFound from "./pages/NotFound.tsx";
import ListProperty from "./pages/ListProperty.tsx";
import NewsPage from "./pages/NewsPage.tsx";
import NewsPostPage from "./pages/NewsPostPage.tsx";
import AboutPage from "./pages/AboutPage.tsx";
import AccountPage from "./pages/AccountPage.tsx";
import ContactsPage from "./pages/ContactsPage.tsx";
import ResetPassword from "./pages/ResetPassword.tsx";
import InstallPrompt from "@/components/InstallPrompt";
import CookieBanner from "@/components/CookieBanner";

const queryClient = new QueryClient();

const App = () => {
  const [unlocked, setUnlocked] = useState(() => {
    // v2: новый пароль — сбрасываем старые сессии
    if (localStorage.getItem("site_unlock_v") !== "3") {
      localStorage.removeItem("site_unlocked");
    }
    return localStorage.getItem("site_unlocked") === "true";
  });

  if (!unlocked) {
    return <Gate onUnlock={() => {
      localStorage.setItem("site_unlock_v", "3");
      setUnlocked(true);
    }} />;
  }

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
                <Route path="/account" element={<AccountPage />} />
                <Route path="/contacts" element={<ContactsPage />} />
                <Route path="/reset-password" element={<ResetPassword />} />
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
            </BrowserRouter>
            </MotionConfig>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ConversationProvider>
  );
};

export default App;
