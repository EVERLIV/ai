import { Buildings as PhBuildings } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  LayoutGrid,
  List,
  Map as MapIcon,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ctaRentOutBg from "@/assets/cta-rent-out.jpg";
import CatalogListCard from "@/components/catalog/CatalogListCard";
import CatalogResultsSidebar from "@/components/catalog/CatalogResultsSidebar";
import CatalogSearchAlertDialog, {
  CatalogSearchAlertButton,
} from "@/components/catalog/CatalogSearchAlertDialog";
import CatalogMap from "@/components/CatalogMap";
import CatalogPromoBanner, {
  getCatalogPromos,
  pickCatalogPromo,
} from "@/components/CatalogPromoBanner";
import PropertyGridCard, {
  PropertyGridCardSkeleton,
} from "@/components/PropertyGridCard";
import SeoHead from "@/components/SeoHead";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { Checkbox } from "@/components/ui/checkbox";
import type { PropertySegment } from "@/config/propertySegments";
import {
  COMMERCIAL_PROPERTY_TYPES,
  RESIDENTIAL_PROPERTY_TYPES,
} from "@/config/propertySegments";
import { absoluteUrl } from "@/config/site";
import { useVerifiedAgencies } from "@/hooks/useAgency";
import { useProperties } from "@/hooks/useProperties";
import { readCatalogFiltersFromSearchParams } from "@/lib/catalogLinks";
import { listPropertyPath } from "@/lib/listPropertyLinks";
import {
  type ListingSellerFilter,
  listingMatchesSellerFilter,
} from "@/lib/listingSource";
import {
  getLandUse,
  isAnyLand,
  isLandProperty,
  LAND_TYPE_LABEL,
  LAND_USE_OPTIONS,
} from "@/lib/propertyLand";
import {
  BUILDING_TYPES,
  FURNITURE_OPTIONS,
  MARKET_OPTIONS,
  RESIDENTIAL_CONDITIONS,
  ROOMS_OPTIONS,
} from "@/lib/propertyOptions";
import {
  getResidentialBuildingType,
  getResidentialFurniture,
  getResidentialMarket,
  getResidentialRooms,
} from "@/lib/propertyResidential";
import {
  getPropertySegment,
  getPropertyTypes,
  propertyMatchesSegment,
  propertyMatchesTypes,
} from "@/lib/propertyTypes";

