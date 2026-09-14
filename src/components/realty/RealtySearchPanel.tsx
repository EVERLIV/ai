import { Map, Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FilterPickerField from "@/components/mobile/FilterPickerField";
import PropertyTypeOverlay from "@/components/mobile/PropertyTypeOverlay";
import RoomsSheet, { roomsDisplayLabel } from "@/components/mobile/RoomsSheet";
import {
  defaultCategoryForDeal,
  getCategoryById,
  HOME_DEAL_TABS,
  type HomeDealChoice,
  isCategoryAllowedForDeal,
  typesForCategoryDeal,
} from "@/config/homeSearchCategories";
import { buildCatalogUrl } from "@/lib/catalogLinks";
import { cn } from "@/lib/utils";

const fieldClass =
  "w-full h-9 px-2.5 bg-background border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring";

type Props = {
  className?: string;
  /** На главной: при карте скролл к #map; на хабе — всегда каталог view=map */
  preferPageMapAnchor?: boolean;
  searchLabel?: string;
};

export default function RealtySearchPanel({
  className,
  preferPageMapAnchor = false,
  searchLabel = "Найти",
}: Props) {
  const navigate = useNavigate();
  const [deal, setDeal] = useState<HomeDealChoice>("Продажа");
  const [categoryId, setCategoryId] = useState("apartments");
  const [typeOverlayOpen, setTypeOverlayOpen] = useState(false);
  const [roomsSheetOpen, setRoomsSheetOpen] = useState(false);
  const [rooms, setRooms] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [location, setLocation] = useState("Иркутск");

  const category =
    getCategoryById(categoryId) ?? defaultCategoryForDeal(deal);
  const showRooms = Boolean(category.showRooms);
  const types = typesForCategoryDeal(category.id, deal);

  const switchDeal = (next: HomeDealChoice) => {
    setDeal(next);
    if (!isCategoryAllowedForDeal(categoryId, next)) {
      const nextCat = defaultCategoryForDeal(next);
      setCategoryId(nextCat.id);
      setRooms("");
    }
  };

  const handleCategoryChange = (nextId: string) => {
    setCategoryId(nextId);
    const next = getCategoryById(nextId);
    if (!next?.showRooms) setRooms("");
  };

  const catalogBase = buildCatalogUrl({
    segment: category.segment,
    deal,
    types,
    rooms:
      showRooms && rooms && rooms !== "Свободная планировка"
        ? rooms
        : undefined,
    q: location.trim() !== "Иркутск" ? location.trim() : undefined,
  });

  const navigateWithPrice = (base: string, mapView = false) => {
    const path = base.split("?")[0];
    const params = new URLSearchParams(base.split("?")[1] || "");
    if (priceMax) params.set("priceMax", priceMax.replace(/\s/g, ""));
    if (mapView) params.set("view", "map");
    navigate(params.toString() ? `${path}?${params.toString()}` : path);
  };

  const handleSearch = () => navigateWithPrice(catalogBase);

  const handleMap = () => {
    if (preferPageMapAnchor) {
      const el = document.getElementById("map");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    navigateWithPrice(
      buildCatalogUrl({
        segment: category.segment,
        deal,
        types,
      }),
      true,
    );
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-2.5 space-y-2 shadow-[var(--shadow-card)]",
        className,
      )}
    >
      <div className="flex rounded-md bg-muted p-0.5 gap-0.5">
        {HOME_DEAL_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => switchDeal(tab.value)}
            className={cn(
              "flex-1 py-1.5 px-1 text-[12px] font-semibold rounded transition-colors",
              deal === tab.value
                ? "bg-card text-foreground shadow-sm border border-border/80"
                : "text-muted-foreground border border-transparent",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <FilterPickerField
        label="Категория"
        value={category.label}
        onClick={() => setTypeOverlayOpen(true)}
        className="h-9 rounded-md text-sm bg-background"
      />

      <div
        className={cn("grid gap-2", showRooms ? "grid-cols-2" : "grid-cols-1")}
      >
        {showRooms && (
          <FilterPickerField
            label="Комнаты"
            value={rooms ? roomsDisplayLabel(rooms) : ""}
            placeholder="Комнаты"
            onClick={() => setRoomsSheetOpen(true)}
            className="h-9 rounded-md text-sm bg-background"
          />
        )}
        <div className="relative">
          <input
            type="text"
            inputMode="numeric"
            placeholder="Цена"
            value={priceMax}
            onChange={(e) =>
              setPriceMax(e.target.value.replace(/[^\d\s]/g, ""))
            }
            className={cn(fieldClass, "pr-7")}
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
            ₽
          </span>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Город или район"
          className={cn(fieldClass, "pl-8")}
        />
      </div>

      <div className="flex gap-1.5 pt-0.5">
        <button
          type="button"
          onClick={handleSearch}
          className="flex-1 h-9 flex items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          {searchLabel}
        </button>
        <button
          type="button"
          onClick={handleMap}
          aria-label="На карте"
          className="h-9 w-9 shrink-0 flex items-center justify-center rounded-md border border-border bg-background text-foreground hover:border-primary/40 transition-colors"
        >
          <Map className="w-4 h-4" />
        </button>
      </div>

      <PropertyTypeOverlay
        open={typeOverlayOpen}
        onOpenChange={setTypeOverlayOpen}
        allCategories
        deal={deal}
        value={category.id}
        onChange={handleCategoryChange}
      />

      <RoomsSheet
        open={roomsSheetOpen}
        onOpenChange={setRoomsSheetOpen}
        value={rooms}
        onChange={setRooms}
      />
    </div>
  );
}
