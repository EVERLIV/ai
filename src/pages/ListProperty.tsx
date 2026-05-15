import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ListPropertyBlock from "@/components/ListPropertyBlock";

export default function ListProperty() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const mode = new URLSearchParams(search).get("mode");
  const modeLabel =
    mode === "rent" ? "Сдать через АрендаСити" : "Передать в управление";

  const [scrollPct, setScrollPct] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      setScrollPct(docH > 0 ? Math.min(100, (window.scrollY / docH) * 100) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <div className="sticky top-[56px] md:top-[98px] z-30 mt-[56px] md:mt-[98px] bg-card/90 backdrop-blur-xl shadow-[0_1px_0_0_hsl(var(--border)/0.5)]">
        <div className="container mx-auto px-3 lg:px-8 h-10 lg:h-11 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Назад"
            className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <nav className="flex-1 min-w-0 flex items-center gap-1.5 text-[11px] lg:text-xs text-muted-foreground whitespace-nowrap overflow-hidden">
            <Link to="/" className="hover:text-foreground transition-colors shrink-0">
              Главная
            </Link>
            <span className="shrink-0 opacity-50">/</span>
            <Link
              to="/list-property"
              className="hover:text-foreground transition-colors shrink-0"
            >
              Разместить объект
            </Link>
            <span className="shrink-0 opacity-50">/</span>
            <span className="text-foreground truncate min-w-0">{modeLabel}</span>
          </nav>
        </div>
        {/* Scroll indicator */}
        <div className="h-px bg-border/30">
          <div className="h-full bg-foreground/20 transition-[width] duration-100" style={{ width: `${scrollPct}%` }} />
        </div>
      </div>

      <main className="flex-1">
        <ListPropertyBlock variant="page" />
      </main>
      <SiteFooter />
    </div>
  );
}