const DEALS = ["Все", "Аренда", "Продажа"];
const RESIDENTIAL_DEALS = ["Все", "Аренда", "Продажа", "Посуточно"];
const SELLER_OPTIONS: { value: ListingSellerFilter; label: string }[] = [
  { value: "Все", label: "Все" },
  { value: "owner", label: "Собственник" },
  { value: "agency", label: "Агентство" },
];
const CLASSES = ["Все", "A", "A+", "B+", "B", "C"];
const PRICE_MAX_DEFAULT = 50000000;
const AREA_MAX_DEFAULT = 300000;
const SORT_OPTIONS = [
  { label: "Сначала новые", value: "date" },
  { label: "Цена ↑", value: "price_asc" },
  { label: "Цена ↓", value: "price_desc" },
  { label: "Площадь ↑", value: "area_asc" },
  { label: "Площадь ↓", value: "area_desc" },
];
const CEILING_OPTIONS = [
  { label: "от 3 м", value: 3 },
  { label: "от 4 м", value: 4 },
  { label: "от 5 м", value: 5 },
];

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
}: {
  label: string;
  valueLabel?: string;
  active?: boolean;
  children: React.ReactNode | ((close: () => void) => React.ReactNode);
  panelWidth?: number;
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
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-md border text-xs font-medium transition-colors whitespace-nowrap ${
          active
            ? "border-primary/60 text-primary bg-primary/5"
            : "border-border bg-card text-foreground hover:border-foreground/30"
        }`}
      >
        <span>{active && valueLabel ? valueLabel : label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""} ${active ? "text-primary" : "text-muted-foreground"}`}
        />
      </button>
      {open && (
        <div
          className="absolute left-0 top-[calc(100%+6px)] z-40 rounded-lg border border-border bg-card shadow-lg p-3"
          style={{ width: panelWidth }}
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
      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs transition-colors ${
        selected
          ? "bg-primary/10 text-primary font-semibold"
          : "text-foreground hover:bg-muted"
      }`}
    >
      <span className="truncate">{label}</span>
      {selected && <Check className="w-3.5 h-3.5 shrink-0" />}
    </button>
  );
}

// ─── от / до numeric inputs ───
function RangeInputs({
  min,
  max,
  step,
  valueMin,
  valueMax,
  onChangeMin,
  onChangeMax,
  suffix,
}: {
  min: number;
  max: number;
  step: number;
  valueMin: number;
  valueMax: number;
  onChangeMin: (v: number) => void;
  onChangeMax: (v: number) => void;
  suffix?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <input
          type="number"
          min={min}
          max={valueMax}
          step={step}
          value={valueMin || ""}
          placeholder="от"
          onChange={(e) => {
            const v = Number(e.target.value);
            onChangeMin(Math.min(v, valueMax));
          }}
          className="w-full px-2.5 py-2 pr-7 text-xs border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary rounded-md"
        />
        {suffix && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
      <span className="text-muted-foreground text-xs shrink-0">—</span>
      <div className="relative flex-1">
        <input
          type="number"
          min={valueMin}
          max={max}
          step={step}
          value={valueMax >= max ? "" : valueMax}
          placeholder="до"
          onChange={(e) => {
            const v =
              e.target.value === ""
                ? max
                : Math.max(Number(e.target.value), valueMin);
            onChangeMax(v);
          }}
          className="w-full px-2.5 py-2 pr-7 text-xs border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary rounded-md"
        />
        {suffix && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">
            {suffix}
          </span>
        )}
      </div>
    </div>
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
  const listHref = listPropertyPath(segment, "management");
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
              Сдайте объект за 14 дней
            </h2>
            <p className="text-xs text-white/60 leading-relaxed max-w-sm">
              Создадим эффективную презентацию, качественный показ и быстрый
              выход на сделку с проверенными арендаторами.
            </p>
          </div>
          <ul className="space-y-2">
            {[
              "Выведем объект на рынок за 14 дней",
              "Проверенные арендаторы",
              "Сопровождение сделки под ключ",
              "Юридическая чистота договора",
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
            className="justify-self-start md:justify-self-end inline-flex items-center h-11 px-6 rounded-md bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
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
}

export default function Catalog({ segment = "commercial" }: CatalogProps) {
  const isResidential = segment === "residential";
  const TYPES = isResidential
    ? [...RESIDENTIAL_PROPERTY_TYPES]
    : [...COMMERCIAL_PROPERTY_TYPES];
  const dealOptions = isResidential ? RESIDENTIAL_DEALS : DEALS;
  const { data: properties = [], isLoading } = useProperties({ segment });
  const { data: verifiedAgencies = [] } = useVerifiedAgencies();
  const [searchParams, setSearchParams] = useSearchParams();

  const initialFilters = readCatalogFiltersFromSearchParams(searchParams);

  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid");
  const [mobileFilters, setMobileFilters] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [searchAlertOpen, setSearchAlertOpen] = useState(false);
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map());

  const [dealType, setDealType] = useState(initialFilters.dealType);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    initialFilters.selectedTypes,
  );
  const [district, setDistrict] = useState(initialFilters.district);
  const [propertyClass, setPropertyClass] = useState(
    initialFilters.propertyClass,
  );
  const [condition, setCondition] = useState(initialFilters.condition);
  const [sort, setSort] = useState(initialFilters.sort);
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

  const selectedAgencyName = useMemo(
    () => verifiedAgencies.find((a) => a.id === agencyId)?.name || "",
    [verifiedAgencies, agencyId],
  );

  useEffect(() => {
    const next = readCatalogFiltersFromSearchParams(searchParams);
    setDealType(next.dealType);
    setSelectedTypes(next.selectedTypes);
    setDistrict(next.district);
    setPropertyClass(next.propertyClass);
    setCondition(next.condition);
    setSort(next.sort);
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
    setSelectedRooms(next.selectedRooms || []);
    setSelectedMarket(next.selectedMarket || []);
    setSelectedBuildingTypes(next.selectedBuildingTypes || []);
    setSelectedFurniture(next.selectedFurniture || []);
  }, [searchParams]);

  const districts = useMemo(
    () => [
      "Все",
      ...Array.from(new Set(properties.map((p) => p.district).filter(Boolean))),
    ],
    [properties],
  );
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

  // Sync filters → URL
  useEffect(() => {
    const params: Record<string, string> = {};
    if (dealType !== "Все") params.deal = dealType;
    if (selectedTypes.length > 0) params.types = selectedTypes.join(",");
    if (district !== "Все") params.district = district;
    if (propertyClass !== "Все") params.cls = propertyClass;
    if (condition !== "Все") params.cond = condition;
    if (sort !== "date") params.sort = sort;
    if (debouncedSearch) params.q = debouncedSearch;
    if (priceMin > 0) params.priceMin = String(priceMin);
    if (priceMax < PRICE_MAX_DEFAULT) params.priceMax = String(priceMax);
    if (areaMin > 0) params.areaMin = String(areaMin);
    if (areaMax < AREA_MAX_DEFAULT) params.areaMax = String(areaMax);
    if (ceilingMin > 0) params.ceil = String(ceilingMin);
    if (parkingOnly) params.parking = "1";
    if (selectedLayouts.length > 0) params.layouts = selectedLayouts.join(",");
    if (selectedRooms.length > 0) params.rooms = selectedRooms.join(",");
    if (selectedMarket.length > 0) params.market = selectedMarket.join(",");
    if (selectedBuildingTypes.length > 0)
      params.bld = selectedBuildingTypes.join(",");
    if (selectedFurniture.length > 0)
      params.furniture = selectedFurniture.join(",");
    if (seller !== "Все") params.seller = seller;
    if (agencyId) params.agency = agencyId;
    setSearchParams(params, { replace: true });
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
    selectedRooms,
    selectedMarket,
    selectedBuildingTypes,
    selectedFurniture,
    seller,
    agencyId,
    setSearchParams,
  ]);

  const toggleType = (t: string) => {
    setSelectedTypes((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );
  };
  const toggleLayout = (l: string) => {
    setSelectedLayouts((prev) =>
      prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l],
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

  const selectAgency = (id: string) => {
    setAgencyId(id);
    if (id) setSeller("agency");
  };

  const isPriceFiltered = priceMin > 0 || priceMax < PRICE_MAX_DEFAULT;
  const isAreaFiltered = areaMin > 0 || areaMax < AREA_MAX_DEFAULT;
  const moreActive =
    propertyClass !== "Все" ||
    condition !== "Все" ||
    ceilingMin > 0 ||
    parkingOnly ||
    selectedLayouts.length > 0 ||
    selectedRooms.length > 0 ||
    selectedMarket.length > 0 ||
    selectedBuildingTypes.length > 0 ||
    selectedFurniture.length > 0 ||
    seller !== "Все" ||
    !!agencyId;

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
    if (isResidential) {
      // Коммерческая «Земля» — только в разделе участков, не в общем списке жилья
      const landFilterActive =
        selectedTypes.length > 0 &&
        selectedTypes.some((t) => t === "Участок" || t === "Земля");
      if (!landFilterActive) {
        result = result.filter((p) => getPropertySegment(p) === "residential");
      }
    }
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (p) =>
          p.address.toLowerCase().includes(q) ||
          p.district.toLowerCase().includes(q) ||
          getPropertyTypes(p).some((t) => t.toLowerCase().includes(q)) ||
          (p.description || "").toLowerCase().includes(q),
      );
    }
    if (dealType !== "Все")
      result = result.filter((p) => p.deal_type === dealType);
    if (selectedTypes.length > 0)
      result = result.filter((p) => propertyMatchesTypes(p, selectedTypes));
    if (selectedRooms.length > 0) {
      result = result.filter((p) => {
        const rooms = getResidentialRooms(p);
        return rooms ? selectedRooms.includes(rooms) : false;
      });
    }
    if (selectedMarket.length > 0) {
      result = result.filter((p) => {
        const market = getResidentialMarket(p);
        return market ? selectedMarket.includes(market) : false;
      });
    }
    if (selectedBuildingTypes.length > 0) {
      result = result.filter((p) => {
        const buildingType = getResidentialBuildingType(p);
        return buildingType
          ? selectedBuildingTypes.includes(buildingType)
          : false;
      });
    }
    if (selectedFurniture.length > 0) {
      result = result.filter((p) => {
        const furniture = getResidentialFurniture(p);
        return furniture ? selectedFurniture.includes(furniture) : false;
      });
    }
    if (district !== "Все")
      result = result.filter((p) => p.district === district);
    result = result.filter((p) =>
      listingMatchesSellerFilter(p, seller, agencyId || null),
    );
    if (!isResidential && propertyClass !== "Все")
      result = result.filter((p) => p.class === propertyClass);
    if (condition !== "Все")
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
    if (!isResidential && ceilingMin > 0)
      result = result.filter(
        (p) => isLandProperty(p) || Number(p.ceiling_height) >= ceilingMin,
      );
    if (!isResidential && parkingOnly)
      result = result.filter(
        (p) =>
          isLandProperty(p) ||
          (p.parking && p.parking !== "Нет" && p.parking !== "-"),
      );
    if (!isResidential && selectedLayouts.length > 0)
      result = result.filter((p) => {
        if (!isAnyLand(p)) return false;
        const landUse = getLandUse(p);
        return landUse ? selectedLayouts.includes(landUse) : false;
      });

    switch (sort) {
      case "price_asc":
        result.sort((a, b) => Number(a.price) - Number(b.price));
        break;
      case "price_desc":
        result.sort((a, b) => Number(b.price) - Number(a.price));
        break;
      case "area_asc":
        result.sort((a, b) => Number(a.area) - Number(b.area));
        break;
      case "area_desc":
        result.sort((a, b) => Number(b.area) - Number(a.area));
        break;
    }
    return result;
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
    selectedLayouts,
    isPriceFiltered,
    segment,
    isResidential,
    seller,
    agencyId,
  ]);

  const landTypeFilterOnly =
    selectedTypes.length > 0 &&
    selectedTypes.every((t) => t === "Земля" || t === "Участок");
  const layoutFilterOptions = landTypeFilterOnly
    ? Array.from(new Set([...LAND_USE_OPTIONS, ...landUses]))
    : [];

  // Фильтр по виду использования доступен только для земли — иначе сбрасываем,
  // чтобы скрытый фильтр не отсекал объекты незаметно для пользователя.
  useEffect(() => {
    if (!landTypeFilterOnly && selectedLayouts.length > 0)
      setSelectedLayouts([]);
  }, [landTypeFilterOnly, selectedLayouts.length]);

  const priceLabel = isPriceFiltered
    ? `${priceMin > 0 ? `от ${priceMin.toLocaleString("ru-RU")}` : ""}${priceMax < PRICE_MAX_DEFAULT ? ` до ${priceMax.toLocaleString("ru-RU")}` : ""} ₽`.trim()
    : undefined;

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

  const handleMapMarkerClick = useCallback((id: string) => {
    setHighlightedId(id);
    cardRefs.current.get(id)?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, []);

  const showResultsSidebar = viewMode === "grid" || viewMode === "list";
  const areaLabel = isAreaFiltered
    ? `${areaMin > 0 ? `от ${areaMin}` : ""}${areaMax < AREA_MAX_DEFAULT ? ` до ${areaMax}` : ""} м²`.trim()
    : undefined;

  // «Ещё фильтры» — общие поля (используются и в дропдауне, и в мобильной панели)
  const moreFilterFields = (
    <div className="space-y-4">
      <div>
        {isResidential && (
          <div className="mb-4">
            <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
              Комнаты
            </p>
            <div className="flex flex-wrap gap-1.5">
              {ROOMS_OPTIONS.map((room) => (
                <button
                  key={room}
                  onClick={() => toggleRoom(room)}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                    selectedRooms.includes(room)
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-foreground/30 bg-background"
                  }`}
                >
                  {room}
                </button>
              ))}
            </div>
          </div>
        )}
        {isResidential && (
          <>
            <div className="mb-4">
              <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
                Рынок
              </p>
              <div className="flex flex-wrap gap-1.5">
                {MARKET_OPTIONS.map((item) => (
                  <button
                    key={item}
                    onClick={() => toggleMarket(item)}
                    className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                      selectedMarket.includes(item)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-foreground/30 bg-background"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
                Тип дома
              </p>
              <div className="flex flex-wrap gap-1.5">
                {BUILDING_TYPES.map((item) => (
                  <button
                    key={item}
                    onClick={() => toggleBuildingType(item)}
                    className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                      selectedBuildingTypes.includes(item)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-foreground/30 bg-background"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
            <div className="mb-4">
              <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
                Мебель
              </p>
              <div className="flex flex-wrap gap-1.5">
                {FURNITURE_OPTIONS.map((item) => (
                  <button
                    key={item}
                    onClick={() => toggleFurniture(item)}
                    className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                      selectedFurniture.includes(item)
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border text-muted-foreground hover:border-foreground/30 bg-background"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
      {!isResidential && (
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
            Класс
          </p>
          <div className="flex flex-wrap gap-1.5">
            {CLASSES.map((c) => (
              <button
                key={c}
                onClick={() => setPropertyClass(c)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                  propertyClass === c
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-foreground/30 bg-background"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      )}
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
          Состояние
        </p>
        <div className="flex flex-wrap gap-1.5">
          {conditions.map((c) => (
            <button
              key={c}
              onClick={() => setCondition(c)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                condition === c
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-foreground/30 bg-background"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      {!isResidential && (
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
            Высота потолков
          </p>
          <div className="flex flex-wrap gap-1.5">
            {CEILING_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() =>
                  setCeilingMin(ceilingMin === opt.value ? 0 : opt.value)
                }
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                  ceilingMin === opt.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border text-muted-foreground hover:border-foreground/30 bg-background"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      )}
      {!isResidential && (
        <label className="flex items-center gap-2.5 cursor-pointer select-none rounded-md border border-border px-3 py-2.5 hover:bg-muted/40 transition-colors">
          <Checkbox
            checked={parkingOnly}
            onCheckedChange={(v) => setParkingOnly(!!v)}
            className="shrink-0"
          />
          <span className="text-xs text-foreground">Есть парковка</span>
        </label>
      )}
      {!isResidential &&
        landTypeFilterOnly &&
        layoutFilterOptions.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
              {LAND_TYPE_LABEL}
            </p>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {layoutFilterOptions.map((l) => (
                <label
                  key={l}
                  className="flex items-start gap-2.5 cursor-pointer select-none rounded-md px-2 py-1.5 hover:bg-muted/40 transition-colors min-w-0"
                >
                  <Checkbox
                    checked={selectedLayouts.includes(l)}
                    onCheckedChange={() => toggleLayout(l)}
                    className="shrink-0 mt-0.5"
                  />
                  <span className="text-xs leading-snug text-foreground break-words min-w-0">
                    {l}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
    </div>
  );

  // Сетка: объекты + динамические промо (размещение / партнёры) на 4-й и 8-й позициях
  const catalogPromos = useMemo(() => getCatalogPromos(segment), [segment]);

  const gridItems = useMemo(() => {
    const items: React.ReactNode[] = [];
    const promoSlots = new Map<number, number>([
      [3, 0],
      [7, 1],
    ]);

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
    });

    if (filtered.length > 0 && filtered.length <= 3) {
      const promo = pickCatalogPromo(catalogPromos, 0);
      items.push(
        <FadeIn key={`promo-${promo.id}-tail`} className="h-full">
          <CatalogPromoBanner promo={promo} />
        </FadeIn>,
      );
    }
    return items;
  }, [filtered, catalogPromos]);

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      <SeoHead
        title={
          isResidential
            ? "Каталог жилой недвижимости"
            : "Каталог коммерческой недвижимости"
        }
        description={
          isResidential
            ? "Квартиры, дома и комнаты в Иркутске и области. Фильтры по комнатам, цене, площади и району."
            : "Офисы, торговые площади, склады и земля в Иркутске и области. Фильтры по цене, площади и району."
        }
        url={absoluteUrl(isResidential ? "/zhilaya/catalog" : "/catalog")}
      />
      <SiteHeader />

      <div className="pt-[100px] flex-1 flex flex-col">
        {/* Горизонтальная панель фильтров (Variant 2) */}
        <div className="sticky top-[100px] z-30 bg-background border-b border-border/40">
          <div className="px-6 lg:px-12 xl:px-20 py-3 hidden lg:flex items-center gap-2 flex-wrap">
            <FilterDropdown
              label="Тип сделки"
              valueLabel={dealType}
              active={dealType !== "Все"}
              panelWidth={200}
            >
              {(close) => (
                <div className="space-y-0.5">
                  {dealOptions.map((d) => (
                    <OptionRow
                      key={d}
                      label={d}
                      selected={dealType === d}
                      onClick={() => {
                        setDealType(d);
                        close();
                      }}
                    />
                  ))}
                </div>
              )}
            </FilterDropdown>

            <FilterDropdown
              label="Тип объекта"
              valueLabel={
                selectedTypes.length > 0 ? selectedTypes.join(", ") : undefined
              }
              active={selectedTypes.length > 0}
              panelWidth={220}
            >
              <div className="space-y-0.5">
                {TYPES.map((t) => (
                  <OptionRow
                    key={t}
                    label={t}
                    selected={selectedTypes.includes(t)}
                    onClick={() => toggleType(t)}
                  />
                ))}
              </div>
            </FilterDropdown>

            <FilterDropdown
              label="Район"
              valueLabel={district}
              active={district !== "Все"}
              panelWidth={220}
            >
              {(close) => (
                <div className="space-y-0.5 max-h-64 overflow-y-auto">
                  {districts.map((d) => (
                    <OptionRow
                      key={d}
                      label={d}
                      selected={district === d}
                      onClick={() => {
                        setDistrict(d);
                        close();
                      }}
                    />
                  ))}
                </div>
              )}
            </FilterDropdown>

            <FilterDropdown
              label="Кто сдаёт"
              valueLabel={
                agencyId && selectedAgencyName
                  ? selectedAgencyName
                  : seller === "owner"
                    ? "Собственник"
                    : seller === "agency"
                      ? "Агентство"
                      : undefined
              }
              active={seller !== "Все" || !!agencyId}
              panelWidth={280}
            >
              {(close) => (
                <div className="space-y-3">
                  <div className="space-y-0.5">
                    {SELLER_OPTIONS.map((o) => (
                      <OptionRow
                        key={o.value}
                        label={o.label}
                        selected={seller === o.value && !agencyId}
                        onClick={() => {
                          selectSeller(o.value);
                          close();
                        }}
                      />
                    ))}
                  </div>
                  {verifiedAgencies.length > 0 && (
                    <div className="border-t border-border/60 pt-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground px-2 mb-1">
                        Верифицированные агентства
                      </p>
                      <div className="space-y-0.5 max-h-48 overflow-y-auto">
                        <OptionRow
                          label="Все агентства"
                          selected={seller === "agency" && !agencyId}
                          onClick={() => {
                            selectSeller("agency");
                            close();
                          }}
                        />
                        {verifiedAgencies.map((a) => (
                          <OptionRow
                            key={a.id}
                            label={a.name}
                            selected={agencyId === a.id}
                            onClick={() => {
                              selectAgency(a.id);
                              close();
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </FilterDropdown>

            <FilterDropdown
              label="Цена, ₽"
              valueLabel={priceLabel}
              active={isPriceFiltered}
              panelWidth={280}
            >
              <RangeInputs
                min={0}
                max={PRICE_MAX_DEFAULT}
                step={50000}
                valueMin={priceMin}
                valueMax={priceMax}
                onChangeMin={setPriceMin}
                onChangeMax={setPriceMax}
                suffix="₽"
              />
            </FilterDropdown>

            <FilterDropdown
              label="Площадь, м²"
              valueLabel={areaLabel}
              active={isAreaFiltered}
              panelWidth={260}
            >
              <RangeInputs
                min={0}
                max={AREA_MAX_DEFAULT}
                step={100}
                valueMin={areaMin}
                valueMax={areaMax}
                onChangeMin={setAreaMin}
                onChangeMax={setAreaMax}
                suffix="м²"
              />
            </FilterDropdown>

            <FilterDropdown
              label="Ещё фильтры"
              active={moreActive}
              panelWidth={320}
            >
              {moreFilterFields}
            </FilterDropdown>

            {/* Поиск */}
            <div
              className={`flex items-center h-9 rounded-md border transition-all ${searchOpen || searchQuery ? "border-border bg-card pl-3 pr-2 w-56" : "border-transparent w-9"}`}
            >
              <button
                type="button"
                aria-label="Поиск"
                onClick={() => setSearchOpen(true)}
                className={`shrink-0 ${searchOpen || searchQuery ? "text-muted-foreground" : "w-9 h-9 flex items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:border-foreground/30"}`}
              >
                <Search className="w-3.5 h-3.5" />
              </button>
              {(searchOpen || searchQuery) && (
                <>
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onBlur={() => {
                      if (!searchQuery) setSearchOpen(false);
                    }}
                    placeholder="Адрес, район..."
                    className="flex-1 min-w-0 px-2 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      aria-label="Очистить поиск"
                      className="shrink-0 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </>
              )}
            </div>

            {activeFiltersCount > 0 && (
              <button
                onClick={resetFilters}
                className="text-xs text-muted-foreground hover:text-primary transition-colors shrink-0"
              >
                Сбросить
              </button>
            )}

            <div className="flex-1" />

            <span className="text-xs text-muted-foreground shrink-0">
              {isLoading ? (
                "…"
              ) : (
                <>
                  Найдено{" "}
                  <strong className="text-foreground font-semibold tabular-nums">
                    {filtered.length}
                  </strong>
                </>
              )}
            </span>

            <CatalogSearchAlertButton onClick={() => setSearchAlertOpen(true)} />

            <FilterDropdown
              label="Сортировка"
              valueLabel={SORT_OPTIONS.find((o) => o.value === sort)?.label}
              active={sort !== "date"}
              panelWidth={200}
            >
              {(close) => (
                <div className="space-y-0.5">
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

            <div className="flex items-center h-9 border border-border rounded-md overflow-hidden shrink-0 bg-card">
              {[
                { mode: "grid" as const, icon: LayoutGrid, label: "Сетка" },
                { mode: "list" as const, icon: List, label: "Список" },
                { mode: "map" as const, icon: MapIcon, label: "Карта" },
              ].map(({ mode, icon: Icon, label }, i) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  title={label}
                  aria-label={label}
                  className={`w-9 h-9 flex items-center justify-center transition-colors ${
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

          {/* Мобильная строка фильтров */}
          <div className="px-6 py-3 flex lg:hidden items-center gap-3">
            <button
              onClick={() => setMobileFilters(true)}
              className="inline-flex items-center gap-2 h-9 px-3.5 rounded-md border border-border bg-card text-xs font-medium text-foreground"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Фильтры
              {activeFiltersCount > 0 && (
                <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-bold rounded-sm bg-primary text-primary-foreground">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            <div className="text-xs text-muted-foreground">
              {isLoading ? (
                "…"
              ) : (
                <>
                  <strong className="text-foreground font-semibold">
                    {filtered.length}
                  </strong>{" "}
                  объектов
                </>
              )}
            </div>
            <div className="flex-1" />
            <div className="flex items-center h-9 border border-border rounded-md overflow-hidden shrink-0 bg-card">
              {[
                { mode: "grid" as const, icon: LayoutGrid, label: "Сетка" },
                { mode: "list" as const, icon: List, label: "Список" },
                { mode: "map" as const, icon: MapIcon, label: "Карта" },
              ].map(({ mode, icon: Icon, label }, i) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  title={label}
                  aria-label={label}
                  className={`w-9 h-9 flex items-center justify-center transition-colors ${
                    viewMode === mode
                      ? "bg-foreground text-background"
                      : "text-muted-foreground"
                  } ${i > 0 ? "border-l border-border/60" : ""}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Мобильная панель фильтров */}
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
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
                  Тип сделки
                </p>
                <div className="flex rounded-md bg-muted/50 p-1 gap-0.5">
                  {dealOptions.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDealType(d)}
                      className={`flex-1 py-2 rounded text-xs font-medium transition-all ${
                        dealType === d
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
                  Тип объекта
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() => toggleType(t)}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                        selectedTypes.includes(t)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground bg-background"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
                  Район
                </p>
                <div className="relative rounded-md border border-border">
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    aria-label="Район"
                    className="w-full appearance-none px-3 py-2 pr-8 bg-transparent text-xs text-foreground focus:outline-none cursor-pointer"
                  >
                    {districts.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
                  Кто сдаёт
                </p>
                <div className="flex rounded-md bg-muted/50 p-1 gap-0.5 mb-2">
                  {SELLER_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => selectSeller(o.value)}
                      className={`flex-1 py-2 rounded text-xs font-medium transition-all ${
                        seller === o.value && !agencyId
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
                {verifiedAgencies.length > 0 && (
                  <div className="relative rounded-md border border-border">
                    <select
                      value={agencyId}
                      onChange={(e) => {
                        const id = e.target.value;
                        if (id) selectAgency(id);
                        else if (seller === "agency") selectSeller("agency");
                        else selectSeller("Все");
                      }}
                      aria-label="Агентство"
                      className="w-full appearance-none px-3 py-2 pr-8 bg-transparent text-xs text-foreground focus:outline-none cursor-pointer"
                    >
                      <option value="">
                        {seller === "agency"
                          ? "Все верифицированные агентства"
                          : "Выберите агентство"}
                      </option>
                      {verifiedAgencies.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                  </div>
                )}
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
                  Цена, ₽
                </p>
                <RangeInputs
                  min={0}
                  max={PRICE_MAX_DEFAULT}
                  step={50000}
                  valueMin={priceMin}
                  valueMax={priceMax}
                  onChangeMin={setPriceMin}
                  onChangeMax={setPriceMax}
                  suffix="₽"
                />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
                  Площадь, м²
                </p>
                <RangeInputs
                  min={0}
                  max={AREA_MAX_DEFAULT}
                  step={100}
                  valueMin={areaMin}
                  valueMax={areaMax}
                  onChangeMin={setAreaMin}
                  onChangeMax={setAreaMax}
                  suffix="м²"
                />
              </div>
              {moreFilterFields}
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">
                  Сортировка
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {SORT_OPTIONS.map((o) => (
                    <button
                      key={o.value}
                      onClick={() => setSort(o.value)}
                      className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                        sort === o.value
                          ? "bg-foreground text-background border-foreground"
                          : "border-border text-muted-foreground bg-background"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="shrink-0 border-t border-border/40 px-5 py-3 flex gap-2">
              {activeFiltersCount > 0 && (
                <button
                  onClick={resetFilters}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-md text-xs font-medium text-destructive border border-destructive/20 hover:bg-destructive/5 transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> Сбросить
                </button>
              )}
              <button
                onClick={() => setMobileFilters(false)}
                className="flex-1 py-2.5 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
              >
                Показать {isLoading ? "…" : filtered.length}
              </button>
            </div>
          </div>
        )}

        {/* Результаты */}
        <div className="flex-1 min-w-0">
          {viewMode === "map" ? (
            <CatalogMap properties={filtered} />
          ) : (
            <div className="px-6 lg:px-12 xl:px-20 py-6">
              <div className="flex gap-8 items-start">
                <div className="flex-1 min-w-0">
                  {isLoading ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
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
                        onClick={resetFilters}
                        className="text-xs text-primary font-medium hover:underline"
                      >
                        Сбросить фильтры
                      </button>
                    </div>
                  ) : viewMode === "grid" ? (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                      {gridItems}
                    </div>
                  ) : (
                    <div className="space-y-0">
                      {filtered.map((p) => (
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
                              setHighlightedId((cur) =>
                                cur === p.id ? null : cur,
                              )
                            }
                          />
                        </FadeIn>
                      ))}
                    </div>
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
                  />
                )}
              </div>
            </div>
          )}
        </div>

        {viewMode !== "map" && <CtaBanner segment={segment} />}
      </div>

      <SiteFooter />
      <CatalogSearchAlertDialog
        open={searchAlertOpen}
        onOpenChange={setSearchAlertOpen}
        filterSummary={filterSummary}
        resultsCount={filtered.length}
      />
    </div>
  );
}
