import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, Menu, X } from "lucide-react";

const navItems = [
  { label: "Офисы", href: "/offices" },
  { label: "Торговля", href: "/retail" },
  { label: "Склады", href: "/warehouses" },
  { label: "Каталог", href: "/catalog" },
  { label: "О нас", href: "/#about" },
  { label: "Контакты", href: "/#contacts" },
];

export default function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto flex items-center justify-between h-16 px-4 lg:px-8">
        {/* Logo */}
        <a href="#" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">А</span>
          </div>
          <span className="font-display text-lg font-semibold tracking-tight text-foreground">
            АРЕНДА<span className="text-primary">СИТИ</span>
          </span>
        </a>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden lg:flex items-center gap-3">
          <Link to="/catalog">
            <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <Search className="w-4 h-4" />
            </button>
          </Link>
          <Link
            to="/auth"
            className="text-sm font-medium px-5 py-2 rounded-lg border border-border text-foreground hover:bg-accent/10 transition-all duration-300"
          >
            Войти
          </Link>
        </div>

        {/* Mobile toggle */}
        <button className="lg:hidden text-foreground" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="lg:hidden bg-card border-b border-border px-4 pb-4">
          {navItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className="block py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          <Link
            to="/auth"
            onClick={() => setMobileOpen(false)}
            className="mt-2 block w-full text-center text-sm font-medium px-5 py-2.5 rounded-lg border border-border text-foreground hover:bg-accent/10 transition-all"
          >
            Войти
          </Link>
        </div>
      )}
    </header>
  );
}
