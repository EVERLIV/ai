import {
  ArrowRight,
  Building2,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";
import { useRef } from "react";
import { Link } from "react-router-dom";
import CatalogCountChip from "@/components/specialists/CatalogCountChip";
import { RatingBadge } from "@/components/specialists/SpecialistReviews";
import { pluralObjects } from "@/components/specialists/specialistUtils";
import VerifiedBadge from "@/components/VerifiedBadge";
import { usePublicManagersCatalog } from "@/hooks/useAgency";

export default function RealtorsGallerySection() {
  const { data: managers = [], isLoading } = usePublicManagersCatalog();
  const scrollRef = useRef<HTMLDivElement>(null);
  const items = managers.slice(0, 12);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: dir === "left" ? -el.clientWidth * 0.9 : el.clientWidth * 0.9,
      behavior: "smooth",
    });
  };

  return (
    <section className="py-14 bg-muted/20 border-b border-border/60">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
          <div>
            <p className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-1.5 inline-flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> Специалисты
            </p>
            <h2 className="font-display text-2xl font-bold text-foreground">
              Риелторы
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Проверенные специалисты агентств региона
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-1">
              <button
                type="button"
                onClick={() => scroll("left")}
                aria-label="Назад"
                className="w-8 h-8 flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors bg-card"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => scroll("right")}
                aria-label="Вперёд"
                className="w-8 h-8 flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors bg-card"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <Link
              to="/rieltory"
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Все риелторы <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="flex gap-2 sm:gap-4 overflow-hidden">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="shrink-0 w-[calc((100%-0.5rem)/2)] sm:w-[200px] lg:w-[240px] h-[196px] sm:h-[280px] rounded-xl border border-border/60 bg-card animate-pulse"
              />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm border border-border rounded-lg bg-card">
            Риелторы появятся здесь после модерации агентств
          </div>
        ) : (
          <div
            ref={scrollRef}
            className="flex gap-2 sm:gap-4 overflow-x-auto scrollbar-hide pb-2 snap-x snap-mandatory"
            style={{ scrollSnapType: "x mandatory" }}
          >
            {items.map((m) => {
              const verified = m.agency.verification_status === "verified";
              const types = m.property_types ?? [];
              return (
                <Link
                  key={m.id}
                  to={`/rieltor/${m.id}`}
                  className="group shrink-0 w-[calc((100%-0.5rem)/2)] sm:w-[200px] lg:w-[240px] rounded-xl border border-border/60 bg-card p-2.5 sm:p-4 hover:border-border hover:bg-muted/20 hover:-translate-y-0.5 transition-all duration-300 snap-start"
                  style={{ scrollSnapAlign: "start" }}
                >
                  <div className="flex flex-col items-center text-center gap-1.5 sm:gap-3">
                    <div className="w-11 h-11 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-muted ring-1 ring-border/50">
                      {m.photo_url ? (
                        <img
                          src={m.photo_url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm sm:text-lg font-semibold text-muted-foreground">
                          {m.full_name?.[0] || "?"}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 sm:space-y-1.5 w-full min-w-0">
                      <div className="flex items-center justify-center gap-1 sm:gap-1.5 min-w-0">
                        <h3 className="text-xs sm:text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                          {m.full_name}
                        </h3>
                        {verified && (
                          <VerifiedBadge size="sm" showLabel={false} />
                        )}
                      </div>
                      <div className="flex justify-center scale-90 sm:scale-100 origin-center">
                        <RatingBadge
                          avgRating={m.avg_rating}
                          reviewsCount={m.reviews_count}
                        />
                      </div>
                      <p className="text-[10px] sm:text-[11px] text-muted-foreground inline-flex items-center justify-center gap-1 w-full min-w-0">
                        <Building2 className="w-3 h-3 shrink-0 opacity-60" />
                        <span className="truncate">{m.agency.name}</span>
                      </p>
                    </div>

                    {types.length > 0 && (
                      <div className="hidden sm:flex flex-wrap justify-center gap-1">
                        {types.slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="rounded-md bg-muted/70 px-1.5 py-0.5 text-[10px] text-muted-foreground leading-none"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    <CatalogCountChip
                      count={m.objects_count}
                      label={pluralObjects(m.objects_count)}
                      className="scale-90 sm:scale-100"
                    />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </section>
  );
}
