import {
  ArrowUpRight,
  BookOpen,
  Briefcase,
  Building2,
  ChevronDown,
  FileText,
  Heart,
  Info,
  LogOut,
  Mail,
  Newspaper,
  Phone,
  Settings2,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AIWizardModal from "@/components/AIWizardModal";
import BrandMark from "@/components/BrandMark";
import { CatalogMegaMenuDesktop } from "@/components/CatalogMegaMenu";
import MobileMenuDrawer from "@/components/mobile/MobileMenuDrawer";
import { CONTACTS } from "@/config/company";
import {
  type PropertySegment,
  SEGMENT_ROUTES,
} from "@/config/propertySegments";
import { useAuth } from "@/hooks/useAuth";
import { placementCtaPath } from "@/lib/listPropertyLinks";

type SubItem = {
  label: string;
  desc: string;
  href: string;
  icon: React.ElementType;
};
type NavItem = { label: string; href: string; submenu?: SubItem[] };

const NAV_ITEMS: NavItem[] = [
  { label: "Жилая", href: SEGMENT_ROUTES.residential.home },
  { label: "Коммерция", href: SEGMENT_ROUTES.commercial.catalog },
  { label: "Участки", href: "/zhilaya/uchastki" },
  {
    label: "Компания",
    href: "/about",
    submenu: [
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
    ],
  },
];

export type SiteHeaderProps = {
  /** Контекст карточки объекта — не форсит «Коммерческая» по URL */
  contextSegment?: PropertySegment | null;
  /** Участок / земля — нейтральный контекст для CTA */
  isLandContext?: boolean;
  /** Скрыть шапку (например, когда на карточке объекта закреплено меню разделов) */
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
  const { pathname, hash } = useLocation();

  const wizardSegment: PropertySegment =
    contextSegment === "residential" || pathname.startsWith("/zhilaya")
      ? "residential"
      : "commercial";

  const { user, signOut, hasRole } = useAuth();
  const navigate = useNavigate();
  const placeHref = placementCtaPath(wizardSegment, "rent", !!user);

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

  const isActive = (href: string) => {
    if (href.startsWith("/#"))
      return pathname === "/" && hash === href.slice(1);
    if (href === "/") return pathname === "/";
    // На карточке объекта не подсвечиваем «Коммерция» только из-за /property
    if (pathname.startsWith("/property/") && contextSegment) {
      if (href === SEGMENT_ROUTES.residential.home) {
        return contextSegment === "residential" && !isLandContext;
      }
      if (href === "/zhilaya/uchastki") return !!isLandContext;
      if (href === SEGMENT_ROUTES.commercial.catalog) {
        return contextSegment === "commercial" && !isLandContext;
      }
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-out ${
        collapsed ? "-translate-y-full pointer-events-none" : "translate-y-0"
      }`}
      aria-hidden={collapsed}
    >
      <div className="hidden md:block bg-background border-b border-border/50">
        <div className="container mx-auto px-4 lg:px-8 h-10 flex items-center justify-between gap-4 text-[12px]">
          <div className="hidden md:flex items-center gap-4 text-muted-foreground">
            <a
              href={`tel:${CONTACTS.phoneTel}`}
              className="flex items-center gap-1.5 hover:text-foreground transition-colors duration-200"
            >
              <Phone className="w-3.5 h-3.5 text-primary" />
              <span className="font-medium">{CONTACTS.phone}</span>
            </a>
            <a
              href={`mailto:${CONTACTS.email}`}
              className="hidden lg:flex items-center gap-1.5 hover:text-foreground transition-colors duration-200"
            >
              <Mail className="w-3.5 h-3.5 text-primary" />
              {CONTACTS.email}
            </a>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Link
              to={placeHref}
              className="hidden sm:flex items-center h-7 px-3 rounded-md bg-primary text-primary-foreground text-[11px] font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              + Разместить за 0 ₽
            </Link>
            {user &&
              (hasRole("admin") || hasRole("manager") || hasRole("staff")) && (
                <Link
                  to="/tasks"
                  className="hidden sm:flex items-center gap-1.5 h-7 px-3 rounded-md border border-border text-[11px] font-semibold text-foreground hover:bg-muted transition-colors whitespace-nowrap"
                >
                  ✓ Задачи
                </Link>
              )}
            {user ? (
              <div ref={accountRef} className="relative">
                <button
                  type="button"
                  onClick={() => setAccountOpen(!accountOpen)}
                  className="flex items-center gap-1.5 h-7 px-2 rounded-md border border-border text-[11px] font-medium text-foreground hover:bg-muted transition-colors duration-200"
                >
                  <div className="w-5 h-5 rounded-sm bg-primary flex items-center justify-center text-primary-foreground text-[9px] font-bold shrink-0">
                    {(
                      user.user_metadata?.full_name?.[0] ||
                      user.email?.[0] ||
                      "U"
                    ).toUpperCase()}
                  </div>
                  <span className="hidden lg:block truncate max-w-[100px]">
                    {user.user_metadata?.full_name?.split(" ")[0] ||
                      user.email?.split("@")[0]}
                  </span>
                  <ChevronDown
                    className={`w-3 h-3 shrink-0 transition-transform duration-200 ${accountOpen ? "rotate-180" : ""}`}
                  />
                </button>
                <div
                  className={`absolute right-0 top-full mt-1 w-52 bg-card border border-border shadow-[0_12px_32px_-8px_rgba(0,0,0,0.15)] z-50 overflow-hidden transition-all duration-200 origin-top-right ${accountOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-1 pointer-events-none"}`}
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
                    { icon: Heart, label: "Избранное", tab: "favorites" },
                    {
                      icon: Building2,
                      label: "Мои объекты",
                      tab: "properties",
                    },
                    { icon: FileText, label: "Мои заявки", tab: "requests" },
                    { icon: User, label: "Мои данные", tab: "profile" },
                  ].map(({ icon: Icon, label, tab }) => (
                    <button
                      key={tab}
                      onClick={() => {
                        setAccountOpen(false);
                        navigate(`/account#${tab}`);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-foreground hover:bg-muted transition-all duration-150 group"
                    >
                      <Icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" strokeWidth={1.75} />{" "}
                      {label}
                    </button>
                  ))}
                  {(hasRole("admin") ||
                    hasRole("manager") ||
                    hasRole("staff")) && (
                    <div className="border-t border-border/50">
                      <button
                        onClick={() => {
                          setAccountOpen(false);
                          navigate("/tasks");
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-foreground hover:bg-muted transition-all duration-150 group"
                      >
                        <span className="w-3.5 h-3.5 text-center text-muted-foreground group-hover:text-primary transition-colors">
                          ✓
                        </span>
                        Задачи
                      </button>
                      {hasRole("admin") && (
                        <button
                          onClick={() => {
                            setAccountOpen(false);
                            navigate("/dashboard");
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-foreground hover:bg-muted transition-all duration-150 group"
                        >
                          <Settings2 className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" strokeWidth={1.75} />
                          Панель управления
                        </button>
                      )}
                    </div>
                  )}
                  <div className="border-t border-border">
                    <button
                      onClick={() => {
                        setAccountOpen(false);
                        signOut();
                        navigate("/");
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all duration-150"
                    >
                      <LogOut className="w-3.5 h-3.5" /> Выйти
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                to="/auth"
                className="flex items-center gap-1.5 h-7 px-3 border border-border text-[11px] font-medium text-foreground hover:bg-muted transition-colors duration-200 whitespace-nowrap"
              >
                <User className="w-3 h-3" /> Войти
              </Link>
            )}
          </div>
        </div>
      </div>

      <div
        className={`transition-all duration-300 ${scrolled ? "bg-card/95 backdrop-blur-2xl shadow-[0_1px_0_0_hsl(var(--border)/0.6)]" : "bg-card"}`}
      >
        <div className="container mx-auto flex items-center h-14 px-4 lg:px-8 gap-2">
          <button
            type="button"
            aria-label="Меню"
            className="lg:hidden w-9 h-9 flex items-center justify-center text-foreground shrink-0 -ml-1"
            onClick={() => setMobileOpen(true)}
          >
            <span className="flex flex-col gap-[5px] w-5">
              <span className="h-px bg-current" />
              <span className="h-px bg-current" />
              <span className="h-px bg-current" />
            </span>
          </button>

          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 lg:flex-initial">
            <Link
              to="/"
              className="group flex items-center gap-2.5 shrink-0 min-w-0"
            >
              <div className="relative w-9 h-9 lg:w-10 lg:h-10 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 shrink-0">
                <BrandMark className="w-9 h-9 lg:w-10 lg:h-10" />
              </div>
              <span className="flex flex-col leading-none min-w-0">
                <span className="font-display text-[14px] sm:text-[16px] font-bold tracking-tight text-foreground">
                  АРЕНДА<span className="text-primary">СИТИ</span>
                </span>
                <span className="text-[9px] font-medium tracking-wide text-muted-foreground mt-0.5 uppercase hidden sm:block">
                  Недвижимость в Иркутске
                </span>
              </span>
            </Link>
          </div>

          <Link
            to={placeHref}
            className="lg:hidden shrink-0 h-8 px-2.5 rounded-md flex items-center text-xs font-semibold text-primary whitespace-nowrap"
          >
            + Разместить
          </Link>

          <nav className="hidden lg:flex items-center gap-1 ml-auto">
            {NAV_ITEMS.map((item, idx) => {
              const active = isActive(item.href);
              const hasMenu = !!item.submenu?.length;
              const isLast = idx === NAV_ITEMS.length - 1;
              return (
                <div key={item.label} className="relative group/nav">
                  <Link
                    to={item.href}
                    className={`relative flex items-center gap-1 px-3.5 py-2 text-sm font-medium transition-colors duration-200 ${
                      active
                        ? "text-primary"
                        : "text-foreground/70 hover:text-foreground"
                    }`}
                  >
                    <span
                      className={`absolute bottom-0 left-3.5 right-3.5 h-0.5 bg-primary transition-all duration-300 ${active ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0 group-hover/nav:opacity-60 group-hover/nav:scale-x-100"}`}
                    />
                    {item.label}
                    {hasMenu && (
                      <ChevronDown className="w-3.5 h-3.5 transition-transform duration-300 group-hover/nav:rotate-180 opacity-50" />
                    )}
                  </Link>

                  {hasMenu && (
                    <div
                      className={`absolute top-full pt-2 w-80 opacity-0 invisible -translate-y-2 group-hover/nav:opacity-100 group-hover/nav:visible group-hover/nav:translate-y-0 transition-all duration-200 ease-out z-50 ${isLast ? "right-0" : "left-0"}`}
                    >
                      <div className="bg-card border border-border rounded-md shadow-card overflow-hidden">
                        <div className="py-1">
                          {item.submenu?.map((s, subIdx) => {
                            const Icon = s.icon;
                            return (
                              <Link
                                key={s.href}
                                to={s.href}
                                className="group/item flex items-center gap-3 px-4 py-3 hover:bg-muted/60 transition-colors duration-150 relative"
                                style={{ transitionDelay: `${subIdx * 15}ms` }}
                              >
                                <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-primary scale-y-0 group-hover/item:scale-y-100 transition-transform duration-200 origin-center" />
                                <Icon
                                  className="w-4 h-4 text-muted-foreground group-hover/item:text-primary transition-colors duration-150 shrink-0"
                                  strokeWidth={1.75}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-foreground group-hover/item:text-primary transition-colors duration-150 leading-tight">
                                    {s.label}
                                  </div>
                                  <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">
                                    {s.desc}
                                  </div>
                                </div>
                                <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0 opacity-0 group-hover/item:opacity-100 group-hover/item:text-primary transition-all duration-150" />
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            <CatalogMegaMenuDesktop
              isActive={
                pathname.startsWith("/catalog") ||
                pathname.startsWith("/zhilaya/catalog")
              }
              isLoggedIn={!!user}
              onOpenWizard={() => setWizardOpen(true)}
            />
          </nav>
        </div>

        <div className="h-1 bg-border/40">
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
