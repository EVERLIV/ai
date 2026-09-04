import { Buildings as PhBuildings } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  LayoutGrid,
  List,
  Map as MapIcon,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ctaRentOutBg from "@/assets/cta-rent-out.jpg";
import CatalogFiltersSidebar, {
  CATALOG_AREA_MAX,
  CATALOG_PRICE_MAX,
} from "@/components/catalog/CatalogFiltersSidebar";
import CatalogListCard from "@/components/catalog/CatalogListCard";
import CatalogHorizontalBanner from "@/components/catalog/CatalogHorizontalBanner";
import CatalogResultsSidebar from "@/components/catalog/CatalogResultsSidebar";
import CatalogSearchAlertDialog, {
  CatalogSearchAlertButton,
} from "@/components/catalog/CatalogSearchAlertDialog";
import CatalogMap from "@/components/CatalogMap";
import CatalogPromoBanner, {
  getCatalogPromos,
  pickCatalogPromo,
} from "@/components/CatalogPromoBanner";
import LocationPickerModal from "@/components/LocationPickerModal";
import PropertyAIChat from "@/components/PropertyAIChat";
import PropertyGridCard, {
  PropertyGridCardSkeleton,
} from "@/components/PropertyGridCard";
import SegmentSuggestionTiles from "@/components/SegmentSuggestionTiles";
import SeoHead from "@/components/SeoHead";
import { absoluteUrl } from "@/config/site";
import { catalogHasFilterQuery } from "@/lib/seo/catalogIndexability";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import type { PropertySegment } from "@/config/propertySegments";
import { LAND_DEAL_TYPES } from "@/config/propertySegments";
import { useAllDictionaryValues } from "@/hooks/useDictionaries";
import { useProperties } from "@/hooks/useProperties";
import { usePropertyDistricts } from "@/hooks/usePropertyDistricts";
import {
  CATALOG_SORT_OPTIONS,
  normalizeCatalogSortKey,
  rankPropertyIdsByQuery,
  sortCatalogProperties,
  type CatalogSortKey,
} from "@/lib/catalogSort";
import { readCatalogFiltersFromSearchParams, serializeCatalogSearchParams } from "@/lib/catalogLinks";
import {
  getHorizontalBannerFallbackSlots,
  getHorizontalBannersAfterPropertyIndex,
} from "@/lib/catalogHorizontalBanners";
import { listPropertyPath } from "@/lib/listPropertyLinks";
import {
  type ListingSellerFilter,
  listingMatchesSellerFilter,
} from "@/lib/listingSource";
import { matchLocationFilter } from "@/lib/locations";
import {
  getLandUse,
  isAnyLand,
  LAND_USE_OPTIONS,
} from "@/lib/propertyLand";
import { RESIDENTIAL_CONDITIONS } from "@/lib/propertyOptions";
import {
  getResidentialBuildingType,
  getResidentialFurniture,
  getResidentialMarket,
  getResidentialRooms,
} from "@/lib/propertyResidential";
import {
  getCommercialSuggestions,
  getResidentialSuggestions,
  suggestionIsActive,
} from "@/lib/segmentSuggestions";
import {
  propertyMatchesSegment,
  propertyMatchesTypes,
} from "@/lib/propertyTypes";
import { matchesBuildingTypeFilter } from "@/lib/woodenHouses";
import { trackSearchPreference } from "@/lib/userPreferences";

const DEALS = ["Все", "Аренда", "Продажа"];
const RESIDENTIAL_DEALS = ["Все", "Аренда", "Продажа", "Посуточно"];
const SELLER_OPTIONS: { value: ListingSellerFilter; label: string }[] = [
  { value: "Все", label: "Все" },
  { value: "owner", label: "Собственник" },
  { value: "agency", label: "Агентство" },
  { value: "developer", label: "От застройщика" },
];
const CLASSES = ["Все", "A", "A+", "B+", "B", "C"];
const PRICE_MAX_DEFAULT = CATALOG_PRICE_MAX;
const AREA_MAX_DEFAULT = CATALOG_AREA_MAX;
const SORT_OPTIONS = CATALOG_SORT_OPTIONS;

// ─── useDebounce ───
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

