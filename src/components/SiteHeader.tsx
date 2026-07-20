import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Phone, Mail, MapPin,
  Send, MessageCircle, Instagram, ChevronDown, Sparkles, User,
  Heart, FileText, LogOut, LayoutGrid, Settings, Building2,
  ArrowUpRight, Newspaper, Info, BookOpen, Settings2, Shield,
} from "lucide-react";
import AIWizardModal from "@/components/AIWizardModal";
import { useAuth } from "@/hooks/useAuth";

type SubItem = { label: string; desc: string; href: string; icon: React.ElementType };
type NavItem = { label: string; href: string; submenu?: SubItem[] };

const navItems: NavItem[] = [
  { label: "Офисы", href: "/offices" },
  { label: "Торговля", href: "/retail" },
  { label: "Склады", href: "/warehouses" },
  {
    label: "Каталог",
    href: "/catalog",
    submenu: [
      { label: "Все объекты", desc: "Полный каталог коммерческой недвижимости", href: "/catalog", icon: LayoutGrid },
      { label: "Передать в управление", desc: "Полный цикл: арендаторы, договоры, платежи", href: "/list-property?mode=management", icon: Settings },
      { label: "Сдать через АрендаСити", desc: "Размещение объекта и поток заявок", href: "/list-property?mode=rent", icon: Building2 },
    ],
  },
  { label: "Реклама", href: "/ads" },
  {
    label: "Компания",
    href: "/about",
    submenu: [
      { label: "О нас", desc: "История, команда и ценности АрендаСити", href: "/about", icon: Info },
      { label: "Новости", desc: "Аналитика и события рынка недвижимости", href: "/news", icon: Newspaper },
      { label: "Контакты", desc: "Адрес, телефон, режим работы", href: "/contacts", icon: BookOpen },
    ],
  },
];

const socials = [
  { Icon: Send, href: "https://t.me/arendacity", label: "Telegram" },
  { Icon: MessageCircle, href: "https://wa.me/73952551234", label: "WhatsApp" },
  { Icon: Instagram, href: "https://instagram.com/arendacity", label: "Instagram" },
];

