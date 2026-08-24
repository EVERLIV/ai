import { ArrowRight } from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import PropertyGridCard, {
  PropertyGridCardSkeleton,
} from "@/components/PropertyGridCard";
import PropertyGridCardCompact from "@/components/PropertyGridCardCompact";
import type { PropertyFilters } from "@/components/SearchFilters";
import { useProperties } from "@/hooks/useProperties";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { listingMatchesSellerFilter } from "@/lib/listingSource";

export default function PropertyGrid({
  filters,
}: {
  filters?: PropertyFilters;
}) {
  const { ref, isVisible } = useScrollReveal();
  const { data: properties = [], isLoading } = useProperties({
    segment: "commercial",
  });

  const filtered = useMemo(() => {
    if (!filters) return properties;
    return properties.filter((p) => {
      if (
        filters.type !== "Все" &&
        !(p.type ?? "").toLowerCase().includes(filters.type.toLowerCase())
      )
        return false;
      const area = Number(p.area) || 0;
      if (area < filters.areaMin || area > filters.areaMax) return false;
      const price = Number(p.price) || 0;
      if (price > 0 && (price < filters.priceMin || price > filters.priceMax))
        return false;
      if (filters.district !== "Все" && p.district !== filters.district)
        return false;
      if (filters.cls !== "Все" && p.class !== filters.cls) return false;
      if (
        !listingMatchesSellerFilter(
          p,
          filters.seller || "Все",
          filters.agencyId || null,
        )
      )
        return false;
      return true;
    });
  }, [properties, filters]);

  return (
    <section
      ref={ref}
      id="property-results"
      className="py-8 lg:py-16 scroll-mt-20"
    >
      <div
        className={`container mx-auto px-4 lg:px-8 ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}
      >
        <div className="flex items-end justify-between mb-4 lg:mb-8">
          <div>
            <h2 className="font-display text-xl lg:text-3xl font-bold text-foreground">
              <span className="lg:hidden">Могут подойти</span>
              <span className="hidden lg:inline">Актуальные объекты</span>
            </h2>
            <p className="text-muted-foreground mt-1 text-sm lg:text-base hidden lg:block">
              Лучшие предложения на рынке
            </p>
          </div>
          <Link
            to="/catalog"
            className="hidden sm:flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Все объекты <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {isLoading ? (
          <>
            <div className="grid grid-cols-2 gap-2 lg:hidden">
              {Array.from({ length: 6 }).map((_, i) => (
                <PropertyGridCardSkeleton key={i} />
              ))}
            </div>
            <div className="hidden lg:grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <PropertyGridCardSkeleton key={i} />
              ))}
            </div>
          </>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            По вашим фильтрам объектов не найдено. Попробуйте изменить
            параметры.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2 lg:hidden">
              {filtered.slice(0, 12).map((p) => (
                <PropertyGridCardCompact key={p.id} property={p} />
              ))}
            </div>
            <div className="hidden lg:grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filtered.slice(0, 12).map((p) => (
                <PropertyGridCard key={p.id} property={p} />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