// ─── Dropdown pill for the horizontal filter bar ───
function FilterDropdown({
  label,
  valueLabel,
  active,
  children,
  panelWidth = 260,
  align = "left",
}: {
  label: string;
  valueLabel?: string;
  active?: boolean;
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
  panelWidth?: number;
  /** right — у края экрана, чтобы панель не обрезалась overflow-x */
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const close = useCallback(() => setOpen(false), []);

  return (
    <div ref={ref} className="relative shrink-0 max-w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 h-7 px-2.5 sm:px-[11px] rounded border text-xs sm:text-sm font-medium transition-colors whitespace-nowrap max-w-[9.5rem] sm:max-w-[14rem] ${
          active
            ? "border-primary/60 text-primary bg-primary/5"
            : "border-border bg-card text-foreground hover:border-foreground/30"
        }`}
      >
        <span className="min-w-0 truncate">
          {active && valueLabel ? valueLabel : label}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""} ${active ? "text-primary" : "text-muted-foreground"}`}
        />
      </button>
      {open && (
        <div
          className={`absolute top-[calc(100%+6px)] z-50 rounded-lg border border-border bg-card shadow-lg p-2 ${
            align === "right" ? "right-0" : "left-0"
          }`}
          style={{
            width: panelWidth,
            maxWidth: "min(100vw - 1.5rem, 24rem)",
          }}
        >
          {typeof children === "function" ? children(close) : children}
        </div>
      )}
    </div>
  );
}

