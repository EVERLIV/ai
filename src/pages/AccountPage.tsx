import {
  BarChart3,
  Briefcase,
  Building2,
  ChevronRight,
  FileText,
  Heart,
  Landmark,
  LogOut,
  MapPin,
  Maximize2,
  MessageCircle,
  MessageSquareText,
  User,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AgencyManagersTab from "@/components/account/AgencyManagersTab";
import AgencyTeamTab from "@/components/account/AgencyTeamTab";
import AgencyTelegramTab from "@/components/account/AgencyTelegramTab";
import MyLeadsTab from "@/components/account/MyLeadsTab";
import MyPropertiesTab from "@/components/account/MyPropertiesTab";
import MyReviewsTab from "@/components/account/MyReviewsTab";
import ProfileTab from "@/components/account/ProfileTab";
import StatsTab from "@/components/account/StatsTab";
import SeoHead from "@/components/SeoHead";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import VerifiedBadge from "@/components/VerifiedBadge";
import { useMyAgency } from "@/hooks/useAgency";
import { useAuth } from "@/hooks/useAuth";
import { formatLeadBadge, useNewLeadsCount } from "@/hooks/useMyLeads";
import {
  ACCOUNT_TYPE_LABELS,
  isProfileVerified,
  useProfile,
} from "@/hooks/useProfile";
import { useProperties } from "@/hooks/useProperties";

const OWNER_TABS = [
  { key: "favorites", label: "Избранное", icon: Heart },
  { key: "properties", label: "Мои объекты", icon: Building2 },
  { key: "requests", label: "Мои заявки", icon: FileText },
  { key: "stats", label: "Статистика", icon: BarChart3 },
  { key: "profile", label: "Мои данные", icon: User },
] as const;

/** Без отдельного «Агентство» — профиль уже объединяет данные аккаунта и агентства */
const AGENCY_EXTRA_TABS = [
  { key: "reviews", label: "Мои отзывы", icon: MessageSquareText },
  { key: "team", label: "Команда", icon: Users },
  { key: "managers", label: "Менеджеры", icon: Briefcase },
  { key: "telegram", label: "Telegram", icon: MessageCircle },
] as const;

type Tab =
  | (typeof OWNER_TABS)[number]["key"]
  | (typeof AGENCY_EXTRA_TABS)[number]["key"];

const VALID_TABS = new Set<string>([
  ...OWNER_TABS.map((t) => t.key),
  ...AGENCY_EXTRA_TABS.map((t) => t.key),
]);

export default function AccountPage() {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState<Tab>("favorites");
  const { data: properties = [] } = useProperties();
  const { data: profile } = useProfile();
  const { data: myAgency } = useMyAgency();
  const { data: newLeadsCount = 0 } = useNewLeadsCount();
  const isAgencyAccount =
    profile?.account_type === "agency" || !!myAgency;
  const isRealtorAccount = profile?.account_type === "realtor";
  const isSeeker = profile?.account_type === "seeker";
  const realtorReviewTab = AGENCY_EXTRA_TABS.filter((t) => t.key === "reviews");
  const tabs = isAgencyAccount
    ? [
        ...OWNER_TABS.slice(0, 4),
        ...AGENCY_EXTRA_TABS,
        {
          key: "profile" as const,
          label: "Профиль",
          icon: Landmark,
        },
      ]
    : isRealtorAccount
      ? [
          ...OWNER_TABS.slice(0, 4),
          ...realtorReviewTab,
          OWNER_TABS[4],
        ]
      : isSeeker
        ? OWNER_TABS.filter((t) => t.key !== "properties" && t.key !== "stats")
        : [...OWNER_TABS];
  const searchParams = new URLSearchParams(location.search);
  const requestedSegment =
    searchParams.get("segment") === "residential"
      ? "residential"
      : "commercial";
  const requestTypeParam = searchParams.get("request_type");
  const initialRequestType =
    requestTypeParam === "free_listing" || requestTypeParam === "management"
      ? requestTypeParam
      : undefined;

  useEffect(() => {
    const hash = location.hash.replace("#", "");
    // Старый якорь #agency → единый профиль
    if (hash === "agency") {
      setTab("profile");
      window.history.replaceState(null, "", `/account#profile`);
      return;
    }
    if (VALID_TABS.has(hash)) setTab(hash as Tab);
    else if (initialRequestType) setTab("properties");
  }, [location.hash, initialRequestType]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      const redirect = `${location.pathname}${location.search}${location.hash || "#properties"}`;
      navigate(`/auth?tab=register&redirect=${encodeURIComponent(redirect)}`, {
        replace: true,
      });
    }
  }, [
    authLoading,
    user,
    navigate,
    location.pathname,
    location.search,
    location.hash,
  ]);

  const switchTab = (key: Tab) => {
    setTab(key);
    const params = new URLSearchParams(location.search);
    params.delete("request_type");
    const qs = params.toString();
    window.history.replaceState(
      null,
      "",
      `/account${qs ? `?${qs}` : ""}#${key}`,
    );
  };

  if (authLoading || !user) {
    return null;
  }

  const fullName = user.user_metadata?.full_name || "";
  const email = user.email || "";
  const displayName =
    (isAgencyAccount &&
      (myAgency?.agency.name || profile?.agency_name || "").trim()) ||
    fullName ||
    profile?.full_name ||
    "";
  const initials = displayName
    ? displayName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : email[0]?.toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  // Mock favorites from local storage for demo
  const savedIds: string[] = JSON.parse(
    localStorage.getItem("saved_properties") || "[]",
  );
  const savedProperties = properties.filter((p) => savedIds.includes(p.id));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SeoHead
        title="Личный кабинет"
        description="Избранное, заявки и профиль пользователя АрендаСити."
        noindex
      />
      <SiteHeader />

      {/* Breadcrumbs */}
      <div className="sticky top-[56px] lg:top-[104px] z-30 mt-[56px] lg:mt-[104px] bg-card/90 backdrop-blur-xl shadow-[0_1px_0_0_hsl(var(--border)/0.5)]">
        <div className="container mx-auto px-4 lg:px-8 h-10 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">
            Главная
          </Link>
          <span className="opacity-50">/</span>
          <span className="text-foreground">Личный кабинет</span>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <aside className="lg:w-64 shrink-0">
            {/* Avatar */}
            <div className="bg-card overflow-hidden divide-y divide-border">
              {/* Profile */}
              <div className="flex items-center gap-3 p-4">
                <div className="w-10 h-10 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-bold shrink-0">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  {displayName && (
                    <div className="text-sm font-semibold text-foreground truncate">
                      {displayName}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground truncate">
                    {email}
                  </div>
                  {isAgencyAccount && fullName && (
                    <div className="text-[10px] text-muted-foreground/80 truncate mt-0.5">
                      Отв.: {fullName}
                    </div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-primary/10 text-primary font-medium">
                    {ACCOUNT_TYPE_LABELS[profile?.account_type || "owner"]}
                  </span>
                  {isProfileVerified(
                    myAgency?.agency.verification_status ||
                      profile?.verification_status,
                  ) && <VerifiedBadge showLabel={false} />}
                </div>
              </div>

              {/* Nav */}
              {tabs.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => switchTab(key as Tab)}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors ${
                    tab === key
                      ? "text-primary font-medium bg-primary/5"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4" strokeWidth={1.75} />
                    {label}
                  </div>
                  {key === "requests" && newLeadsCount > 0 ? (
                    <span className="min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-4 text-center">
                      {formatLeadBadge(newLeadsCount)}
                    </span>
                  ) : (
                    <ChevronRight
                      className="w-3.5 h-3.5 text-muted-foreground"
                      strokeWidth={1.75}
                    />
                  )}
                </button>
              ))}
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-muted-foreground hover:text-destructive transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Выйти
              </button>
            </div>
          </aside>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {tab === "favorites" && (
              <div>
                <h2 className="font-display text-xl font-bold text-foreground mb-5">
                  Избранное
                </h2>
                {savedProperties.length === 0 ? (
                  <div className="bg-card p-12 text-center">
                    <Heart className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm font-medium text-foreground mb-1">
                      Нет сохранённых объектов
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                      Нажмите ♡ на карточке объекта чтобы добавить в избранное
                    </p>
                    <Link
                      to="/catalog"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                    >
                      Перейти в каталог <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedProperties.map((p) => (
                      <Link
                        key={p.id}
                        to={`/property/${p.id}`}
                        className="group flex gap-4 bg-card rounded-lg p-4 hover:shadow-md transition-all"
                      >
                        <div className="w-24 h-20 bg-muted shrink-0 overflow-hidden rounded-md">
                          {p.cover_photo && (
                            <img
                              src={p.cover_photo}
                              alt={p.address}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-semibold bg-primary text-primary-foreground px-1.5 py-0.5">
                              {p.deal_type}
                            </span>
                            <span className="text-[10px] text-muted-foreground">
                              {p.type}
                            </span>
                          </div>
                          <div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                            {p.address}
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {p.district}
                            </span>
                            <span className="flex items-center gap-1">
                              <Maximize2 className="w-3 h-3" />
                              {p.area} м²
                            </span>
                          </div>
                          {Number(p.price) > 0 && (
                            <div className="mt-1.5 text-sm font-bold text-foreground">
                              {Number(p.price).toLocaleString("ru-RU")} ₽
                              {p.deal_type === "Аренда" && (
                                <span className="text-xs font-normal text-muted-foreground">
                                  /мес
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === "properties" && (
              <MyPropertiesTab
                defaultSegment={requestedSegment}
                initialRequestType={initialRequestType}
              />
            )}

            {tab === "requests" && <MyLeadsTab />}

            {tab === "stats" && <StatsTab />}

            {tab === "reviews" && <MyReviewsTab />}

            {tab === "team" && <AgencyTeamTab />}

            {tab === "managers" && <AgencyManagersTab />}

            {tab === "telegram" && <AgencyTelegramTab />}

            {tab === "profile" && <ProfileTab />}
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
