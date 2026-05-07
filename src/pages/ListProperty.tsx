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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <div className="sticky top-16 z-30 bg-card/85 backdrop-blur-xl border-b border-border">
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
      </div>

      <main className="flex-1">
        <ListPropertyBlock variant="page" />
      </main>
      <SiteFooter />
    </div>
  );
}