export default function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const { pathname, hash } = useLocation();
  const { user, signOut, hasRole } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
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

  useEffect(() => { setScrollPct(0); }, [pathname]);
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const isActive = (href: string) => {
    if (href.startsWith("/#")) return pathname === "/" && hash === href.slice(1);
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">

      {/* ── TOP BAR ─────────────────────── */}
      <div className="hidden md:block bg-background border-b border-border/50">
        <div className="container mx-auto px-4 lg:px-8 h-10 flex items-center justify-between gap-4 text-[12px]">
          <div className="hidden md:flex items-center gap-4 text-muted-foreground">
            <a href="tel:+73952551234" className="flex items-center gap-1.5 hover:text-foreground transition-colors duration-200">
              <Phone className="w-3.5 h-3.5 text-primary" />
              <span className="font-medium">+7 (3952) 55-12-34</span>
            </a>
            <a href="mailto:info@arendacity.ru" className="hidden lg:flex items-center gap-1.5 hover:text-foreground transition-colors duration-200">
              <Mail className="w-3.5 h-3.5 text-primary" />
              info@arendacity.ru
            </a>
            <span className="hidden lg:flex items-center gap-1.5 text-muted-foreground/50">
              <MapPin className="w-3.5 h-3.5" />
              Иркутск · Ангарск · Шелехов
            </span>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <div className="hidden md:flex items-center gap-0.5 mr-1">
              {socials.map(({ Icon, href, label }) => (
                <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}
                  className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted rounded transition-all duration-200">
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
            <button onClick={() => setWizardOpen(true)}
              className="hidden xl:flex items-center gap-1.5 h-7 px-3 border border-primary/40 text-primary text-[11px] font-semibold hover:bg-primary hover:text-primary-foreground transition-all duration-200 whitespace-nowrap">
              <Sparkles className="w-3 h-3" /> ИИ-подбор
            </button>
            <Link to="/list-property"
              className="hidden sm:flex items-center h-7 px-3 bg-primary text-primary-foreground text-[11px] font-semibold hover:opacity-90 transition-opacity whitespace-nowrap">
              + Разместить за 0 ₽
            </Link>
            {user && (hasRole("admin") || hasRole("manager") || hasRole("staff")) && (
              <Link to="/tasks"
                className="hidden sm:flex items-center gap-1.5 h-7 px-3 border border-border text-[11px] font-semibold text-foreground hover:bg-muted transition-colors whitespace-nowrap">
                ✓ Задачи
              </Link>
            )}
            {user ? (
              <div ref={accountRef} className="relative">
                <button onClick={() => setAccountOpen(!accountOpen)}
                  className="flex items-center gap-1.5 h-7 px-2 border border-border text-[11px] font-medium text-foreground hover:bg-muted transition-colors duration-200">
                  <div className="w-5 h-5 bg-primary flex items-center justify-center text-primary-foreground text-[9px] font-bold shrink-0">
                    {(user.user_metadata?.full_name?.[0] || user.email?.[0] || "U").toUpperCase()}
                  </div>
                  <span className="hidden lg:block truncate max-w-[100px]">{user.user_metadata?.full_name?.split(" ")[0] || user.email?.split("@")[0]}</span>
                  <ChevronDown className={`w-3 h-3 shrink-0 transition-transform duration-200 ${accountOpen ? "rotate-180" : ""}`} />
                </button>
                <div className={`absolute right-0 top-full mt-1 w-52 bg-card border border-border shadow-[0_12px_32px_-8px_rgba(0,0,0,0.15)] z-50 overflow-hidden transition-all duration-200 origin-top-right ${accountOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-1 pointer-events-none"}`}>
                  <div className="px-3 py-2.5 border-b border-border bg-muted/40">
                    <div className="text-[11px] font-semibold text-foreground truncate">{user.user_metadata?.full_name || "Аккаунт"}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{user.email}</div>
                  </div>
                  {[
                    { icon: Heart, label: "Избранное", tab: "favorites" },
                    { icon: Building2, label: "Мои объекты", tab: "properties" },
                    { icon: FileText, label: "Мои заявки", tab: "requests" },
                    { icon: User, label: "Мои данные", tab: "profile" },
                  ].map(({ icon: Icon, label, tab }) => (
                    <button key={tab} onClick={() => { setAccountOpen(false); navigate(`/account#${tab}`); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-foreground hover:bg-muted hover:text-primary transition-all duration-150 group">
                      <Icon className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" /> {label}
                    </button>
                  ))}
                  {(hasRole("admin") || hasRole("manager") || hasRole("staff")) && (
                    <div className="border-t border-border/50">
                      <button onClick={() => { setAccountOpen(false); navigate("/tasks"); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-foreground hover:bg-muted hover:text-primary transition-all duration-150 group">
                        <span className="w-3.5 h-3.5 text-center text-muted-foreground group-hover:text-primary transition-colors">✓</span>
                        Задачи
                      </button>
                      {hasRole("admin") && (
                        <button onClick={() => { setAccountOpen(false); navigate("/dashboard"); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-foreground hover:bg-muted hover:text-primary transition-all duration-150 group">
                          <Settings2 className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                          Панель управления
                        </button>
                      )}
                    </div>
                  )}
                  <div className="border-t border-border">
                    <button onClick={() => { setAccountOpen(false); signOut(); navigate("/"); }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all duration-150">
                      <LogOut className="w-3.5 h-3.5" /> Выйти
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link to="/auth"
                className="flex items-center gap-1.5 h-7 px-3 border border-border text-[11px] font-medium text-foreground hover:bg-muted transition-colors duration-200 whitespace-nowrap">
                <User className="w-3 h-3" /> Войти
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── MAIN NAV BAR ─────────────────────────────── */}
      <div className={`transition-all duration-300 ${scrolled ? "bg-card/95 backdrop-blur-2xl shadow-[0_1px_0_0_hsl(var(--border)/0.6)]" : "bg-card"}`}>
        <div className="container mx-auto flex items-center justify-between h-14 px-4 lg:px-8">

          {/* Logo */}
          <Link to="/" className="group flex items-center gap-2.5 shrink-0">
            <div className="relative w-8 h-8 bg-primary flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
              <span className="text-primary-foreground font-bold text-sm tracking-tight">А</span>
            </div>
            <span className="flex flex-col leading-none">
              <span className="font-sans text-[16px] font-bold tracking-tight text-foreground">
                АРЕНДА<span className="text-primary">СИТИ</span>
              </span>
              <span className="text-[9px] font-medium tracking-wide text-muted-foreground mt-0.5 uppercase hidden sm:block">
                Коммерческая недвижимость
              </span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center">
            {navItems.map((item, idx) => {
              const active = isActive(item.href);
              const hasMenu = !!item.submenu?.length;
              const isLast = idx === navItems.length - 1;
              return (
                <div key={item.label} className="relative group/nav">
                  <Link
                    to={item.href}
                    className={`relative flex items-center gap-1 px-3.5 py-2 text-sm font-medium transition-colors duration-200 ${
                      active ? "text-primary" : "text-foreground/70 hover:text-foreground"
                    }`}
                  >
                    {/* Active underline */}
                    <span className={`absolute bottom-0 left-3.5 right-3.5 h-0.5 bg-primary transition-all duration-300 ${active ? "opacity-100 scale-x-100" : "opacity-0 scale-x-0 group-hover/nav:opacity-60 group-hover/nav:scale-x-100"}`} />
                    {item.label}
                    {hasMenu && (
                      <ChevronDown className="w-3.5 h-3.5 transition-transform duration-300 group-hover/nav:rotate-180 opacity-50" />
                    )}
                  </Link>

                  {hasMenu && (
                    <div className={`absolute top-full pt-2 w-80 opacity-0 invisible -translate-y-2 group-hover/nav:opacity-100 group-hover/nav:visible group-hover/nav:translate-y-0 transition-all duration-200 ease-out z-50 ${isLast ? "right-0" : "left-0"}`}>
                      <div className="bg-card border-0 shadow-[0_8px_30px_rgba(0,0,0,0.10)] overflow-hidden">
                        <div className="py-1">
                          {item.submenu!.map((s, idx) => {
                            const Icon = s.icon;
                            return (
                              <Link
                                key={s.href}
                                to={s.href}
                                className="group/item flex items-center gap-3 px-4 py-3 hover:bg-muted/60 transition-colors duration-150 relative"
                                style={{ transitionDelay: `${idx * 15}ms` }}
                              >
                                {/* Left accent line */}
                                <div className="absolute left-0 top-2 bottom-2 w-0.5 bg-primary scale-y-0 group-hover/item:scale-y-100 transition-transform duration-200 origin-center" />
                                {/* Icon — no box */}
                                <Icon className="w-4 h-4 text-muted-foreground group-hover/item:text-primary transition-colors duration-150 shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-foreground group-hover/item:text-primary transition-colors duration-150 leading-tight">{s.label}</div>
                                  <div className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{s.desc}</div>
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
          </nav>

          {/* Mobile toggle */}
          <button
            aria-label="Меню"
            className="lg:hidden w-9 h-9 flex items-center justify-center text-foreground"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <span className="flex flex-col gap-[5px] w-5">
              <span className={`h-px bg-current transition-all duration-300 origin-center ${mobileOpen ? "rotate-45 translate-y-[6px]" : ""}`} />
              <span className={`h-px bg-current transition-all duration-200 ${mobileOpen ? "opacity-0 scale-x-0" : ""}`} />
              <span className={`h-px bg-current transition-all duration-300 origin-center ${mobileOpen ? "-rotate-45 -translate-y-[6px]" : ""}`} />
            </span>
          </button>
        </div>

        {/* Scroll progress */}
        <div className="h-px bg-border/20">
          <div className="h-full bg-primary/40 transition-[width] duration-100" style={{ width: `${scrollPct}%` }} />
        </div>
      </div>

      {/* ── MOBILE NAV ───────────────────────────────── */}
      <div
        className={`lg:hidden overflow-hidden transition-[max-height,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          mobileOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"
        }`}
        style={{ background: "hsl(var(--card))", boxShadow: mobileOpen ? "0 8px 32px -8px rgba(0,0,0,0.12)" : "none" }}
      >
        <div className="px-4 pt-2 pb-4">
          <div className="space-y-px">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const hasMenu = !!item.submenu?.length;
              const expanded = mobileExpanded === item.label;
              return (
                <div key={item.label}>
                  <div className="flex items-center">
                    <Link
                      to={item.href}
                      onClick={() => !hasMenu && setMobileOpen(false)}
                      className={`flex-1 flex items-center py-2.5 px-2 text-sm transition-colors duration-150 ${
                        active ? "text-primary font-medium" : "text-foreground/80 hover:text-foreground"
                      }`}
                    >
                      <span>{item.label}</span>
                    </Link>
                    {hasMenu && (
                      <button
                        onClick={() => setMobileExpanded(expanded ? null : item.label)}
                        className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${expanded ? "rotate-180" : ""}`} />
                      </button>
                    )}
                    {active && !hasMenu && <span className="w-1 h-1 bg-primary mr-2" />}
                  </div>
                  {/* Submenu */}
                  {hasMenu && (
                    <div className={`overflow-hidden transition-[max-height,opacity] duration-200 ${expanded ? "max-h-64 opacity-100" : "max-h-0 opacity-0"}`}>
                      <div className="pl-4 pb-1 space-y-px ml-2 mt-0.5">
                        {item.submenu!.map((s) => {
                          const Icon = s.icon;
                          return (
                            <Link key={s.href} to={s.href}
                              onClick={() => setMobileOpen(false)}
                              className="flex items-center gap-2.5 py-2 px-2 text-xs text-muted-foreground hover:text-primary transition-colors duration-150 group">
                              <Icon className="w-3.5 h-3.5 shrink-0 group-hover:text-primary transition-colors" />
                              <span>{s.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="my-3 h-px bg-border/50" />

          <div className="flex gap-2">
            <Link to="/list-property" onClick={() => setMobileOpen(false)}
              className="flex-1 flex items-center justify-center h-9 bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity">
              Разместить объект
            </Link>
            {user ? (
              <Link to="/account" onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-1.5 h-9 px-4 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                <User className="w-3.5 h-3.5" /> Кабинет
              </Link>
            ) : (
              <Link to="/auth" onClick={() => setMobileOpen(false)}
                className="flex items-center justify-center gap-1.5 h-9 px-4 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                <User className="w-3.5 h-3.5" /> Войти
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3 mt-3">
            {socials.map(({ Icon, href, label }) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}
                className="text-muted-foreground hover:text-foreground transition-colors">
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
      </div>

      <AIWizardModal open={wizardOpen} onClose={() => setWizardOpen(false)} />
    </header>
  );
}
