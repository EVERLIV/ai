import { Bell } from "lucide-react";
import { useMemo } from "react";
import CatalogMiniMap from "@/components/catalog/CatalogMiniMap";
import type { DbProperty } from "@/hooks/useProperties";
import { cn } from "@/lib/utils";

interface Props {
  properties: DbProperty[];
  highlightedId: string | null;
  onHighlight: (id: string | null) => void;
  onMarkerClick: (id: string) => void;
  onDistrictSelect: (district: string) => void;
  onNotifyClick: () => void;
  className?: string;
}

export default function CatalogResultsSidebar({
  properties,
  highlightedId,
  onHighlight,
  onMarkerClick,
  onDistrictSelect,
  onNotifyClick,
  className,
}: Props) {
  const topDistricts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of properties) {
      const d = p.district?.trim();
      if (!d || d === "—") continue;
      counts.set(d, (counts.get(d) ?? 0) + 1);
    }
    return [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);
  }, [properties]);

  return (
    <aside
      className={cn(
        "hidden xl:flex flex-col gap-2.5 w-[180px] 2xl:w-[200px] shrink-0 sticky top-[116px] self-start pb-4",
        className,
      )}
    >
      <CatalogMiniMap
        properties={properties}
        activeId={highlightedId}
        onMarkerClick={onMarkerClick}
        onMarkerHover={onHighlight}
      />

      {topDistricts.length > 0 && (
        <div>
          <p className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
            Районы
          </p>
          <div className="flex flex-wrap gap-1">
            {topDistricts.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onDistrictSelect(d)}
                className="px-1.5 py-0.5 rounded text-[10px] font-medium border border-border/80 bg-background text-foreground hover:border-foreground/30 transition-colors max-w-full truncate"
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onNotifyClick}
        className="inline-flex items-start gap-1.5 text-[10px] leading-snug text-muted-foreground hover:text-foreground transition-colors text-left pt-0.5"
      >
        <Bell className="w-3 h-3 shrink-0 mt-0.5" />
        Уведомить о новых
      </button>
    </aside>
  );
}
