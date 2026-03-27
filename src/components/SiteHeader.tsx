import { useState } from "react";
import { Search, Menu, X } from "lucide-react";

const navItems = ["Офисы", "Торговля", "Склады", "Земля", "О нас", "Контакты"];

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
            <a
              key={item}
              href={`#${item}`}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {item}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <div className="hidden lg:flex items-center gap-3">
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Search className="w-4 h-4" />
          </button>
          <button className="text-sm font-medium px-5 py-2 rounded-lg border border-gold text-gold hover:bg-gold hover:text-primary-foreground transition-all duration-300">
            Разместить объект
          </button>
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
            <a
              key={item}
              href={`#${item}`}
              className="block py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
              onClick={() => setMobileOpen(false)}
            >
              {item}
            </a>
          ))}
          <button className="mt-2 w-full text-sm font-medium px-5 py-2.5 rounded-lg border border-gold text-gold hover:bg-gold hover:text-primary-foreground transition-all">
            Разместить объект
          </button>
        </div>
      )}
    </header>
  );
}
