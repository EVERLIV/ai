import { Search, ChevronDown, MapPin } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useCountUp } from "@/hooks/useCountUp";
import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useNavigate, Link } from "react-router-dom";
import { useProperties } from "@/hooks/useProperties";
import heroImg from "@/assets/hero-warehouses.jpg";

const stats = [
  { value: 1850, suffix: "+", label: "объектов" },
  { value: 24, suffix: "", label: "города региона" },
  { value: 97, suffix: "%", label: "довольных клиентов" },
];

const TYPES = ["Офис", "Торговая", "Склад", "Земля", "Производство"];

export default function HeroSection() {
  const { ref, isVisible } = useScrollReveal(0.1);
  const [searchType, setSearchType] = useState("Офис");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
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

  // Filter suggestions — по типу И по тексту
  const suggestions = searchQuery.trim().length >= 2
    ? properties
        .filter((p) => {
          const q = searchQuery.toLowerCase();
          const typeMatch = p.type === searchType;
          const textMatch =
            p.address.toLowerCase().includes(q) ||
            p.district.toLowerCase().includes(q) ||
            (p.description || "").toLowerCase().includes(q);
          return typeMatch && textMatch;
        })
        .slice(0, 6)
    : [];

  // Update dropdown position — fixed coords from viewport
  useEffect(() => {
    const update = () => {
      if (showSuggestions && searchBarRef.current) {
        setDropdownRect(searchBarRef.current.getBoundingClientRect());
      }
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [showSuggestions, suggestions.length]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        searchBarRef.current && !searchBarRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
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
    <section ref={ref} className="relative min-h-screen flex items-center pt-16">
      {/* Background photo */}
      <div className="absolute inset-0">
        <img
          src={heroImg}
          alt="Коммерческая недвижимость"
          width={1920}
          height={1080}
          className="w-full h-full object-cover"
          fetchPriority="high"
        />
        {/* White overlay */}
        <div className="absolute inset-0" style={{ background: "rgba(255,255,255,0.88)" }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 lg:px-8 py-20">
        <div className={`max-w-3xl mx-auto text-center ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}>
          <p className="text-xs font-semibold tracking-widest uppercase text-primary mb-4">
            Коммерческая недвижимость Иркутска
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-5">
            Аренда коммерческой<br />
            <span className="text-primary">недвижимости</span> в Иркутске
          </h1>
          <p className="text-base text-muted-foreground mb-10 max-w-lg mx-auto leading-relaxed">
            Офисы, торговые площади, склады и земельные участки в Иркутске и Иркутской области.
          </p>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto" style={{ position: "relative", zIndex: 100 }}>
            <div className="relative">
              <div ref={searchBarRef} className="flex flex-col sm:flex-row bg-card shadow-[0_4px_24px_-4px_rgba(0,0,0,0.12)] border border-border">
                {/* Type select */}
                <div className="relative border-b sm:border-b-0 sm:border-r border-border shrink-0">
                  <select
                    value={searchType}
                    onChange={(e) => setSearchType(e.target.value)}
                    className="appearance-none w-full sm:w-36 px-4 py-3.5 bg-transparent text-sm font-medium text-foreground focus:outline-none cursor-pointer pr-8"
                  >
                    {TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                </div>

                {/* Text input */}
                <input
                  ref={inputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  placeholder="Район, улица или адрес..."
                  className="flex-1 px-4 py-3.5 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none border-b sm:border-b-0 border-border"
                />

                {/* Button */}
                <button
                  onClick={handleSearch}
                  className="flex items-center justify-center gap-2 px-7 py-3.5 bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity shrink-0"
                >
                  <Search className="w-4 h-4" />
                  Найти
                </button>
              </div>

              {/* Autocomplete dropdown — portal to body to escape stacking context */}
              {showSuggestions && suggestions.length > 0 && dropdownRect && createPortal(
                <div
                  ref={dropdownRef}
                  style={{
                    position: "fixed",
                    top: dropdownRect.bottom,
                    left: dropdownRect.left,
                    width: dropdownRect.width,
                    zIndex: 99999,
                    boxShadow: "0 12px 32px -4px rgba(0,0,0,0.22)",
                  }}
                  className="bg-card border border-border border-t-0 overflow-hidden"
                >
                  {suggestions.map((p) => (
                    <Link
                      key={p.id}
                      to={`/property/${p.id}`}
                      onClick={() => setShowSuggestions(false)}
                      className="flex items-center gap-3 px-3 sm:px-4 py-2.5 hover:bg-muted transition-colors border-b border-border/50 last:border-0"
                    >
                      <div className="hidden sm:block shrink-0">
                        {p.cover_photo ? (
                          <img src={p.cover_photo} alt="" className="w-9 h-9 object-cover" />
                        ) : (
                          <div className="w-9 h-9 bg-muted flex items-center justify-center">
                            <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <MapPin className="sm:hidden w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-xs font-medium text-foreground truncate">{p.address}</div>
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
                  <button
                    onClick={handleSearch}
                    className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium text-primary hover:bg-muted transition-colors border-t border-border"
                  >
                    <Search className="w-3 h-3" />
                    <span className="truncate">Все результаты для «{searchQuery}»</span>
                  </button>
                </div>,
                document.body
              )}
            </div>

            {/* Quick links */}
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-3">
              {TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => { setSearchType(t); navigate(`/catalog?types=${t}`); }}
                  className="text-[11px] text-muted-foreground hover:text-primary transition-colors"
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className={`flex justify-center gap-10 sm:gap-20 mt-16 ${isVisible ? "animate-fade-in-up" : "opacity-0"}`} style={{ animationDelay: "0.3s", position: "relative", zIndex: 0 }}>
          {stats.map((s, i) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-3xl sm:text-4xl font-bold text-foreground">
                {counts[i].toLocaleString("ru-RU")}{s.suffix}
              </div>
              <div className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
