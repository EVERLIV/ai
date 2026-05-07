import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Search, Menu, X, Phone, Mail, MapPin,
  Send, MessageCircle, Instagram, ArrowRight, ChevronDown, Sparkles,
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
  { label: "О нас", href: "/#about" },
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
  const { pathname, hash } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) => {
    if (href.startsWith("/#")) return pathname === "/" && hash === href.slice(1);
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      {/* Top bar — hides on scroll */}
      <div
        className={`bg-foreground text-background/85 overflow-hidden transition-all duration-500 ease-out ${
          scrolled ? "max-h-0 opacity-0" : "max-h-12 opacity-100"
        }`}
      >
        <div className="container mx-auto px-4 lg:px-8 h-9 flex items-center justify-between text-[11px]">
          <div className="hidden md:flex items-center gap-5">
            <a href="tel:+73952551234" className="group flex items-center gap-1.5 hover:text-background transition-colors">
              <Phone className="w-3 h-3 text-primary" />
              <span className="font-medium tracking-wide">+7 (3952) 55-12-34</span>
            </a>
            <a href="mailto:info@arendacity.com" className="hidden lg:flex items-center gap-1.5 hover:text-background transition-colors">
              <Mail className="w-3 h-3 text-primary" />
              info@arendacity.com
            </a>
            <span className="hidden lg:flex items-center gap-1.5 text-background/60">
              <MapPin className="w-3 h-3" />
              Иркутск · Ангарск · Шелехов
            </span>
          </div>

          <div className="flex items-center gap-1 md:ml-auto">
            <span className="hidden md:inline text-background/50 mr-2">Мы в соцсетях:</span>
            {socials.map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="group w-7 h-7 flex items-center justify-center rounded-full hover:bg-primary transition-all duration-300"
              >
                <Icon className="w-3.5 h-3.5 transition-transform duration-300 group-hover:scale-110" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Main bar */}
      <div
        className={`transition-all duration-500 ease-out border-b ${
          scrolled
            ? "bg-card/90 backdrop-blur-2xl border-border shadow-[0_4px_24px_-12px_hsl(0_0%_0%/0.12)]"
            : "bg-card/70 backdrop-blur-xl border-transparent"
        }`}
      >
        <div className="container mx-auto flex items-center justify-between h-16 px-4 lg:px-8">
          {/* Logo */}
          <Link to="/" className="group flex items-center gap-2.5 shrink-0">
            <div className="relative w-9 h-9 rounded-lg bg-primary flex items-center justify-center overflow-hidden transition-transform duration-300 group-hover:scale-105">
              <span className="text-primary-foreground font-bold text-base tracking-tight relative z-10">А</span>
              <span className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <span className="flex flex-col leading-none">
              <span className="font-sans text-[17px] font-bold tracking-tight text-foreground">
                АРЕНДА<span className="text-primary">СИТИ</span>
              </span>
              <span className="text-[10px] font-medium tracking-wide text-muted-foreground mt-0.5 uppercase">
                Коммерческая недвижимость и реклама
              </span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const active = isActive(item.href);
              const hasMenu = !!item.submenu?.length;
              return (
                <div key={item.label} className="relative group">
                  <Link
                    to={item.href}
                    className={`relative flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-300 ${
                      active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {item.label}
                    {hasMenu && <ChevronDown className="w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-180" />}
                    <span
                      className={`absolute left-3 right-3 -bottom-0.5 h-0.5 bg-primary rounded-full origin-left transition-transform duration-300 ${
                        active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
                      }`}
                    />
                  </Link>

                  {hasMenu && (
                    <div className="absolute left-0 top-full pt-2 w-80 opacity-0 invisible translate-y-1 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 transition-all duration-300 z-50">
                      <div className="bg-card rounded-xl shadow-[0_20px_50px_-20px_hsl(0_0%_0%/0.25)] border border-border p-2">
                        {item.submenu!.map((s) => (
                          <Link
                            key={s.href}
                            to={s.href}
                            className="block p-3 rounded-lg hover:bg-muted transition-colors group/sub"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="text-sm font-semibold text-foreground">{s.label}</div>
                              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground transition-transform group-hover/sub:translate-x-0.5 group-hover/sub:text-primary" />
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{s.desc}</div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          {/* CTA */}
          <div className="hidden lg:flex items-center gap-2">
            <Link
              to="/catalog"
              aria-label="Поиск"
              className="w-9 h-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-all duration-300"
            >
              <Search className="w-4 h-4" />
            </Link>
            <a
              href="tel:+73952551234"
              className="flex items-center gap-1.5 px-3 h-9 rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-all duration-300"
            >
              <Phone className="w-3.5 h-3.5 text-primary" />
              Позвонить
            </a>
            <Link
              to="/list-property"
              className="group relative flex items-center gap-1.5 h-9 px-4 rounded-lg text-sm font-semibold text-gold-dark border-2 border-gold/70 bg-gold/5 hover:bg-gold hover:text-primary-foreground hover:border-gold transition-all duration-300 hover:shadow-[0_8px_24px_-8px_hsl(var(--gold)/0.55)]"
            >
              <Sparkles className="w-3.5 h-3.5 transition-transform duration-300 group-hover:rotate-12" />
              Разместить объект
            </Link>
            <Link
              to="/auth"
              className="group flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold shadow-[0_4px_14px_-4px_hsl(var(--primary)/0.5)] hover:shadow-[0_8px_22px_-4px_hsl(var(--primary)/0.55)] hover:-translate-y-0.5 transition-all duration-300"
            >
              Войти
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            aria-label="Меню"
            className="lg:hidden w-10 h-10 flex items-center justify-center rounded-lg text-foreground hover:bg-muted transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <span className="relative w-5 h-5">
              <Menu className={`w-5 h-5 absolute inset-0 transition-all duration-300 ${mobileOpen ? "opacity-0 rotate-45" : "opacity-100 rotate-0"}`} />
              <X className={`w-5 h-5 absolute inset-0 transition-all duration-300 ${mobileOpen ? "opacity-100 rotate-0" : "opacity-0 -rotate-45"}`} />
            </span>
          </button>
        </div>
      </div>

      {/* Mobile nav */}
      <div
        className={`lg:hidden bg-card border-b border-border overflow-hidden transition-all duration-400 ease-out ${
          mobileOpen ? "max-h-[640px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="px-4 py-3 space-y-0.5">
          {navItems.map((item, i) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.label}
                to={item.href}
                onClick={() => setMobileOpen(false)}
                style={{ transitionDelay: mobileOpen ? `${i * 30}ms` : "0ms" }}
                className={`flex items-center justify-between py-3 px-3 rounded-lg text-sm font-medium transition-all ${
                  active ? "bg-primary/10 text-primary" : "text-foreground hover:bg-muted"
                }`}
              >
                <span>{item.label}</span>
                <ChevronDown className="w-4 h-4 -rotate-90 opacity-50" />
              </Link>
            );
          })}

          <div className="pt-3 mt-2 border-t border-border grid grid-cols-2 gap-2">
            <a
              href="tel:+73952551234"
              className="flex items-center justify-center gap-1.5 h-10 rounded-lg bg-foreground text-background text-sm font-medium"
            >
              <Phone className="w-4 h-4" /> Позвонить
            </a>
            <Link
              to="/auth"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center gap-1.5 h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
            >
              Войти <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <Link
            to="/list-property"
            onClick={() => setMobileOpen(false)}
            className="mt-2 flex items-center justify-center gap-1.5 h-11 rounded-lg border-2 border-gold/70 bg-gold/5 text-gold-dark text-sm font-semibold hover:bg-gold hover:text-primary-foreground transition-all"
          >
            <Sparkles className="w-4 h-4" />
            Разместить объект
          </Link>

          <div className="flex items-center justify-center gap-2 pt-3">
            {socials.map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-muted text-foreground hover:bg-primary hover:text-primary-foreground transition-all"
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
