import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import type { ListingSellerFilter } from "@/lib/listingSource";
import {
  BUILDING_TYPES,
  FURNITURE_OPTIONS,
  MARKET_OPTIONS,
  ROOMS_OPTIONS,
} from "@/lib/propertyOptions";
import { LAND_TYPE_LABEL } from "@/lib/propertyLand";
import { cn } from "@/lib/utils";

export const CATALOG_PRICE_MAX = 50_000_000;
export const CATALOG_AREA_MAX = 300_000;

const CEILING_OPTIONS = [
  { label: "от 3 м", value: 3 },
  { label: "от 4 м", value: 4 },
  { label: "от 5 м", value: 5 },
];

function Segmented({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div
      className={cn(
        "grid gap-1 rounded-xl bg-muted/70 p-1",
        options.length <= 3 ? "grid-cols-3" : "grid-cols-2",
      )}
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={cn(
            "min-w-0 py-1.5 px-1 rounded-lg text-[10px] leading-tight font-medium transition-colors truncate",
            value === o.value
              ? "bg-foreground text-background shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function FilterBlock({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border/50 pb-3 mb-3 last:border-0 last:mb-0 last:pb-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-2 mb-2 text-left min-w-0"
      >
        <span className="text-xs font-semibold text-foreground truncate">
          {title}
        </span>
        <ChevronDown
          className={cn(
            "w-3.5 h-3.5 text-muted-foreground transition-transform shrink-0",
            open && "rotate-180",
          )}
        />
      </button>
      {open && <div className="min-w-0 overflow-hidden">{children}</div>}
    </div>
  );
}

export type CatalogFiltersSidebarProps = {
  dealType: string;
  dealOptions: string[];
  onDealType: (v: string) => void;
  types: string[];
  selectedTypes: string[];
  onToggleType: (t: string) => void;
  onSetTypes: (types: string[]) => void;
  district: string;
  onOpenLocation: () => void;
  priceMin: number;
  priceMax: number;
  onPriceMin: (n: number) => void;
  onPriceMax: (n: number) => void;
  areaMin: number;
  areaMax: number;
  onAreaMin: (n: number) => void;
  onAreaMax: (n: number) => void;
  seller: ListingSellerFilter;
  onSeller: (v: ListingSellerFilter) => void;
  sellerOptions: { value: ListingSellerFilter; label: string }[];
  searchQuery: string;
  onSearchQuery: (v: string) => void;
  isResidential: boolean;
  isCommercial: boolean;
  isLand: boolean;
  selectedRooms: string[];
  onToggleRoom: (v: string) => void;
  selectedMarket: string[];
  onToggleMarket: (v: string) => void;
  selectedBuildingTypes: string[];
  onToggleBuildingType: (v: string) => void;
  selectedFurniture: string[];
  onToggleFurniture: (v: string) => void;
  propertyClass: string;
  classOptions: string[];
  onPropertyClass: (v: string) => void;
  condition: string;
  conditionOptions: string[];
  onCondition: (v: string) => void;
  ceilingMin: number;
  onCeilingMin: (n: number) => void;
  parkingOnly: boolean;
  onParkingOnly: (v: boolean) => void;
  landUseOptions: string[];
  selectedLandUses: string[];
  onToggleLandUse: (v: string) => void;
  activeFiltersCount: number;
  onReset: () => void;
  className?: string;
};

export default function CatalogFiltersSidebar({
  dealType,
  dealOptions,
  onDealType,
  types,
  selectedTypes,
  onToggleType,
  onSetTypes,
  district,
  onOpenLocation,
  priceMin,
  priceMax,
  onPriceMin,
  onPriceMax,
  areaMin,
  areaMax,
  onAreaMin,
  onAreaMax,
  seller,
  onSeller,
  sellerOptions,
  searchQuery,
  onSearchQuery,
  isResidential,
  isCommercial,
  isLand,
  selectedRooms,
  onToggleRoom,
  selectedMarket,
  onToggleMarket,
  selectedBuildingTypes,
  onToggleBuildingType,
  selectedFurniture,
  onToggleFurniture,
  propertyClass,
  classOptions,
  onPropertyClass,
  condition,
  conditionOptions,
  onCondition,
  ceilingMin,
  onCeilingMin,
  parkingOnly,
  onParkingOnly,
  landUseOptions,
  selectedLandUses,
  onToggleLandUse,
  activeFiltersCount,
  onReset,
  className,
}: CatalogFiltersSidebarProps) {
  return (
    <aside
      className={cn(
        "w-full min-w-0 max-w-full overflow-x-hidden bg-card rounded-xl border border-border/60 p-3",
        className,
      )}
    >
      {/* Верхние селекты как в примере */}
      <div className="space-y-1.5 mb-3">
        <label className="sr-only" htmlFor="catalog-deal-select">
          Тип сделки
        </label>
        <div className="relative min-w-0">
          <select
            id="catalog-deal-select"
            value={dealType}
            onChange={(e) => onDealType(e.target.value)}
            className="w-full min-w-0 appearance-none h-9 rounded-lg bg-muted/70 border-0 px-2.5 pr-8 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 cursor-pointer"
          >
            {dealOptions.map((d) => (
              <option key={d} value={d}>
                {d === "Все" ? "Любая сделка" : d}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        </div>

        <div className="relative min-w-0">
          <select
            aria-label="Тип объекта"
            value={selectedTypes.length === 1 ? selectedTypes[0] : ""}
            onChange={(e) => {
              const v = e.target.value;
              onSetTypes(v ? [v] : []);
            }}
            className="w-full min-w-0 appearance-none h-9 rounded-lg bg-muted/70 border-0 px-2.5 pr-8 text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/25 cursor-pointer"
          >
            <option value="">Все типы</option>
            {types.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        </div>
      </div>

      <FilterBlock title="Вид объекта" defaultOpen>
        <div className="space-y-2">
          {types.map((t) => {
            const checked = selectedTypes.includes(t);
            return (
              <label
                key={t}
                className="flex items-center gap-2 cursor-pointer text-xs text-foreground min-w-0"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={() => onToggleType(t)}
                  className="shrink-0"
                />
                <span className="truncate">{t}</span>
              </label>
            );
          })}
        </div>
      </FilterBlock>

      <FilterBlock title="Где искать" defaultOpen>
        <button
          type="button"
          onClick={onOpenLocation}
          className="w-full min-w-0 h-9 rounded-lg bg-muted/70 px-2.5 text-left text-xs truncate focus:outline-none focus:ring-2 focus:ring-primary/25"
        >
          <span
            className={
              district !== "Все"
                ? "text-foreground font-medium"
                : "text-muted-foreground"
            }
          >
            {district !== "Все" ? district : "Все регионы"}
          </span>
        </button>
      </FilterBlock>

      <FilterBlock title="Цена, ₽" defaultOpen>
        <div className="grid grid-cols-2 gap-1.5 min-w-0">
          <input
            type="number"
            inputMode="numeric"
            placeholder="От"
            value={priceMin > 0 ? priceMin : ""}
            onChange={(e) =>
              onPriceMin(e.target.value === "" ? 0 : Number(e.target.value))
            }
            className="h-9 w-full min-w-0 rounded-lg border-0 bg-muted/70 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/25"
          />
          <input
            type="number"
            inputMode="numeric"
            placeholder="до"
            value={priceMax < CATALOG_PRICE_MAX ? priceMax : ""}
            onChange={(e) =>
              onPriceMax(
                e.target.value === ""
                  ? CATALOG_PRICE_MAX
                  : Number(e.target.value),
              )
            }
            className="h-9 w-full min-w-0 rounded-lg border-0 bg-muted/70 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/25"
          />
        </div>
      </FilterBlock>

      <FilterBlock title="Площадь, м²" defaultOpen>
        <div className="grid grid-cols-2 gap-1.5 min-w-0">
          <input
            type="number"
            inputMode="numeric"
            placeholder="От"
            value={areaMin > 0 ? areaMin : ""}
            onChange={(e) =>
              onAreaMin(e.target.value === "" ? 0 : Number(e.target.value))
            }
            className="h-9 w-full min-w-0 rounded-lg border-0 bg-muted/70 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/25"
          />
          <input
            type="number"
            inputMode="numeric"
            placeholder="до"
            value={areaMax < CATALOG_AREA_MAX ? areaMax : ""}
            onChange={(e) =>
              onAreaMax(
                e.target.value === ""
                  ? CATALOG_AREA_MAX
                  : Number(e.target.value),
              )
            }
            className="h-9 w-full min-w-0 rounded-lg border-0 bg-muted/70 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-primary/25"
          />
        </div>
      </FilterBlock>

      <FilterBlock title="Продавцы" defaultOpen>
        <Segmented
          options={sellerOptions.map((o) => ({
            value: o.value,
            label:
              o.value === "owner"
                ? "Частные"
                : o.value === "agency"
                  ? "Агентства"
                  : o.value === "developer"
                    ? "Застройщики"
                    : "Все",
          }))}
          value={seller}
          onChange={(v) => onSeller(v as ListingSellerFilter)}
        />
      </FilterBlock>

      {isResidential && (
        <FilterBlock title="Комнаты" defaultOpen>
          <div className="flex flex-wrap gap-1.5">
            {ROOMS_OPTIONS.map((room) => (
              <button
                key={room}
                type="button"
                onClick={() => onToggleRoom(room)}
                className={cn(
                  "px-2 py-1 rounded-md text-[10px] font-medium border transition-colors max-w-full truncate",
                  selectedRooms.includes(room)
                    ? "bg-foreground text-background border-foreground"
                    : "border-border bg-muted/40 text-muted-foreground hover:text-foreground",
                )}
              >
                {room}
              </button>
            ))}
          </div>
        </FilterBlock>
      )}

      {isResidential && (
        <FilterBlock title="Рынок" defaultOpen={false}>
          <div className="flex flex-wrap gap-1.5">
            {MARKET_OPTIONS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onToggleMarket(item)}
                className={cn(
                  "px-2 py-1 rounded-md text-[10px] font-medium border transition-colors max-w-full truncate",
                  selectedMarket.includes(item)
                    ? "bg-foreground text-background border-foreground"
                    : "border-border bg-muted/40 text-muted-foreground hover:text-foreground",
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </FilterBlock>
      )}

      {isResidential && (
        <FilterBlock title="Тип дома" defaultOpen={false}>
          <div className="flex flex-wrap gap-1.5">
            {BUILDING_TYPES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onToggleBuildingType(item)}
                className={cn(
                  "px-2 py-1 rounded-md text-[10px] font-medium border transition-colors max-w-full truncate",
                  selectedBuildingTypes.includes(item)
                    ? "bg-foreground text-background border-foreground"
                    : "border-border bg-muted/40 text-muted-foreground hover:text-foreground",
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </FilterBlock>
      )}

      {isResidential && (
        <FilterBlock title="Мебель" defaultOpen={false}>
          <div className="flex flex-wrap gap-1.5">
            {FURNITURE_OPTIONS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => onToggleFurniture(item)}
                className={cn(
                  "px-2 py-1 rounded-md text-[10px] font-medium border transition-colors max-w-full truncate",
                  selectedFurniture.includes(item)
                    ? "bg-foreground text-background border-foreground"
                    : "border-border bg-muted/40 text-muted-foreground hover:text-foreground",
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </FilterBlock>
      )}

      {isLand && landUseOptions.length > 0 && (
        <FilterBlock title={`${LAND_TYPE_LABEL} участка`} defaultOpen>
          <div className="space-y-2.5">
            {landUseOptions.map((l) => (
              <label
                key={l}
                className="flex items-center gap-2.5 cursor-pointer text-sm"
              >
                <Checkbox
                  checked={selectedLandUses.includes(l)}
                  onCheckedChange={() => onToggleLandUse(l)}
                />
                {l}
              </label>
            ))}
          </div>
        </FilterBlock>
      )}

      {isCommercial && (
        <FilterBlock title="Класс" defaultOpen={false}>
          <div className="flex flex-wrap gap-1.5">
            {classOptions.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onPropertyClass(c)}
                className={cn(
                  "px-2 py-1 rounded-md text-[10px] font-medium border transition-colors max-w-full truncate",
                  propertyClass === c
                    ? "bg-foreground text-background border-foreground"
                    : "border-border bg-muted/40 text-muted-foreground hover:text-foreground",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </FilterBlock>
      )}

      {!isLand && (
        <FilterBlock title="Состояние" defaultOpen={false}>
          <div className="flex flex-wrap gap-1.5">
            {conditionOptions.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => onCondition(c)}
                className={cn(
                  "px-2 py-1 rounded-md text-[10px] font-medium border transition-colors max-w-full truncate",
                  condition === c
                    ? "bg-foreground text-background border-foreground"
                    : "border-border bg-muted/40 text-muted-foreground hover:text-foreground",
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </FilterBlock>
      )}

      {isCommercial && (
        <FilterBlock title="Дополнительно" defaultOpen={false}>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">
                Высота потолков
              </p>
              <div className="flex flex-wrap gap-1.5">
                {CEILING_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() =>
                      onCeilingMin(ceilingMin === opt.value ? 0 : opt.value)
                    }
                    className={cn(
                      "px-2 py-1 rounded-md text-[10px] font-medium border transition-colors max-w-full truncate",
                      ceilingMin === opt.value
                        ? "bg-foreground text-background border-foreground"
                        : "border-border bg-muted/40 text-muted-foreground",
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2.5 cursor-pointer text-sm">
              <Checkbox
                checked={parkingOnly}
                onCheckedChange={(v) => onParkingOnly(v === true)}
              />
              Только с парковкой
            </label>
          </div>
        </FilterBlock>
      )}

      <FilterBlock title="Слова в описании" defaultOpen={false}>
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => onSearchQuery(e.target.value)}
          placeholder="Что важно"
          className="w-full min-w-0 h-9 rounded-lg bg-muted/70 border-0 px-2.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/25"
        />
      </FilterBlock>

      {activeFiltersCount > 0 && (
        <button
          type="button"
          onClick={onReset}
          className="mt-1 w-full h-9 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
        >
          Сбросить фильтры
        </button>
      )}
    </aside>
  );
}
