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
        "hidden lg:flex flex-col gap-3 w-[280px] xl:w-[300px] shrink-0 sticky top-[148px] self-start max-h-[calc(100vh-160px)] overflow-y-auto pb-4",
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
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Районы в выдаче
          </p>
          <div className="flex flex-wrap gap-1.5">
            {topDistricts.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onDistrictSelect(d)}
                className="px-2 py-0.5 rounded text-[11px] font-medium border border-border/80 bg-background text-foreground hover:border-foreground/30 transition-colors"
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
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors text-left pt-1"
      >
        <Bell className="w-3.5 h-3.5 shrink-0" />
        Уведомить о новых объектах
      </button>
    </aside>
  );
}
