import {
  BedDouble,
  Building2,
  Car,
  Factory,
  Home,
  Hotel,
  KeyRound,
  LandPlot,
  LayoutGrid,
  Store,
  UtensilsCrossed,
  Wrench,
} from "lucide-react";
import type { ElementType } from "react";
import { Link } from "react-router-dom";
import type {
  SegmentSuggestion,
  SuggestionIconKey,
} from "@/lib/segmentSuggestions";
import { cn } from "@/lib/utils";

const ICONS: Record<SuggestionIconKey, ElementType> = {
  apartment: Building2,
  house: Home,
  room: BedDouble,
  newbuild: LayoutGrid,
  daily: Hotel,
  garage: Car,
  office: Building2,
  retail: Store,
  warehouse: Factory,
  pavilion: Store,
  production: Factory,
  land: LandPlot,
  psn: KeyRound,
  food: UtensilsCrossed,
  auto: Wrench,
  all: LayoutGrid,
};

type Props = {
  items: SegmentSuggestion[];
  title?: string;
  className?: string;
  activeId?: string | null;
  isItemActive?: (item: SegmentSuggestion) => boolean;
  onSelect?: (item: SegmentSuggestion) => void;
};

export default function SegmentSuggestionTiles({
  items,
  title = "Предложения",
  className,
  activeId,
  isItemActive,
  onSelect,
}: Props) {
  if (!items.length) return null;

  return (
    <section className={cn("bg-background border-b border-border/50", className)}>
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-5 max-w-[1600px] mx-auto w-full">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          {title}
        </p>
        <div
          className={cn(
            "grid w-full gap-2 sm:gap-3",
            "grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-9",
          )}
        >
          {items.map((item) => {
            const Icon = ICONS[item.icon] || Building2;
            const active = isItemActive
              ? isItemActive(item)
              : activeId != null &&
                (activeId === item.id ||
                  activeId === item.filter?.homeType ||
                  activeId === item.label);

            const classNameTile = cn(
              "group flex flex-col items-center text-center w-full min-w-0 gap-1.5",
            );
            const iconWrap = cn(
              "flex items-center justify-center w-full aspect-square max-h-14 sm:max-h-16 rounded-xl sm:rounded-2xl border transition-colors",
              active
                ? "bg-primary/12 border-primary/35"
                : "bg-muted/70 border-border/40 group-hover:bg-primary/10 group-hover:border-primary/25",
            );
            const labelClass = cn(
              "w-full text-[10px] sm:text-[11px] font-medium leading-tight line-clamp-2 transition-colors px-0.5",
              active
                ? "text-primary"
                : "text-foreground group-hover:text-primary",
            );

            const content = (
              <>
                <span className={iconWrap}>
                  <Icon
                    className={cn(
                      "w-5 h-5 sm:w-6 sm:h-6 shrink-0",
                      active
                        ? "text-primary"
                        : "text-primary/80 group-hover:text-primary",
                    )}
                    strokeWidth={1.6}
                  />
                </span>
                <span className={labelClass}>{item.label}</span>
              </>
            );

            if (onSelect) {
              return (
                <button
                  key={item.id}
                  type="button"
                  className={classNameTile}
                  onClick={() => onSelect(item)}
                >
                  {content}
                </button>
              );
            }

            return (
              <Link key={item.id} to={item.href} className={classNameTile}>
                {content}
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
