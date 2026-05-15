import { Search, MapPin, X } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useCountUp } from "@/hooks/useCountUp";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, Link } from "react-router-dom";
import { useProperties } from "@/hooks/useProperties";
import heroImg from "@/assets/hero-warehouses.jpg";

const stats = [
  { value: 1850, suffix: "+", label: "объектов" },
  { value: 24, suffix: "", label: "города" },
  { value: 97, suffix: "%", label: "довольных" },
];

const TYPES = [
  { label: "Офис", emoji: "🏢" },
  { label: "Торговая", emoji: "🏪" },
  { label: "Склад", emoji: "🏭" },
  { label: "Земля", emoji: "🌿" },
  { label: "Производство", emoji: "⚙️" },
];

export default function HeroSection() {
  const { ref, isVisible } = useScrollReveal(0.1);
  const [searchType, setSearchType] = useState("Офис");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dropdownRect, setDropdownRect] = useState<DOMRect | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchBarRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { data: properties = [] } = useProperties();

  const c1 = useCountUp(stats[0].value, 2200, isVisible);
  const c2 = useCountUp(stats[1].value, 2000, isVisible);
  const c3 = useCountUp(stats[2].value, 1800, isVisible);
  const counts = [c1, c2, c3];

  const suggestions = searchQuery.trim().length >= 2
    ? properties.filter((p) => {
        const q = searchQuery.toLowerCase();
        return p.type === searchType && (
          p.address.toLowerCase().includes(q) ||
          p.district.toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q)
        );
      }).slice(0, 6)
    : [];

  useEffect(() => {
    const update = () => {
      if (showSuggestions && searchBarRef.current) {
        setDropdownRect(searchBarRef.current.getBoundingClientRect());
      }
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => { window.removeEventListener("scroll", update); window.removeEventListener("resize", update); };
  }, [showSuggestions, suggestions.length]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        searchBarRef.current && !searchBarRef.current.contains(e.target as Node)
      ) setShowSuggestions(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSearch = () => {
    setShowSuggestions(false);
    const params = new URLSearchParams();
    if (searchType !== "Офис") params.set("types", searchType);
    if (searchQuery) params.set("q", searchQuery);
    navigate(`/catalog${params.toString() ? "?" + params.toString() : ""}`);
  };

  return (
    <section ref={ref} className="relative min-h-screen flex items-center pt-14 md:pt-16">
      <div className="absolute inset-0">
        <img src={heroImg} alt="" width={1920} height={1080} className="w-full h-full object-cover" fetchPriority="high" />
        <div className="absolute inset-0" style={{ background: "rgba(255,255,255,0.88)" }} />
      </div>

      <div className="relative z-10 w-full container mx-auto px-4 lg:px-8 py-16 sm:py-20">
        <div className={`max-w-2xl mx-auto text-center ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}>

          {/* Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/8 border border-primary/20 text-primary text-[11px] font-semibold uppercase tracking-widest mb-5">
            <span className="w-1.5 h-1.5 bg-primary" />
            Иркутск · Ангарск · Шелехов
          </div>

          <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-4">
            Аренда коммерческой<br />
            <span className="text-primary">недвижимости</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed">
            Офисы, торговые площади, склады и земельные участки
          </p>

          {/* Search block */}
          <div className="max-w-xl mx-auto" style={{ position: "relative", zIndex: 100 }}>

            {/* Type pills — одна строка, скролл на мобильных */}
            <div className="flex gap-1.5 mb-3 overflow-x-auto scrollbar-none pb-0.5 justify-start sm:justify-center">
              {TYPES.map((t) => (
                <button
                  key={t.label}
                  onClick={() => setSearchType(t.label)}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-all duration-200 active:scale-95 ${
                    searchType === t.label
                      ? "bg-primary text-primary-foreground shadow-[0_2px_8px_rgba(0,0,0,0.15)]"
                      : "bg-card/80 text-foreground/70 hover:bg-card hover:text-foreground border border-border/60 hover:border-primary/40"
                  }`}
                >
                  <span className="text-[13px] leading-none">{t.emoji}</span>
                  {t.label}
                </button>
              ))}
            </div>

            {/* Search input */}
            <div className="relative">
              <div
                ref={searchBarRef}
                className={`flex bg-card transition-all duration-200 ${
                  focused
                    ? "shadow-[0_0_0_2px_hsl(var(--primary)/0.3),0_8px_32px_-8px_rgba(0,0,0,0.2)]"
                    : "shadow-[0_4px_20px_-4px_rgba(0,0,0,0.12)] hover:shadow-[0_6px_24px_-4px_rgba(0,0,0,0.16)]"
                } border ${focused ? "border-primary/50" : "border-border"}`}
              >
                {/* Search icon */}
                <div className="flex items-center pl-4 text-muted-foreground shrink-0">
                  <Search className={`w-4 h-4 transition-colors duration-200 ${focused ? "text-primary" : ""}`} />
                </div>

                {/* Input */}
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => { setFocused(true); searchQuery.length >= 2 && setShowSuggestions(true); }}
                  onBlur={() => setFocused(false)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder={`Поиск — ${searchType.toLowerCase()}, район или адрес...`}
                  className="flex-1 px-3 py-3.5 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none min-w-0"
                />

                {/* Clear */}
                {searchQuery && (
                  <button
                    onClick={() => { setSearchQuery(""); setShowSuggestions(false); inputRef.current?.focus(); }}
                    className="flex items-center px-2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Search button */}
                <button
                  onClick={handleSearch}
                  className="flex items-center justify-center gap-1.5 px-5 sm:px-6 bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 active:scale-[0.98] transition-all duration-150 shrink-0"
                >
                  <Search className="w-4 h-4" />
                  <span className="hidden sm:inline">Найти</span>
                </button>
              </div>

              {/* Autocomplete */}
              {showSuggestions && suggestions.length > 0 && dropdownRect && createPortal(
                <div
                  ref={dropdownRef}
                  style={{
                    position: "fixed",
                    top: dropdownRect.bottom,
                    left: dropdownRect.left,
                    width: dropdownRect.width,
                    zIndex: 99999,
                    boxShadow: "0 16px_40px_-8px_rgba(0,0,0,0.2)",
                  }}
                  className="bg-card border border-border border-t-0 overflow-hidden"
                >
                  {suggestions.map((p) => (
                    <Link key={p.id} to={`/property/${p.id}`} onClick={() => setShowSuggestions(false)}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-muted transition-colors border-b border-border/40 last:border-0 group">
                      <div className="hidden sm:block shrink-0">
                        {p.cover_photo
                          ? <img src={p.cover_photo} alt="" className="w-9 h-9 object-cover" />
                          : <div className="w-9 h-9 bg-muted flex items-center justify-center"><MapPin className="w-3.5 h-3.5 text-muted-foreground" /></div>
                        }
                      </div>
                      <MapPin className="sm:hidden w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-xs font-medium text-foreground truncate group-hover:text-primary transition-colors">{p.address}</div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <span className="text-primary font-medium">{p.type}</span>
                          <span className="opacity-40">·</span>
                          <span>{p.area} м²</span>
                          <span className="opacity-40 hidden sm:inline">·</span>
                          <span className="hidden sm:inline">{p.district}</span>
                        </div>
                      </div>
                      {Number(p.price) > 0 && (
                        <div className="text-xs font-semibold text-foreground shrink-0 whitespace-nowrap">
                          {Number(p.price).toLocaleString("ru-RU")} ₽
                        </div>
                      )}
                    </Link>
                  ))}
                  <button onClick={handleSearch}
                    className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium text-primary hover:bg-primary/5 transition-colors border-t border-border">
                    <Search className="w-3 h-3" />
                    <span className="truncate">Все результаты для «{searchQuery}»</span>
                  </button>
                </div>,
                document.body
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className={`flex justify-center gap-8 sm:gap-20 mt-10 sm:mt-14 ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}
          style={{ animationDelay: "0.3s", position: "relative", zIndex: 0 }}>
          {stats.map((s, i) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-2xl sm:text-4xl font-bold text-foreground tabular-nums whitespace-nowrap">
                {counts[i].toLocaleString("ru-RU")}{s.suffix}
              </div>
              <div className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 uppercase tracking-wide whitespace-nowrap">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { scrollbar-width: none; }
      `}</style>
    </section>
  );
}
