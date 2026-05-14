import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Phone, Mail, MapPin,
  Send, MessageCircle, Instagram, ArrowRight, ChevronDown, Sparkles, User,
} from "lucide-react";

const navItems: { label: string; href: string; submenu?: { label: string; desc: string; href: string }[] }[] = [
  { label: "Офисы", href: "/offices" },
  { label: "Торговля", href: "/retail" },
  { label: "Склады", href: "/warehouses" },
  {
    label: "Каталог",
    href: "/catalog",
    submenu: [
      { label: "Все объекты", desc: "Полный каталог коммерческой недвижимости", href: "/catalog" },
      { label: "Передать в управление", desc: "Полный цикл: арендаторы, договоры, платежи", href: "/list-property?mode=management" },
      { label: "Сдать через АрендаСити", desc: "Размещение объекта и поток заявок", href: "/list-property?mode=rent" },
    ],
  },
  { label: "Реклама", href: "/ads" },
  { label: "О нас", href: "/about" },
  { label: "Новости", href: "/news" },
  { label: "Контакты", href: "/#contacts" },
];

const socials = [
  { Icon: Send, href: "https://t.me/arendacity", label: "Telegram" },
  { Icon: MessageCircle, href: "https://wa.me/73952551234", label: "WhatsApp" },
  { Icon: Instagram, href: "https://instagram.com/arendacity", label: "Instagram" },
];

export default function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);
  const { pathname, hash } = useLocation();

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

  // reset scroll indicator on route change
  useEffect(() => { setScrollPct(0); }, [pathname]);

  const isActive = (href: string) => {
    if (href.startsWith("/#")) return pathname === "/" && hash === href.slice(1);
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">

      {/* ── TOP BAR (Avito-style) ─────────────────────── */}
      <div className="bg-background border-b border-border/50">
        <div className="container mx-auto px-4 lg:px-8 h-10 flex items-center justify-between gap-4 text-[12px]">

          {/* Left: contacts */}
          <div className="hidden md:flex items-center gap-4 text-muted-foreground">
            <a href="tel:+73952551234" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
              <Phone className="w-3.5 h-3.5 text-primary" />
              <span className="font-medium">+7 (3952) 55-12-34</span>
            </a>
            <a href="mailto:info@arendacity.ru" className="hidden lg:flex items-center gap-1.5 hover:text-foreground transition-colors">
              <Mail className="w-3.5 h-3.5 text-primary" />
              info@arendacity.ru
            </a>
            <span className="hidden lg:flex items-center gap-1.5 text-muted-foreground/60">
              <MapPin className="w-3.5 h-3.5" />
              Иркутск · Ангарск · Шелехов
            </span>
          </div>

          {/* Right: socials + CTA + auth */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Socials */}
            <div className="hidden md:flex items-center gap-1 mr-1">
              {socials.map(({ Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
                >
                  <Icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>

            {/* Разместить объект */}
            <Link
              to="/list-property"
              className="flex items-center h-7 px-3 bg-primary text-primary-foreground text-[11px] font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
            >
              + Разместить за 0 ₽
            </Link>

            {/* Войти */}
            <Link
              to="/auth"
              className="flex items-center gap-1.5 h-7 px-3 border border-border text-[11px] font-medium text-foreground hover:bg-muted transition-colors whitespace-nowrap"
            >
              <User className="w-3 h-3" />
              Войти
            </Link>
          </div>
        </div>
      </div>

      {/* ── MAIN NAV BAR ─────────────────────────────── */}
      <div
        className={`transition-all duration-500 ease-out ${
          scrolled
            ? "bg-card/95 backdrop-blur-2xl shadow-[0_1px_0_0_hsl(var(--border)/0.6)]"
            : "bg-card"
        }`}
      >
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
          <nav className="hidden lg:flex items-center gap-0.5">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const hasMenu = !!item.submenu?.length;
              return (
                <div key={item.label} className="relative group">
                  <Link
                    to={item.href}
                    className={`flex items-center gap-1 px-3 py-2 text-sm transition-colors duration-200 ${
                      active ? "text-foreground font-medium" : "text-muted-foreground font-normal hover:text-foreground"
                    }`}
                  >
                    {item.label}
                    {hasMenu && <ChevronDown className="w-3 h-3 transition-transform duration-200 group-hover:rotate-180 opacity-50" />}
                  </Link>

                  {hasMenu && (
                    <div className="absolute left-0 top-full pt-1.5 w-72 opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-200 z-50">
                      <div className="bg-card shadow-[0_16px_40px_-12px_hsl(0_0%_0%/0.18)] border border-border p-1.5">
                        {item.submenu!.map((s) => (
                          <Link
                            key={s.href}
                            to={s.href}
                            className="flex items-center justify-between gap-2 p-3 hover:bg-muted transition-colors group/sub"
                          >
                            <div>
                              <div className="text-sm font-semibold text-foreground">{s.label}</div>
                              <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{s.desc}</div>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform group-hover/sub:translate-x-0.5 group-hover/sub:text-primary" />
                          </Link>
                        ))}
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

      </div>

      {/* ── MOBILE NAV ───────────────────────────────── */}
      <div
        className={`lg:hidden overflow-hidden transition-[max-height,opacity] duration-400 ease-[cubic-bezier(0.4,0,0.2,1)] ${
          mobileOpen ? "max-h-[520px] opacity-100" : "max-h-0 opacity-0"
        }`}
        style={{ background: "hsl(var(--card))", boxShadow: mobileOpen ? "0 8px 32px -8px rgba(0,0,0,0.12)" : "none" }}
      >
        <div className="px-4 pt-2 pb-4">
          {/* Nav links */}
          <div className="space-y-px">
            {navItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center justify-between py-2.5 px-2 text-sm transition-colors duration-150 ${
                    active ? "text-primary font-medium" : "text-foreground/80 hover:text-foreground"
                  }`}
                >
                  <span>{item.label}</span>
                  {active && <span className="w-1 h-1 bg-primary" />}
                </Link>
              );
            })}
          </div>

          {/* Divider */}
          <div className="my-3 h-px bg-border/50" />

          {/* CTA row */}
          <div className="flex gap-2">
            <Link
              to="/list-property"
              onClick={() => setMobileOpen(false)}
              className="flex-1 flex items-center justify-center h-9 bg-foreground text-background text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              Разместить объект
            </Link>
            <Link
              to="/auth"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-1.5 h-9 px-4 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <User className="w-3.5 h-3.5" /> Войти
            </Link>
          </div>

          {/* Socials */}
          <div className="flex items-center gap-3 mt-3">
            {socials.map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}
