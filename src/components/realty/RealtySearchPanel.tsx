import { ChevronDown, MapPin, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import FilterPickerField from "@/components/mobile/FilterPickerField";
import LocationPickerModal from "@/components/LocationPickerModal";
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
import { useAllDictionaryValues } from "@/hooks/useDictionaries";
import { useProperties } from "@/hooks/useProperties";
import { buildCatalogUrl } from "@/lib/catalogPaths";
import { flattenLocationOptions } from "@/lib/locationPicker";
import { cn } from "@/lib/utils";

const fieldClass =
  "w-full h-9 px-2.5 bg-background border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring";

type Props = {
  className?: string;
  searchLabel?: string;
};

export default function RealtySearchPanel({
  className,
  searchLabel = "Найти",
}: Props) {
  const navigate = useNavigate();
  const { all: dictItems } = useAllDictionaryValues();
  const { data: properties = [] } = useProperties();

  const [deal, setDeal] = useState<HomeDealChoice>("Продажа");
  const [categoryId, setCategoryId] = useState("apartments");
  const [market, setMarket] = useState<string[]>([]);
  const [typeOverlayOpen, setTypeOverlayOpen] = useState(false);
  const [roomsSheetOpen, setRoomsSheetOpen] = useState(false);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [rooms, setRooms] = useState("");
  const [priceMax, setPriceMax] = useState("");
  /** Выбранный город/район → query `district` в каталоге */
  const [district, setDistrict] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [suggestOpen, setSuggestOpen] = useState(false);

  const locationWrapRef = useRef<HTMLDivElement>(null);
  const locationInputRef = useRef<HTMLInputElement>(null);

  const extraFromListings = useMemo(
    () =>
      properties
        .map((p) => p.district?.trim())
        .filter((d): d is string => Boolean(d)),
    [properties],
  );

  const locationOptions = useMemo(
    () => flattenLocationOptions(dictItems, extraFromListings),
    [dictItems, extraFromListings],
  );

  const suggestions = useMemo(() => {
    const q = locationQuery.trim().toLowerCase();
    if (!q) return locationOptions.slice(0, 10);
    return locationOptions
      .filter((name) => name.toLowerCase().includes(q))
      .slice(0, 12);
  }, [locationOptions, locationQuery]);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (!locationWrapRef.current?.contains(e.target as Node)) {
        setSuggestOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const category =
    getCategoryById(categoryId) ?? defaultCategoryForDeal(deal);
  const showRooms = Boolean(category.showRooms);
  const types = typesForCategoryDeal(category.id, deal);

  const switchDeal = (next: HomeDealChoice) => {
    setDeal(next);
    if (next !== "Продажа") setMarket([]);
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

  const handleMarketChange = (nextMarket: string[]) => {
    setMarket(nextMarket);
  };

  const applyLocation = (name: string) => {
    const next = name === "Все" ? "" : name.trim();
    setDistrict(next);
    setLocationQuery(next);
    setSuggestOpen(false);
  };

  const clearLocation = () => {
    setDistrict("");
    setLocationQuery("");
    setSuggestOpen(false);
    locationInputRef.current?.focus();
  };

  const catalogBase = buildCatalogUrl({
    segment: category.segment,
    deal,
    types,
    market: market.length > 0 ? market : undefined,
    rooms:
      showRooms && rooms && rooms !== "Свободная планировка"
        ? rooms
        : undefined,
    district: district || undefined,
  });

  const navigateWithPrice = (base: string) => {
    const path = base.split("?")[0];
    const params = new URLSearchParams(base.split("?")[1] || "");
    if (priceMax) params.set("priceMax", priceMax.replace(/\s/g, ""));
    navigate(params.toString() ? `${path}?${params.toString()}` : path);
  };

  const handleSearch = () => {
    // если пользователь набрал текст, но не выбрал из списка — ищем по совпадению
    const typed = locationQuery.trim();
    let base = catalogBase;
    if (typed && typed !== district) {
      const exact = locationOptions.find(
        (n) => n.toLowerCase() === typed.toLowerCase(),
      );
      const fuzzy = locationOptions.find((n) =>
        n.toLowerCase().includes(typed.toLowerCase()),
      );
      const pick = exact ?? fuzzy;
      if (pick) {
        base = buildCatalogUrl({
          segment: category.segment,
          deal,
          types,
          market: market.length > 0 ? market : undefined,
          rooms:
            showRooms && rooms && rooms !== "Свободная планировка"
              ? rooms
              : undefined,
          district: pick,
        });
        setDistrict(pick);
        setLocationQuery(pick);
      }
    }
    navigateWithPrice(base);
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
        value={
          market.length > 0
            ? market.join(" + ")
            : category.label
        }
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

      <div ref={locationWrapRef} className="relative">
        <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none z-[1]" />
        <input
          ref={locationInputRef}
          type="text"
          value={locationQuery}
          onChange={(e) => {
            setLocationQuery(e.target.value);
            setSuggestOpen(true);
            if (!e.target.value.trim()) setDistrict("");
          }}
          onFocus={() => setSuggestOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (suggestions[0]) applyLocation(suggestions[0]);
              else handleSearch();
            }
            if (e.key === "Escape") setSuggestOpen(false);
          }}
          placeholder="Город или район"
          autoComplete="off"
          className={cn(fieldClass, "pl-8 pr-16")}
          aria-autocomplete="list"
          aria-expanded={suggestOpen}
        />
        <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
          {locationQuery ? (
            <button
              type="button"
              aria-label="Очистить"
              onClick={clearLocation}
              className="w-7 h-7 flex items-center justify-center rounded text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : null}
          <button
            type="button"
            aria-label="Выбрать район"
            title="Выбрать город или район"
            onClick={() => setLocationPickerOpen(true)}
            className="w-7 h-7 flex items-center justify-center rounded-md border border-border bg-muted/60 text-primary hover:border-primary/40 transition-colors"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {suggestOpen && suggestions.length > 0 && (
          <ul
            role="listbox"
            className="absolute left-0 right-0 top-[calc(100%+2px)] z-30 max-h-56 overflow-auto rounded-md border border-border bg-card shadow-[var(--shadow-card)]"
          >
            {suggestions.map((name) => (
              <li key={name}>
                <button
                  type="button"
                  role="option"
                  className={cn(
                    "w-full flex items-center gap-2 px-2.5 py-2 text-left text-sm hover:bg-muted/60 transition-colors",
                    district === name && "bg-primary/5 text-primary",
                  )}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => applyLocation(name)}
                >
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span className="truncate">{name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="pt-0.5">
        <button
          type="button"
          onClick={handleSearch}
          className="w-full h-9 flex items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          {searchLabel}
        </button>
      </div>

      <PropertyTypeOverlay
        open={typeOverlayOpen}
        onOpenChange={setTypeOverlayOpen}
        allCategories
        deal={deal}
        value={category.id}
        onChange={handleCategoryChange}
        market={market}
        onChangeMarket={handleMarketChange}
      />

      <RoomsSheet
        open={roomsSheetOpen}
        onOpenChange={setRoomsSheetOpen}
        value={rooms}
        onChange={setRooms}
      />

      <LocationPickerModal
        open={locationPickerOpen}
        onOpenChange={setLocationPickerOpen}
        value={district}
        extraLocations={extraFromListings}
        onSelect={applyLocation}
      />
    </div>
  );
}