// ─── Option row inside a dropdown panel ───
function OptionRow({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-md text-sm transition-colors text-left ${
        selected
          ? "bg-primary/10 text-primary font-medium"
          : "text-foreground hover:bg-muted/80"
      }`}
    >
      <span className="leading-snug min-w-0">{label}</span>
      {selected && <Check className="w-4 h-4 shrink-0 text-primary" />}
    </button>
  );
}

// ─── Fade-in при появлении в вьюпорте ───
function FadeIn({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Нижний CTA-баннер «Сдайте объект за 14 дней» ───
function CtaBanner({ segment = "commercial" }: { segment?: PropertySegment }) {
  const listHref = listPropertyPath(segment, "rent");
  return (
    <div className="px-6 lg:px-12 xl:px-20 pb-10">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-xl text-white min-h-[240px]"
      >
        <img
          src={ctaRentOutBg}
          alt=""
          aria-hidden
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover object-[center_35%] scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#141414]/95 via-[#141414]/82 to-[#141414]/45" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#141414]/40 via-transparent to-transparent" />
        <span
          className="absolute right-0 top-0 h-full w-40 hidden lg:block bg-gradient-to-l from-primary/25 to-transparent pointer-events-none"
          aria-hidden
        />

        <div className="relative grid md:grid-cols-[1.2fr_1fr_auto] gap-6 items-center px-6 md:px-10 py-8 md:py-10">
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase mb-2">
              Для собственников
            </p>
            <h2 className="font-display text-xl md:text-2xl font-bold mb-2">
              Разместите объект бесплатно
            </h2>
            <p className="text-xs text-white/60 leading-relaxed max-w-sm">
              Опубликуйте объявление в каталоге за 0 ₽ — заявки приходят в
              личный кабинет.
            </p>
          </div>
          <ul className="space-y-2">
            {[
              "Размещение в каталоге бесплатно",
              "Заявки в личный кабинет",
              "Редактирование в любой момент",
              "Помощь менеджера при необходимости",
            ].map((t) => (
              <li
                key={t}
                className="flex items-start gap-2 text-xs text-white/85"
              >
                <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                {t}
              </li>
            ))}
          </ul>
          <Link
            to={listHref}
            className="justify-self-start md:justify-self-end inline-flex items-center h-11 px-6 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
          >
            Разместить объект
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Catalog ───
interface CatalogProps {
  segment?: PropertySegment;
  /** Плитки-предложения только на главном /catalog */
  showSuggestions?: boolean;
  /** Предвыбранные типы для страниц категорий (квартиры и т.п.) */
  initialTypes?: string[];
}

export default function Catalog({
  segment = "commercial",
  showSuggestions = false,
  initialTypes,
}: CatalogProps) {
  const isResidential = segment === "residential";
  const isLand = segment === "land";
  const isCommercial = segment === "commercial";
  const { propertyTypes } = useAllDictionaryValues();
  const TYPES = propertyTypes(segment);
  const dealOptions = isResidential
    ? RESIDENTIAL_DEALS
    : isLand
      ? (["Все", ...LAND_DEAL_TYPES] as string[])
      : DEALS;
  const { data: properties = [], isLoading } = useProperties({ segment });
  const { data: propertyDistricts = [] } = usePropertyDistricts();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialFilters = readCatalogFiltersFromSearchParams(searchParams);

  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid");
  const [mobileFilters, setMobileFilters] = useState(false);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [searchAlertOpen, setSearchAlertOpen] = useState(false);
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map());
  const initialTypesSeededRef = useRef(false);

  const [dealType, setDealType] = useState(initialFilters.dealType);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    initialFilters.selectedTypes,
  );
  const [district, setDistrict] = useState(initialFilters.district);
  const [propertyClass, setPropertyClass] = useState(
    initialFilters.propertyClass,
  );
  const [condition, setCondition] = useState(initialFilters.condition);
  const [sort, setSort] = useState<CatalogSortKey>(() =>
    normalizeCatalogSortKey(initialFilters.sort),
  );
  const [searchQuery, setSearchQuery] = useState(initialFilters.searchQuery);
  const [seller, setSeller] = useState<ListingSellerFilter>(
    initialFilters.seller,
  );
  const [agencyId, setAgencyId] = useState(initialFilters.agencyId);

  const [priceMin, setPriceMin] = useState(initialFilters.priceMin);
  const [priceMax, setPriceMax] = useState(initialFilters.priceMax);
  const [areaMin, setAreaMin] = useState(initialFilters.areaMin);
  const [areaMax, setAreaMax] = useState(initialFilters.areaMax);

  const [ceilingMin, setCeilingMin] = useState(initialFilters.ceilingMin);
  const [parkingOnly, setParkingOnly] = useState(initialFilters.parkingOnly);
  const [selectedLayouts, setSelectedLayouts] = useState<string[]>(
    initialFilters.selectedLayouts,
  );
  const [selectedLandUses, setSelectedLandUses] = useState<string[]>(
    initialFilters.selectedLandUses || [],
  );
  const [selectedRooms, setSelectedRooms] = useState<string[]>(
    initialFilters.selectedRooms || [],
  );
  const [selectedMarket, setSelectedMarket] = useState<string[]>(
    initialFilters.selectedMarket || [],
  );
  const [selectedBuildingTypes, setSelectedBuildingTypes] = useState<string[]>(
    initialFilters.selectedBuildingTypes || [],
  );
  const [selectedFurniture, setSelectedFurniture] = useState<string[]>(
    initialFilters.selectedFurniture || [],
  );

  const debouncedSearch = useDebounce(searchQuery, 300);

  const applyingUrlRef = useRef(false);

  useEffect(() => {
    applyingUrlRef.current = true;
    const next = readCatalogFiltersFromSearchParams(searchParams);
    setDealType(next.dealType);
    setSelectedTypes(next.selectedTypes);
    setDistrict(next.district);
    setPropertyClass(next.propertyClass);
    setCondition(next.condition);
    setSort(normalizeCatalogSortKey(next.sort));
    setSearchQuery(next.searchQuery);
    setSeller(next.seller);
    setAgencyId(next.agencyId);
    setPriceMin(next.priceMin);
    setPriceMax(next.priceMax);
    setAreaMin(next.areaMin);
    setAreaMax(next.areaMax);
    setCeilingMin(next.ceilingMin);
    setParkingOnly(next.parkingOnly);
    setSelectedLayouts(next.selectedLayouts);
    setSelectedLandUses(next.selectedLandUses || []);
    setSelectedRooms(next.selectedRooms || []);
    setSelectedMarket(next.selectedMarket || []);
    setSelectedBuildingTypes(next.selectedBuildingTypes || []);
    setSelectedFurniture(next.selectedFurniture || []);
  }, [searchParams]);

  // Seed category pages (квартиры и т.п.) once when URL has no types
  useEffect(() => {
    if (initialTypesSeededRef.current) return;
    if (!initialTypes?.length) {
      initialTypesSeededRef.current = true;
      return;
    }
    if (searchParams.has("types")) {
      initialTypesSeededRef.current = true;
      return;
    }
    initialTypesSeededRef.current = true;
    setSelectedTypes(initialTypes);
  }, [initialTypes, searchParams]);

  const conditions = useMemo(() => {
    if (isResidential) return ["Все", ...RESIDENTIAL_CONDITIONS];
    return [
      "Все",
      ...Array.from(
        new Set(properties.map((p) => p.condition).filter(Boolean) as string[]),
      ),
    ];
  }, [properties, isResidential]);
  // Виды использования только по земельным объектам — фильтр доступен лишь для типа «Земля».
  const landUses = useMemo(
    () =>
      Array.from(
        new Set(
          properties.flatMap((p) => {
            if (!isAnyLand(p)) return [];
            const landUse = getLandUse(p);
            return landUse ? [landUse] : [];
          }),
        ),
      ),
    [properties],
  );

  // Sync filters → URL (не перезаписывать, если адрес уже совпадает — иначе цикл Аренда↔Продажа)
  useEffect(() => {
    if (applyingUrlRef.current) {
      applyingUrlRef.current = false;
      return;
    }
    const next = serializeCatalogSearchParams({
      dealType,
      selectedTypes,
      selectedRooms,
      selectedMarket,
      selectedBuildingTypes,
      selectedFurniture,
      district,
      propertyClass,
      condition,
      sort,
      searchQuery: debouncedSearch,
      priceMin,
      priceMax,
      areaMin,
      areaMax,
      ceilingMin,
      parkingOnly,
      selectedLayouts,
      selectedLandUses,
      seller,
      agencyId,
    });
    if (next === searchParams.toString()) return;
    setSearchParams(next, { replace: true });
  }, [
    dealType,
    selectedTypes,
    district,
    propertyClass,
    condition,
    sort,
    debouncedSearch,
    priceMin,
    priceMax,
    areaMin,
    areaMax,
    ceilingMin,
    parkingOnly,
    selectedLayouts,
    selectedLandUses,
    selectedRooms,
    selectedMarket,
    selectedBuildingTypes,
    selectedFurniture,
    seller,
    agencyId,
    searchParams,
    setSearchParams,
  ]);

  useEffect(() => {
    if (
      !debouncedSearch &&
      selectedTypes.length === 0 &&
      district === "Все" &&
      dealType === "Все"
    ) {
      return;
    }
    trackSearchPreference({
      query: debouncedSearch,
      types: selectedTypes,
      district,
      dealType,
      segment,
    });
  }, [debouncedSearch, selectedTypes, district, dealType, segment]);

  const toggleType = (t: string) => {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );
  };
  const toggleLandUse = (value: string) => {
    setSelectedLandUses((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value],
    );
  };
  const toggleRoom = (room: string) => {
    setSelectedRooms((prev) =>
      prev.includes(room) ? prev.filter((x) => x !== room) : [...prev, room],
    );
  };
  const toggleMarket = (value: string) => {
    setSelectedMarket((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value],
    );
  };
  const toggleBuildingType = (value: string) => {
    setSelectedBuildingTypes((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value],
    );
  };
  const toggleFurniture = (value: string) => {
    setSelectedFurniture((prev) =>
      prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value],
    );
  };

  const selectSeller = (value: ListingSellerFilter) => {
    setSeller(value);
    if (value !== "agency") setAgencyId("");
  };

  const isPriceFiltered = priceMin > 0 || priceMax < PRICE_MAX_DEFAULT;
  const isAreaFiltered = areaMin > 0 || areaMax < AREA_MAX_DEFAULT;

  const activeFiltersCount = [
    dealType !== "Все",
    selectedTypes.length > 0,
    district !== "Все",
    propertyClass !== "Все",
    condition !== "Все",
    isPriceFiltered,
    isAreaFiltered,
    debouncedSearch,
    ceilingMin > 0,
    parkingOnly,
    selectedLayouts.length > 0,
    selectedLandUses.length > 0,
    selectedRooms.length > 0,
    selectedMarket.length > 0,
    selectedBuildingTypes.length > 0,
    selectedFurniture.length > 0,
    seller !== "Все",
    !!agencyId,
  ].filter(Boolean).length;

  const resetFilters = () => {
    setDealType("Все");
    setSelectedTypes([]);
    setDistrict("Все");
    setPropertyClass("Все");
    setCondition("Все");
    setPriceMin(0);
    setPriceMax(PRICE_MAX_DEFAULT);
    setAreaMin(0);
    setAreaMax(AREA_MAX_DEFAULT);
    setSearchQuery("");
    setCeilingMin(0);
    setParkingOnly(false);
    setSelectedLayouts([]);
    setSelectedLandUses([]);
    setSelectedRooms([]);
    setSelectedMarket([]);
    setSelectedBuildingTypes([]);
    setSelectedFurniture([]);
    setSeller("Все");
    setAgencyId("");
  };

  const filtered = useMemo(() => {
    let result = [...properties];
    result = result.filter((p) => propertyMatchesSegment(p, segment));
    if (debouncedSearch) {
      const ranked = new Set(rankPropertyIdsByQuery(result, debouncedSearch));
      result = result.filter((p) => ranked.has(p.id));
    }
    if (dealType !== "Все")
      result = result.filter((p) => p.deal_type === dealType);
    if (selectedTypes.length > 0)
      result = result.filter((p) => propertyMatchesTypes(p, selectedTypes));
    if (!isLand && selectedRooms.length > 0) {
      result = result.filter((p) => {
        const rooms = getResidentialRooms(p);
        return rooms ? selectedRooms.includes(rooms) : false;
      });
    }
    if (!isLand && selectedMarket.length > 0) {
      result = result.filter((p) => {
        const market = getResidentialMarket(p);
        return market ? selectedMarket.includes(market) : false;
      });
    }
    if (!isLand && selectedBuildingTypes.length > 0) {
      result = result.filter((p) => {
        const buildingType = getResidentialBuildingType(p);
        return matchesBuildingTypeFilter(buildingType, selectedBuildingTypes);
      });
    }
    if (!isLand && selectedFurniture.length > 0) {
      result = result.filter((p) => {
        const furniture = getResidentialFurniture(p);
        return furniture ? selectedFurniture.includes(furniture) : false;
      });
    }
    if (district !== "Все")
      result = result.filter((p) =>
        matchLocationFilter(p.district, district),
      );
    result = result.filter((p) =>
      listingMatchesSellerFilter(p, seller, agencyId || null),
    );
    if (isCommercial && propertyClass !== "Все")
      result = result.filter((p) => p.class === propertyClass);
    if (!isLand && condition !== "Все")
      result = result.filter((p) => p.condition === condition);
    if (isPriceFiltered) {
      if (priceMin > 0)
        result = result.filter(
          (p) => Number(p.price) >= priceMin || Number(p.price) === 0,
        );
      if (priceMax < PRICE_MAX_DEFAULT)
        result = result.filter(
          (p) => Number(p.price) <= priceMax || Number(p.price) === 0,
        );
    }
    if (areaMin > 0) result = result.filter((p) => Number(p.area) >= areaMin);
    if (areaMax < AREA_MAX_DEFAULT)
      result = result.filter((p) => Number(p.area) <= areaMax);
    if (isCommercial && ceilingMin > 0)
      result = result.filter((p) => Number(p.ceiling_height) >= ceilingMin);
    if (isCommercial && parkingOnly)
      result = result.filter(
        (p) => p.parking && p.parking !== "Нет" && p.parking !== "-",
      );
    if (isLand && selectedLandUses.length > 0) {
      result = result.filter((p) => {
        const landUse = getLandUse(p);
        return landUse ? selectedLandUses.includes(landUse) : false;
      });
    }

    return sortCatalogProperties(result, sort, {
      searchQuery: debouncedSearch,
    });
  }, [
    properties,
    dealType,
    selectedTypes,
    selectedRooms,
    selectedMarket,
    selectedBuildingTypes,
    selectedFurniture,
    district,
    propertyClass,
    condition,
    priceMin,
    priceMax,
    areaMin,
    areaMax,
    sort,
    debouncedSearch,
    ceilingMin,
    parkingOnly,
    selectedLandUses,
    isPriceFiltered,
    segment,
    isLand,
    isCommercial,
    seller,
    agencyId,
  ]);

  const landUseFilterOptions = Array.from(
    new Set([...LAND_USE_OPTIONS, ...landUses]),
  );

  const handleMapMarkerClick = useCallback((id: string) => {
    setHighlightedId(id);
    cardRefs.current.get(id)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, []);

  const showResultsSidebar = viewMode === "grid" || viewMode === "list";

  const filterSummary = useMemo(() => {
    const parts: string[] = [];
    parts.push(`segment=${segment}`);
    if (dealType !== "Все") parts.push(`deal=${dealType}`);
    if (selectedTypes.length) parts.push(`types=${selectedTypes.join(",")}`);
    if (district !== "Все") parts.push(`district=${district}`);
    if (debouncedSearch) parts.push(`q=${debouncedSearch}`);
    if (isPriceFiltered) parts.push(`price=${priceMin}-${priceMax}`);
    if (areaMin > 0 || areaMax < AREA_MAX_DEFAULT)
      parts.push(`area=${areaMin}-${areaMax}`);
    return parts.join("; ") || "без фильтров";
  }, [
    segment,
    dealType,
    selectedTypes,
    district,
    debouncedSearch,
    isPriceFiltered,
    priceMin,
    priceMax,
    areaMin,
    areaMax,
  ]);

  const filtersSidebarProps = {
    dealType,
    dealOptions,
    onDealType: setDealType,
    types: TYPES,
    selectedTypes,
    onToggleType: toggleType,
    onSetTypes: setSelectedTypes,
    district,
    onOpenLocation: () => setLocationPickerOpen(true),
    priceMin,
    priceMax,
    onPriceMin: setPriceMin,
    onPriceMax: setPriceMax,
    areaMin,
    areaMax,
    onAreaMin: setAreaMin,
    onAreaMax: setAreaMax,
    seller,
    onSeller: selectSeller,
    sellerOptions: SELLER_OPTIONS,
    searchQuery,
    onSearchQuery: setSearchQuery,
    isResidential,
    isCommercial,
    isLand,
    selectedRooms,
    onToggleRoom: toggleRoom,
    selectedMarket,
    onToggleMarket: toggleMarket,
    selectedBuildingTypes,
    onToggleBuildingType: toggleBuildingType,
    selectedFurniture,
    onToggleFurniture: toggleFurniture,
    propertyClass,
    classOptions: CLASSES,
    onPropertyClass: setPropertyClass,
    condition,
    conditionOptions: conditions,
    onCondition: setCondition,
    ceilingMin,
    onCeilingMin: setCeilingMin,
    parkingOnly,
    onParkingOnly: setParkingOnly,
    landUseOptions: landUseFilterOptions,
    selectedLandUses,
    onToggleLandUse: toggleLandUse,
    activeFiltersCount,
    onReset: resetFilters,
  } as const;

  // Сетка: объекты + динамические промо (размещение / партнёры) на 4-й и 8-й позициях
  const catalogPromos = useMemo(() => getCatalogPromos(segment), [segment]);

  const gridItems = useMemo(() => {
    const items: React.ReactNode[] = [];
    const promoSlots = new Map<number, number>([
      [3, 0],
      [7, 1],
    ]);
    let horizontalBannerInserted = false;

    filtered.forEach((p, i) => {
      const slot = promoSlots.get(i);
      if (slot !== undefined) {
        const promo = pickCatalogPromo(catalogPromos, slot);
        items.push(
          <FadeIn key={`promo-${promo.id}-${slot}`} delay={0.18} className="h-full">
            <CatalogPromoBanner promo={promo} />
          </FadeIn>,
        );
      }
      items.push(
        <FadeIn key={p.id} delay={(i % 4) * 0.06} className="h-full">
          <PropertyGridCard property={p} />
        </FadeIn>,
      );

      for (const hSlot of getHorizontalBannersAfterPropertyIndex(segment, i)) {
        horizontalBannerInserted = true;
        items.push(
          <FadeIn
            key={`hbanner-${hSlot.id}`}
            delay={0.12}
            className="col-span-full"
          >
            <CatalogHorizontalBanner banner={hSlot.banner} />
          </FadeIn>,
        );
      }
    });

    if (filtered.length > 0 && filtered.length <= 3) {
      const promo = pickCatalogPromo(catalogPromos, 0);
      items.push(
        <FadeIn key={`promo-${promo.id}-tail`} className="h-full">
          <CatalogPromoBanner promo={promo} />
        </FadeIn>,
      );
    }

    for (const hSlot of getHorizontalBannerFallbackSlots(
      segment,
      filtered.length,
      horizontalBannerInserted,
    )) {
      items.push(
        <FadeIn key={`hbanner-${hSlot.id}-tail`} className="col-span-full">
          <CatalogHorizontalBanner banner={hSlot.banner} />
        </FadeIn>,
      );
    }

    return items;
  }, [filtered, catalogPromos, segment]);

  const listItems = useMemo(() => {
    const items: React.ReactNode[] = [];
    let horizontalBannerInserted = false;

    filtered.forEach((p, i) => {
      items.push(
        <FadeIn key={p.id}>
          <CatalogListCard
            ref={(el) => {
              if (el) cardRefs.current.set(p.id, el);
              else cardRefs.current.delete(p.id);
            }}
            property={p}
            highlighted={highlightedId === p.id}
            onHoverStart={() => setHighlightedId(p.id)}
            onHoverEnd={() =>
              setHighlightedId((cur) => (cur === p.id ? null : cur))
            }
          />
        </FadeIn>,
      );

      for (const hSlot of getHorizontalBannersAfterPropertyIndex(segment, i)) {
        horizontalBannerInserted = true;
        items.push(
          <FadeIn key={`hbanner-${hSlot.id}`}>
            <CatalogHorizontalBanner banner={hSlot.banner} />
          </FadeIn>,
        );
      }
    });

    for (const hSlot of getHorizontalBannerFallbackSlots(
      segment,
      filtered.length,
      horizontalBannerInserted,
    )) {
      items.push(
        <FadeIn key={`hbanner-${hSlot.id}-tail`}>
          <CatalogHorizontalBanner banner={hSlot.banner} />
        </FadeIn>,
      );
    }

    return items;
  }, [filtered, highlightedId, segment]);

  const catalogPath = isLand
    ? "/zemlya/catalog"
    : isResidential
      ? "/zhilaya/catalog"
      : "/catalog";
  const catalogFiltered = catalogHasFilterQuery(searchParams);

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      <SeoHead
        title={
          isLand
            ? "Каталог земли и участков"
            : isResidential
              ? "Каталог жилой недвижимости"
              : "Каталог коммерческой недвижимости"
        }
        description={
          isLand
            ? "Земля и участки в Иркутске: ИЖС, жилая и коммерческая. Фильтры по типу, цене и площади."
            : isResidential
              ? "Квартиры, дома и комнаты в Иркутске и области. Фильтры по комнатам, цене, площади и району."
              : "Офисы, торговые площади, склады и производство в Иркутске и области. Фильтры по цене, площади и району."
        }
        url={absoluteUrl(catalogPath)}
        noindex={catalogFiltered}
      />
      <SiteHeader contextSegment={segment} />

      <div className="pt-[100px] flex-1 flex flex-col">
        {showSuggestions && !isLand && (
          <SegmentSuggestionTiles
            title="Предложения"
            items={
              isResidential
                ? getResidentialSuggestions()
                : getCommercialSuggestions(TYPES)
            }
            isItemActive={(item) =>
              suggestionIsActive(item, {
                types: selectedTypes,
                deal: dealType,
                market: selectedMarket,
              })
            }
            onSelect={(item) => {
              if (item.id === "plots") {
                window.location.assign(item.href);
                return;
              }
              const f = item.filter;
              if (!f) return;
              setSelectedTypes(f.types ?? []);
              if (f.deal) setDealType(f.deal);
              if (f.market !== undefined) setSelectedMarket(f.market);
            }}
          />
        )}

        {/* Slim toolbar: filters (mobile), count, alert, sort, view */}
        <div className="sticky top-[100px] z-30 bg-background border-b border-border/40 overflow-x-hidden">
          <div className="px-3 sm:px-4 lg:px-8 py-2.5 sm:py-3 flex flex-wrap items-center gap-x-2 gap-y-2 min-w-0">
            <button
              type="button"
              onClick={() => setMobileFilters(true)}
              className="inline-flex lg:hidden items-center gap-1.5 h-8 px-2.5 rounded border border-border bg-card text-xs font-medium text-foreground shrink-0"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Фильтры
              {activeFiltersCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-bold rounded-sm bg-primary text-primary-foreground">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
              {isLoading ? (
                "…"
              ) : (
                <>
                  <span className="hidden xs:inline sm:inline">Найдено </span>
                  <strong className="text-foreground font-semibold">
                    {filtered.length}
                  </strong>
                </>
              )}
            </span>

            <div className="flex-1 min-w-0 basis-2 sm:basis-auto" />

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto max-w-full min-w-0">
              <CatalogSearchAlertButton
                onClick={() => setSearchAlertOpen(true)}
              />

              <FilterDropdown
                label="Сортировка"
                valueLabel={
                  SORT_OPTIONS.find((o) => o.value === sort)?.label
                }
                active={sort !== "default"}
                panelWidth={280}
                align="right"
              >
                {(close) => (
                  <div className="space-y-0.5 py-0.5 max-h-[min(60vh,20rem)] overflow-y-auto">
                    {SORT_OPTIONS.map((o) => (
                      <OptionRow
                        key={o.value}
                        label={o.label}
                        selected={sort === o.value}
                        onClick={() => {
                          setSort(o.value);
                          close();
                        }}
                      />
                    ))}
                  </div>
                )}
              </FilterDropdown>

              <div className="flex items-center h-8 sm:h-9 border border-border rounded-md overflow-hidden shrink-0 bg-card">
                {(
                  [
                    { mode: "grid" as const, icon: LayoutGrid, label: "Сетка" },
                    { mode: "list" as const, icon: List, label: "Список" },
                    { mode: "map" as const, icon: MapIcon, label: "Карта" },
                  ] as const
                ).map(({ mode, icon: Icon, label }, i) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setViewMode(mode)}
                    title={label}
                    aria-label={label}
                    className={`w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center transition-colors ${
                      viewMode === mode
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                    } ${i > 0 ? "border-l border-border/60" : ""}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile filter sheet */}
        {mobileFilters && (
          <div className="fixed inset-0 z-50 bg-background flex flex-col lg:hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 shrink-0">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold">Фильтры</span>
              </div>
              <button
                type="button"
                onClick={() => setMobileFilters(false)}
                aria-label="Закрыть фильтры"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-4">
              <CatalogFiltersSidebar
                {...filtersSidebarProps}
                className="border-0 rounded-none p-0 sm:p-0 bg-transparent"
              />
            </div>
            <div className="shrink-0 border-t border-border/40 px-5 py-3 flex gap-2">
              {activeFiltersCount > 0 && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-md text-xs font-medium text-destructive border border-destructive/20 hover:bg-destructive/5 transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Сбросить
                </button>
              )}
              <button
                type="button"
                onClick={() => setMobileFilters(false)}
                className="flex-1 py-2.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
              >
                Показать {isLoading ? "…" : filtered.length}
              </button>
            </div>
          </div>
        )}

        {/* Results + left filters sidebar */}
        <div className="flex gap-4 xl:gap-5 px-4 lg:px-6 xl:px-8 py-4 flex-1 min-w-0">
          <div className="hidden lg:block w-[220px] xl:w-[240px] shrink-0 self-start">
            <CatalogFiltersSidebar {...filtersSidebarProps} />
          </div>

          <div className="flex-1 min-w-0">
            {viewMode === "map" ? (
              <CatalogMap properties={filtered} />
            ) : (
              <div className="flex gap-4 items-start">
                <div className="flex-1 min-w-0">
                  {isLoading ? (
                    <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <PropertyGridCardSkeleton key={i} />
                      ))}
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="text-center py-20">
                      <div className="w-14 h-14 bg-muted flex items-center justify-center mx-auto mb-4 rounded-lg">
                        <PhBuildings
                          className="w-7 h-7 text-muted-foreground"
                          weight="duotone"
                        />
                      </div>
                      <h3 className="font-display text-base font-semibold mb-1">
                        Объекты не найдены
                      </h3>
                      <p className="text-xs text-muted-foreground mb-4">
                        Попробуйте изменить параметры фильтрации
                      </p>
                      <button
                        type="button"
                        onClick={resetFilters}
                        className="text-xs text-primary font-medium hover:underline"
                      >
                        Сбросить фильтры
                      </button>
                    </div>
                  ) : viewMode === "grid" ? (
                    <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3">
                      {gridItems}
                    </div>
                  ) : (
                    <div className="space-y-1.5 sm:space-y-2">{listItems}</div>
                  )}
                </div>

                {showResultsSidebar && !isLoading && filtered.length > 0 && (
                  <CatalogResultsSidebar
                    properties={filtered}
                    highlightedId={highlightedId}
                    onHighlight={setHighlightedId}
                    onMarkerClick={handleMapMarkerClick}
                    onDistrictSelect={(d) => setDistrict(d)}
                    onNotifyClick={() => setSearchAlertOpen(true)}
                    className="sticky top-[116px]"
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {viewMode !== "map" && <CtaBanner segment={segment} />}
      </div>

      <nav
        aria-label="Разделы каталога"
        className="container mx-auto px-4 lg:px-8 py-8 border-t border-border/40"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Смотрите также
        </p>
        <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {(isResidential
            ? [
                { to: "/zhilaya/kvartiry", label: "Квартиры" },
                { to: "/zhilaya/doma", label: "Дома" },
                { to: "/zhilaya/komnaty", label: "Комнаты" },
                { to: "/zhilaya/uchastki", label: "Участки" },
                { to: "/catalog", label: "Коммерция" },
                { to: "/rieltory", label: "Риелторы" },
              ]
            : isLand
              ? [
                  { to: "/zemlya", label: "Земля" },
                  { to: "/zhilaya/uchastki", label: "Участки (жильё)" },
                  { to: "/catalog", label: "Коммерция" },
                  { to: "/zhilaya/catalog", label: "Жильё" },
                ]
              : [
                  { to: "/offices", label: "Офисы" },
                  { to: "/retail", label: "Торговля" },
                  { to: "/warehouses", label: "Склады" },
                  { to: "/zemlya/catalog", label: "Земля" },
                  { to: "/zhilaya/catalog", label: "Жильё" },
                  { to: "/rieltory", label: "Риелторы" },
                ]
          ).map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className="text-primary hover:underline underline-offset-2"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <LocationPickerModal
        open={locationPickerOpen}
        onOpenChange={setLocationPickerOpen}
        value={district}
        extraLocations={propertyDistricts}
        onSelect={(location) => {
          setDistrict(location);
        }}
      />
      <SiteFooter />
      <PropertyAIChat showFab={false} />
      <CatalogSearchAlertDialog
        open={searchAlertOpen}
        onOpenChange={setSearchAlertOpen}
        filterSummary={filterSummary}
        resultsCount={filtered.length}
        segment={segment}
        filters={{
          segment,
          deal_type: dealType,
          district,
          market: selectedMarket,
          propertyTypes: selectedTypes,
          price_min: isPriceFiltered ? priceMin : null,
          price_max: isPriceFiltered ? priceMax : null,
          area_min: isAreaFiltered ? areaMin : null,
          area_max: isAreaFiltered ? areaMax : null,
        }}
      />
    </div>
  );
}
