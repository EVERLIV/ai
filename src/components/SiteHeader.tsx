import {
  ArrowUpRight,
  Bell,
  BookOpen,
  Briefcase,
  Building2,
  ChevronDown,
  Columns2,
  FileText,
  Heart,
  Info,
  LogOut,
  MessageSquare,
  Newspaper,
  Search,
  Settings2,
  Sparkles,
  User,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AIWizardModal from "@/components/AIWizardModal";
import BrandMark from "@/components/BrandMark";
import { NavMegaItem } from "@/components/CatalogMegaMenu";
import MobileMenuDrawer from "@/components/mobile/MobileMenuDrawer";
import { type PropertySegment } from "@/config/propertySegments";
import { useAuth } from "@/hooks/useAuth";
import { useCompareProperties } from "@/hooks/useCompareProperties";
import { useAllDictionaryValues } from "@/hooks/useDictionaries";
import { formatLeadBadge, useNewLeadsCount } from "@/hooks/useMyLeads";
import { getMainNavMegaMenus } from "@/lib/catalogMegaMenu";
import { placementCtaPath } from "@/lib/listPropertyLinks";
import { cn } from "@/lib/utils";

type SubItem = {
  label: string;
  desc: string;
  href: string;
  icon: React.ElementType;
};

const COMPANY_SUBMENU: SubItem[] = [
  {
    label: "О нас",
    desc: "История, команда и ценности АрендаСити",
    href: "/about",
    icon: Info,
  },
  {
    label: "Новости",
    desc: "Аналитика и события рынка недвижимости",
    href: "/news",
    icon: Newspaper,
  },
  {
    label: "Контакты",
    desc: "Адрес, телефон, режим работы",
    href: "/contacts",
    icon: BookOpen,
  },
  {
    label: "Вакансии",
    desc: "Работа в агентстве недвижимости",
    href: "/vacancies",
    icon: Briefcase,
  },
];

function IconLink({
  to,
  label,
  children,
  onClick,
  badge,
}: {
  to?: string;
  label: string;
  children: React.ReactNode;
  onClick?: () => void;
  badge?: number;
}) {
  const className = cn(
    "relative w-7 h-7 rounded flex items-center justify-center",
    "text-foreground/70 hover:text-foreground hover:bg-muted/70 transition-colors",
  );
  const badgeEl =
    badge && badge > 0 ? (
      <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-4 text-center">
        {badge > 99 ? "99+" : badge}
      </span>
    ) : null;
  if (onClick && !to) {
    return (
      <button type="button" aria-label={label} title={label} onClick={onClick} className={className}>
        {children}
        {badgeEl}
      </button>
    );
  }
  return (
    <Link to={to || "/"} aria-label={label} title={label} className={className}>
      {children}
      {badgeEl}
    </Link>
  );
}

export type SiteHeaderProps = {
  contextSegment?: PropertySegment | null;
  isLandContext?: boolean;
  collapsed?: boolean;
};

export default function SiteHeader({
  contextSegment = null,
  isLandContext = false,
  collapsed = false,
}: SiteHeaderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const { pathname, search } = useLocation();

  const wizardSegment: PropertySegment =
    contextSegment === "residential" ||
    contextSegment === "land" ||
    contextSegment === "commercial"
      ? contextSegment
      : pathname.startsWith("/zhilaya")
        ? "residential"
        : pathname.startsWith("/zemlya") || pathname.startsWith("/land")
          ? "land"
          : "commercial";

  const { user, signOut, hasRole } = useAuth();
  const { count: compareCount } = useCompareProperties();
  const { data: newLeadsCount = 0 } = useNewLeadsCount();
  const { propertyTypes } = useAllDictionaryValues();
  const commercialTypes = useMemo(
    () => propertyTypes("commercial"),
    [propertyTypes],
  );
  const navigate = useNavigate();
  const placeHref = placementCtaPath(wizardSegment, "rent", !!user);
  const megaMenus = useMemo(
    () =>
      getMainNavMegaMenus({
        isLoggedIn: !!user,
        commercialTypes,
      }),
    [user, commercialTypes],
  );
  const authOr = (hash: string) => (user ? `/account#${hash}` : "/auth");
  const compareHref = user ? "/compare" : "/auth?redirect=%2Fcompare";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        accountRef.current &&
        !accountRef.current.contains(e.target as Node)
      ) {
        setAccountOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 8);
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      setScrollPct(docH > 0 ? Math.min(100, (window.scrollY / docH) * 100) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setScrollPct(0);
  }, []);
  useEffect(() => {
    setMobileOpen(false);
  }, []);

  const isCompanyActive =
    pathname === "/about" ||
    pathname.startsWith("/news") ||
    pathname.startsWith("/contacts") ||
    pathname.startsWith("/vacancies");
  const isRealtorsActive =
    pathname.startsWith("/rieltory") ||
    pathname.startsWith("/rieltor") ||
    pathname.startsWith("/agentstvo");
  const isDevelopersActive =
    pathname.startsWith("/zastroyshchiki") ||
    pathname.startsWith("/zastroyshchik") ||
    pathname.startsWith("/proekt") ||
    pathname.startsWith("/zastroyshchikam");

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-out ${
        collapsed ? "-translate-y-full pointer-events-none" : "translate-y-0"
      }`}
      aria-hidden={collapsed}
    >
      <div
        className={cn(
          "transition-all duration-300 border-b border-border/50",
          scrolled
            ? "bg-card/95 backdrop-blur-2xl shadow-[0_1px_0_0_hsl(var(--border)/0.6)]"
            : "bg-card",
        )}
      >
        {/* Ряд 1: логотип + виджеты (как на референсе) */}
        <div className="container mx-auto flex items-center h-14 lg:h-[60px] px-4 lg:px-8 gap-2.5">
          <button
            type="button"
            aria-label="Меню"
            className="lg:hidden w-7 h-7 flex items-center justify-center text-foreground shrink-0 -ml-1"
            onClick={() => setMobileOpen(true)}
          >
            <span className="flex flex-col gap-[4px] w-4">
              <span className="h-px bg-current" />
              <span className="h-px bg-current" />
              <span className="h-px bg-current" />
            </span>
          </button>

          <Link
            to="/"
            className="group flex items-center gap-2 shrink-0 min-w-0"
          >
            <BrandMark className="hidden lg:block h-7 w-7" />
            <span className="flex flex-col leading-none min-w-0">
              <span className="font-display text-[14px] sm:text-[15px] font-bold tracking-tight text-foreground">
                АРЕНДА<span className="text-primary">СИТИ</span>
              </span>
              <span className="text-[9px] font-medium tracking-wide text-muted-foreground mt-0.5 uppercase hidden sm:block">
                Недвижимость
              </span>
            </span>
          </Link>

          <div className="flex-1" />

          {/* Desktop utilities */}
          <div className="hidden md:flex items-center gap-1 lg:gap-1.5">
            <button
              type="button"
              onClick={() => setWizardOpen(true)}
              className="inline-flex items-center gap-1.5 h-7 px-[11px] rounded bg-primary/10 text-primary text-sm font-medium hover:bg-primary/15 transition-colors whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Умный подбор</span>
              <Search className="w-3.5 h-3.5 lg:hidden" />
            </button>

            <IconLink to={compareHref} label="Сравнение" badge={compareCount}>
              <Columns2 className="w-4 h-4" strokeWidth={1.75} />
            </IconLink>
            <IconLink
              to={authOr("requests")}
              label="Сообщения и заявки"
              badge={newLeadsCount}
            >
              <MessageSquare className="w-4 h-4" strokeWidth={1.75} />
            </IconLink>
            <IconLink to={authOr("favorites")} label="Избранное">
              <Heart className="w-4 h-4" strokeWidth={1.75} />
            </IconLink>
            <IconLink
              to={authOr("requests")}
              label="Уведомления"
              badge={newLeadsCount}
            >
              <Bell className="w-4 h-4" strokeWidth={1.75} />
            </IconLink>

            {user &&
              (hasRole("admin") || hasRole("manager") || hasRole("staff")) && (
                <Link
                  to="/tasks"
                  className="hidden xl:inline-flex items-center h-7 px-[11px] rounded text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/70"
                >
                  Задачи
                </Link>
              )}

            <Link
              to={placeHref}
              className="inline-flex items-center h-7 px-[11px] rounded bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              + Разместить за 0 ₽
            </Link>

            {user ? (
              <div ref={accountRef} className="relative">
                <button
                  type="button"
                  onClick={() => setAccountOpen(!accountOpen)}
                  className="flex items-center gap-1.5 h-7 px-2 rounded bg-primary/10 text-primary text-sm font-medium hover:bg-primary/15 transition-colors"
                >
                  <div className="w-5 h-5 rounded bg-primary flex items-center justify-center text-primary-foreground text-[10px] font-bold shrink-0">
                    {(
                      user.user_metadata?.full_name?.[0] ||
                      user.email?.[0] ||
                      "U"
                    ).toUpperCase()}
                  </div>
                  <span className="hidden lg:block truncate max-w-[90px]">
                    {user.user_metadata?.full_name?.split(" ")[0] ||
                      user.email?.split("@")[0]}
                  </span>
                  <ChevronDown
                    className={cn(
                      "w-3.5 h-3.5 shrink-0 transition-transform",
                      accountOpen && "rotate-180",
                    )}
                  />
                </button>
                <div
                  className={cn(
                    "absolute right-0 top-full mt-1.5 w-52 bg-card border border-border rounded-lg shadow-[0_12px_32px_-8px_rgba(0,0,0,0.15)] z-50 overflow-hidden transition-all duration-200 origin-top-right",
                    accountOpen
                      ? "opacity-100 scale-100 translate-y-0"
                      : "opacity-0 scale-95 -translate-y-1 pointer-events-none",
                  )}
                >
                  <div className="px-3 py-2.5 border-b border-border bg-muted/40">
                    <div className="text-[11px] font-semibold text-foreground truncate">
                      {user.user_metadata?.full_name || "Аккаунт"}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {user.email}
                    </div>
                  </div>
                  {[
                    { icon: Columns2, label: "Сравнение", href: "/compare" },
                    { icon: Heart, label: "Избранное", tab: "favorites" },
                    {
                      icon: Building2,
                      label: "Мои объекты",
                      tab: "properties",
                    },
                    { icon: FileText, label: "Мои заявки", tab: "requests" },
                    { icon: User, label: "Профиль", tab: "profile" },
                  ].map((item) => {
                    const Icon = item.icon;
                    return (
                    <button
                      key={"href" in item && item.href ? item.href : item.tab}
                      type="button"
                      onClick={() => {
                        setAccountOpen(false);
                        if ("href" in item && item.href) navigate(item.href);
                        else if ("tab" in item && item.tab)
                          navigate(`/account#${item.tab}`);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors group"
                    >
                      <Icon
                        className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary"
                        strokeWidth={1.75}
                      />
                      {item.label}
                      {"href" in item && item.href === "/compare" && compareCount > 0 && (
                        <span className="ml-auto text-[10px] font-bold text-primary">
                          {compareCount}
                        </span>
                      )}
                      {"tab" in item &&
                        item.tab === "requests" &&
                        newLeadsCount > 0 && (
                          <span className="ml-auto min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-4 text-center">
                            {formatLeadBadge(newLeadsCount)}
                          </span>
                        )}
                    </button>
                  )})}
                  {(hasRole("admin") ||
                    hasRole("manager") ||
                    hasRole("staff")) && (
                    <div className="border-t border-border/50">
                      <button
                        type="button"
                        onClick={() => {
                          setAccountOpen(false);
                          navigate("/tasks");
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-foreground hover:bg-muted"
                      >
                        Задачи
                      </button>
                      {hasRole("admin") && (
                        <button
                          type="button"
                          onClick={() => {
                            setAccountOpen(false);
                            navigate("/dashboard");
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-foreground hover:bg-muted group"
                        >
                          <Settings2
                            className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary"
                            strokeWidth={1.75}
                          />
                          Панель управления
                        </button>
                      )}
                    </div>
                  )}
                  <div className="border-t border-border">
                    <button
                      type="button"
                      onClick={() => {
                        setAccountOpen(false);
                        signOut();
                        navigate("/");
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Выйти
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                to="/auth"
                className="inline-flex items-center gap-1.5 h-7 px-[11px] rounded bg-primary/10 text-primary text-sm font-medium hover:bg-primary/15 transition-colors whitespace-nowrap"
              >
                Войти
              </Link>
            )}
          </div>

          {/* Mobile: place + account */}
          <div className="flex md:hidden items-center gap-1 shrink-0">
            <Link
              to={placeHref}
              className="h-7 px-[11px] rounded flex items-center text-sm font-medium text-primary whitespace-nowrap"
            >
              + Разместить
            </Link>
            <Link
              to={
                user
                  ? newLeadsCount > 0
                    ? "/account#requests"
                    : "/account#profile"
                  : "/auth"
              }
              className="relative w-7 h-7 rounded flex items-center justify-center text-foreground/70 hover:bg-muted"
              aria-label={user ? "Кабинет" : "Войти"}
            >
              <User className="w-4 h-4" strokeWidth={1.75} />
              {user && newLeadsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-4 text-center">
                  {formatLeadBadge(newLeadsCount)}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Ряд 2: каталожное меню */}
        <nav className="hidden lg:flex container mx-auto items-center gap-0.5 px-4 lg:px-8 h-11 border-t border-border/40">
          {megaMenus.map((menu) => (
            <NavMegaItem
              key={menu.id}
              config={menu}
              active={menu.match?.(pathname, search) ?? false}
              onOpenWizard={() => setWizardOpen(true)}
            />
          ))}

          <Link
            to="/rieltory"
            className={cn(
              "relative flex items-center px-2.5 py-1.5 text-sm font-medium transition-colors",
              isRealtorsActive
                ? "text-primary"
                : "text-foreground/75 hover:text-foreground",
            )}
          >
            <span
              className={cn(
                "pointer-events-none absolute bottom-0 left-3 right-3 h-0.5 bg-primary",
                isRealtorsActive ? "opacity-100" : "opacity-0",
              )}
            />
            Риелторы
          </Link>

          <Link
            to="/zastroyshchiki"
            className={cn(
              "relative flex items-center px-2.5 py-1.5 text-sm font-medium transition-colors",
              isDevelopersActive
                ? "text-primary"
                : "text-foreground/75 hover:text-foreground",
            )}
          >
            <span
              className={cn(
                "pointer-events-none absolute bottom-0 left-3 right-3 h-0.5 bg-primary",
                isDevelopersActive ? "opacity-100" : "opacity-0",
              )}
            />
            Застройщики
          </Link>

          <div className="relative group/nav">
            <Link
              to="/about"
              className={cn(
                "relative flex items-center gap-1 px-2.5 py-1.5 text-sm font-medium transition-colors",
                isCompanyActive
                  ? "text-primary"
                  : "text-foreground/75 hover:text-foreground",
              )}
            >
              <span
                className={cn(
                  "pointer-events-none absolute bottom-0 left-3 right-3 h-0.5 bg-primary",
                  isCompanyActive
                    ? "opacity-100"
                    : "opacity-0 group-hover/nav:opacity-60",
                )}
              />
              Ещё
              <ChevronDown className="w-3.5 h-3.5 opacity-50 transition-transform group-hover/nav:rotate-180" />
            </Link>
            <div className="absolute top-full right-0 pt-2 w-80 opacity-0 invisible -translate-y-2 group-hover/nav:opacity-100 group-hover/nav:visible group-hover/nav:translate-y-0 transition-all duration-200 ease-out z-50">
              <div className="bg-card border border-border rounded-lg shadow-card overflow-hidden">
                <div className="py-1">
                  {COMPANY_SUBMENU.map((s) => {
                    const Icon = s.icon;
                    return (
                      <Link
                        key={s.href}
                        to={s.href}
                        className="group/item flex items-center gap-3 px-4 py-3 hover:bg-muted/60 transition-colors relative"
                      >
                        <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-primary scale-y-0 group-hover/item:scale-y-100 transition-transform origin-center" />
                        <Icon
                          className="w-4 h-4 text-muted-foreground group-hover/item:text-primary shrink-0"
                          strokeWidth={1.75}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-foreground group-hover/item:text-primary leading-tight">
                            {s.label}
                          </div>
                          <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                            {s.desc}
                          </div>
                        </div>
                        <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 opacity-0 group-hover/item:opacity-100 group-hover/item:text-primary" />
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </nav>

        <div className="h-0.5 bg-border/40">
          <div
            className="h-full bg-primary transition-[width] duration-100"
            style={{ width: `${scrollPct}%` }}
          />
        </div>
      </div>

      <MobileMenuDrawer
        open={mobileOpen}
        onOpenChange={setMobileOpen}
        isLoggedIn={!!user}
        placeHref={placeHref}
        onOpenWizard={() => {
          setMobileOpen(false);
          setWizardOpen(true);
        }}
      />

      <AIWizardModal
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        segment={wizardSegment}
      />
    </header>
  );
}
