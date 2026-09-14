import { Map, Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FilterPickerField from "@/components/mobile/FilterPickerField";
import PropertyTypeOverlay, {
  propertyTypeAccusative,
} from "@/components/mobile/PropertyTypeOverlay";
import RoomsSheet, { roomsDisplayLabel } from "@/components/mobile/RoomsSheet";
import {
  defaultTypeForDeal,
  HOME_DEAL_TABS,
  type HomeDealChoice,
  isTypeAllowedForDeal,
  segmentForPropertyType,
} from "@/config/homeSearchCategories";
import { buildCatalogUrl } from "@/lib/catalogLinks";
import { cn } from "@/lib/utils";

const ROOM_FILTER_TYPES = new Set([
  "Квартира",
  "Комната",
  "Апартаменты",
  "Доля",
]);

const fieldClass =
  "w-full h-11 px-3 bg-card border border-border/60 rounded-xl text-sm text-foreground placeholder:text-muted-foreground";

export default function MobileHomeSearch() {
  const navigate = useNavigate();
  const [deal, setDeal] = useState<HomeDealChoice>("Продажа");
  const [typeOverlayOpen, setTypeOverlayOpen] = useState(false);
  const [roomsSheetOpen, setRoomsSheetOpen] = useState(false);
  const [propertyType, setPropertyType] = useState<string>("Квартира");
  const [rooms, setRooms] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [location, setLocation] = useState("Иркутск");

  const segment = segmentForPropertyType(propertyType);
  const showRooms =
    segment === "residential" && ROOM_FILTER_TYPES.has(propertyType);

  const switchDeal = (next: HomeDealChoice) => {
    setDeal(next);
    if (!isTypeAllowedForDeal(propertyType, next)) {
      setPropertyType(defaultTypeForDeal(next));
      setRooms("");
    }
  };

  const handleTypeChange = (next: string) => {
    setPropertyType(next);
    if (!ROOM_FILTER_TYPES.has(next)) setRooms("");
  };

  const catalogBase = buildCatalogUrl({
    segment,
    deal,
    types: propertyType,
    rooms:
      showRooms && rooms && rooms !== "Свободная планировка"
        ? rooms
        : undefined,
    q: location.trim() !== "Иркутск" ? location.trim() : undefined,
  });

  const handleSearch = () => {
    const params = new URLSearchParams(catalogBase.split("?")[1] || "");
    if (priceMax) params.set("priceMax", priceMax.replace(/\s/g, ""));
    const path = catalogBase.split("?")[0];
    navigate(params.toString() ? `${path}?${params.toString()}` : path);
  };

  const handleMap = () => {
    const el = document.getElementById("map");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    const mapUrl = buildCatalogUrl({
      segment,
      deal,
      types: propertyType,
    });
    const path = mapUrl.split("?")[0];
    const params = new URLSearchParams(mapUrl.split("?")[1] || "");
    params.set("view", "map");
    navigate(`${path}?${params.toString()}`);
  };

  return (
    <section className="lg:hidden bg-[#E8F4FF] dark:bg-primary/10 px-4 pt-[4.5rem] pb-4">
      <div className="mb-3 text-center">
        <h1 className="font-display text-2xl font-bold text-foreground tracking-tight leading-snug">
          <span className="text-primary">Недвижимость</span> в Иркутске и
          области
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Квартиры, дома, земля, офисы — купить, снять или посуточно.
        </p>
      </div>

      <div className="rounded-2xl bg-card shadow-sm p-3 space-y-2.5">
        {/* Купить / Снять / Посуточно */}
        <div className="flex rounded-xl bg-muted/70 p-1 gap-0.5">
          {HOME_DEAL_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              onClick={() => switchDeal(tab.value)}
              className={cn(
                "flex-1 py-2 px-1 text-xs font-semibold rounded-lg transition-colors",
                deal === tab.value
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Все категории сайта */}
        <FilterPickerField
          label="Категория"
          value={
            segment === "residential"
              ? propertyTypeAccusative(propertyType)
              : propertyType
          }
          onClick={() => setTypeOverlayOpen(true)}
          className="h-11 rounded-xl text-sm"
        />

        <div
          className={cn(
            "grid gap-2",
            showRooms ? "grid-cols-2" : "grid-cols-1",
          )}
        >
          {showRooms && (
            <FilterPickerField
              label="Комнаты"
              value={rooms ? roomsDisplayLabel(rooms) : ""}
              placeholder="Комнаты"
              onClick={() => setRoomsSheetOpen(true)}
              className="h-11 rounded-xl text-sm"
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
              className={cn(fieldClass, "pr-8")}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              ₽
            </span>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Город или район"
            className={cn(fieldClass, "pl-10")}
          />
        </div>

        <div className="flex gap-2 pt-0.5">
          <button
            type="button"
            onClick={handleSearch}
            className="flex-1 h-11 flex items-center justify-center rounded-xl bg-foreground text-background text-sm font-semibold"
          >
            Найти
          </button>
          <button
            type="button"
            onClick={handleMap}
            aria-label="На карте"
            className="h-11 w-11 shrink-0 flex items-center justify-center rounded-xl border border-border/60 bg-card text-foreground"
          >
            <Map className="w-4 h-4" />
          </button>
        </div>
      </div>

      <PropertyTypeOverlay
        open={typeOverlayOpen}
        onOpenChange={setTypeOverlayOpen}
        allCategories
        deal={deal}
        value={propertyType}
        onChange={handleTypeChange}
      />

      <RoomsSheet
        open={roomsSheetOpen}
        onOpenChange={setRoomsSheetOpen}
        value={rooms}
        onChange={setRooms}
      />
    </section>
  );
}
