import { Map, Search, SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import DealTypeSheet, {
  type DealChoice,
  dealChoiceLabel,
} from "@/components/mobile/DealTypeSheet";

import FilterPickerField from "@/components/mobile/FilterPickerField";

import PropertyTypeOverlay, {
  propertyTypeAccusative,
} from "@/components/mobile/PropertyTypeOverlay";

import RoomsSheet, { roomsDisplayLabel } from "@/components/mobile/RoomsSheet";
import type { PropertySegment } from "@/config/propertySegments";
import { buildCatalogUrl } from "@/lib/catalogLinks";

import { cn } from "@/lib/utils";

const ROOM_FILTER_TYPES = new Set([
  "Квартира",
  "Комната",
  "Апартаменты",
  "Доля",
]);

export default function MobileHomeSearch() {
  const navigate = useNavigate();

  const [segment, setSegment] = useState<PropertySegment>("residential");

  const [deal, setDeal] = useState<DealChoice>("Аренда");

  const [dealSheetOpen, setDealSheetOpen] = useState(false);

  const [typeOverlayOpen, setTypeOverlayOpen] = useState(false);

  const [roomsSheetOpen, setRoomsSheetOpen] = useState(false);

  const [propertyType, setPropertyType] = useState<string>("Квартира");

  const [rooms, setRooms] = useState("");

  const [priceMax, setPriceMax] = useState("");

  const [location, setLocation] = useState("Иркутск");

  const showRooms =
    segment === "residential" && ROOM_FILTER_TYPES.has(propertyType);

  const switchSegment = (next: PropertySegment) => {
    setSegment(next);

    if (next === "residential") {
      setPropertyType("Квартира");

      setRooms("");

      if (deal === "Продажа") setDeal("Аренда");
    } else {
      setPropertyType("Офис");

      setRooms("");

      if (deal === "Посуточно") setDeal("Аренда");
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

    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    else
      navigate(
        segment === "residential"
          ? "/zhilaya/catalog?view=map"
          : "/catalog?view=map",
      );
  };

  return (
    <section className="lg:hidden bg-[#E8F4FF] dark:bg-primary/10 px-4 pt-[4.5rem] pb-4">
      <div className="rounded-xl bg-card shadow-sm p-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setDealSheetOpen(true)}
            className="inline-flex items-center gap-1 text-xl font-bold text-foreground"
          >
            {dealChoiceLabel(deal)}
            <span className="text-muted-foreground/60 text-lg leading-none">
              ▾
            </span>
          </button>
          <Link
            to={catalogBase}
            className="inline-flex items-center gap-1 text-xs font-medium text-primary whitespace-nowrap"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Все фильтры
          </Link>
        </div>

        <div className="flex rounded-lg bg-background/80 p-0.5 gap-0.5">
          {(["residential", "commercial"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => switchSegment(s)}
              className={cn(
                "flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors",

                segment === s
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground",
              )}
            >
              {s === "residential" ? "Жилая" : "Коммерция"}
            </button>
          ))}
        </div>

        <FilterPickerField
          label="Тип объекта"
          value={
            segment === "residential"
              ? propertyTypeAccusative(propertyType)
              : propertyType
          }
          onClick={() => setTypeOverlayOpen(true)}
        />

        <div
          className={cn(
            "grid gap-2",
            showRooms ? "grid-cols-2" : "grid-cols-1",
          )}
        >
          {showRooms && (
            <FilterPickerField
              label="Количество комнат"
              value={rooms ? roomsDisplayLabel(rooms) : ""}
              placeholder="Кол-во комнат"
              onClick={() => setRoomsSheetOpen(true)}
            />
          )}
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              placeholder="Цена до"
              value={priceMax}
              onChange={(e) =>
                setPriceMax(e.target.value.replace(/[^\d\s]/g, ""))
              }
              className="w-full h-11 px-3 pr-8 bg-card border border-border/60 text-sm text-foreground placeholder:text-muted-foreground"
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
            className="w-full h-11 pl-9 pr-3 bg-card border border-border/60 text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={handleMap}
            className="h-11 flex items-center justify-center gap-1.5 bg-card border border-border/60 text-sm font-semibold text-primary"
          >
            <Map className="w-4 h-4" />
            На карте
          </button>
          <button
            type="button"
            onClick={handleSearch}
            className="h-11 flex items-center justify-center bg-primary text-primary-foreground text-sm font-semibold"
          >
            Найти
          </button>
        </div>
      </div>

      <DealTypeSheet
        open={dealSheetOpen}
        onOpenChange={setDealSheetOpen}
        value={deal}
        onChange={setDeal}
        residential={segment === "residential"}
      />

      <PropertyTypeOverlay
        open={typeOverlayOpen}
        onOpenChange={setTypeOverlayOpen}
        segment={segment}
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
