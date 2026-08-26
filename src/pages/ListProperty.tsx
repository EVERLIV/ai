import { ArrowLeft } from "lucide-react";
import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import ListPropertyBlock from "@/components/ListPropertyBlock";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import type { PropertySegment } from "@/config/propertySegments";
import { SEGMENT_ROUTES } from "@/config/propertySegments";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { listPropertyPath } from "@/lib/listPropertyLinks";

interface ListPropertyProps {
  segment?: PropertySegment;
}

export default function ListProperty({
  segment = "commercial",
}: ListPropertyProps) {
  const navigate = useNavigate();
  const { search } = useLocation();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const mode = new URLSearchParams(search).get("mode");
  const isResidential = segment === "residential";
  const isLand = segment === "land";
  const segmentHome = SEGMENT_ROUTES[segment].home;

  useEffect(() => {
    if (!user) return;
    if (profile?.account_type !== "developer") return;
    navigate("/account#properties", { replace: true });
  }, [user, profile?.account_type, navigate]);

  const modeLabel =
    mode === "rent"
      ? "Сдать бесплатно"
      : mode === "management"
        ? "Передать в управление"
        : "Выберите способ";

  const basePath = listPropertyPath(segment);
  const placeLabel = isLand
    ? "Разместить участок"
    : isResidential
      ? "Разместить жильё"
      : "Разместить объект";

  if (user && profile?.account_type === "developer") {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground">
        Перенаправление в кабинет застройщика…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader contextSegment={segment} />

      <div className="mt-[56px] lg:mt-[104px] border-b border-border/40">
        <div className="container mx-auto px-3 lg:px-8 h-10 lg:h-11 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label="Назад"
            className="shrink-0 flex items-center justify-center w-8 h-8 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <nav className="flex-1 min-w-0 flex items-center gap-1.5 text-[11px] lg:text-xs text-muted-foreground whitespace-nowrap overflow-hidden">
            <Link
              to={segmentHome}
              className="hover:text-foreground transition-colors shrink-0"
            >
              Главная
            </Link>
            <span className="shrink-0 opacity-50">/</span>
            <Link
              to={basePath}
              className="hover:text-foreground transition-colors shrink-0"
            >
              {placeLabel}
            </Link>
            <span className="shrink-0 opacity-50">/</span>
            <span className="text-foreground truncate min-w-0">
              {modeLabel}
            </span>
          </nav>
        </div>
      </div>

      <main className="flex-1">
        <ListPropertyBlock variant="page" segment={segment} />
      </main>
      <SiteFooter />
    </div>
  );
}
