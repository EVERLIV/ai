import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useProperties, type DbProperty } from "@/hooks/useProperties";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { Checkbox } from "@/components/ui/checkbox";
import {
  SlidersHorizontal, X, ChevronDown, MapPin, LayoutGrid, List,
  Search, Map as MapIcon, Check, Eye,
} from "lucide-react";
import { Buildings as PhBuildings } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import CatalogMap from "@/components/CatalogMap";
import PropertyImage from "@/components/PropertyImage";
import PKKMapModal from "@/components/PKKMapModal";
import { getLandCadastral, getLandUse, isLandProperty, LAND_TYPE_LABEL, LAND_USE_OPTIONS } from "@/lib/propertyLand";

const TYPES = ["Офис", "Торговая", "Склад", "Земля", "Производство"];
const DEALS = ["Все", "Аренда", "Продажа"];
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
function FilterDropdown({ label, valueLabel, active, children, panelWidth = 260 }: {
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
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
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
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? "rotate-180" : ""} ${active ? "text-primary" : "text-muted-foreground"}`} />
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
function OptionRow({ label, selected, onClick }: { label: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs transition-colors ${
        selected ? "bg-primary/10 text-primary font-semibold" : "text-foreground hover:bg-muted"
      }`}
    >
      <span className="truncate">{label}</span>
      {selected && <Check className="w-3.5 h-3.5 shrink-0" />}
    </button>
  );
}

// ─── от / до numeric inputs ───
function RangeInputs({ min, max, step, valueMin, valueMax, onChangeMin, onChangeMax, suffix }: {
  min: number; max: number; step: number;
  valueMin: number; valueMax: number;
  onChangeMin: (v: number) => void; onChangeMax: (v: number) => void;
  suffix?: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <input
          type="number" min={min} max={valueMax} step={step}
          value={valueMin || ""}
          placeholder="от"
          onChange={(e) => { const v = Number(e.target.value); onChangeMin(Math.min(v, valueMax)); }}
          className="w-full px-2.5 py-2 pr-7 text-xs border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary rounded-md"
        />
        {suffix && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">{suffix}</span>}
      </div>
      <span className="text-muted-foreground text-xs shrink-0">—</span>
      <div className="relative flex-1">
        <input
          type="number" min={valueMin} max={max} step={step}
          value={valueMax >= max ? "" : valueMax}
          placeholder="до"
          onChange={(e) => { const v = e.target.value === "" ? max : Math.max(Number(e.target.value), valueMin); onChangeMax(v); }}
          className="w-full px-2.5 py-2 pr-7 text-xs border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary rounded-md"
        />
        {suffix && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground pointer-events-none">{suffix}</span>}
      </div>
    </div>
  );
}

// ─── Fade-in при появлении в вьюпорте ───
function FadeIn({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
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

// ─── Формат цены под макет: "6 300 000 ₽" / "400 000 ₽/мес" ───
function formatPrice(p: DbProperty): string | null {
  const price = Number(p.price);
  if (!price) return null;
  return `${price.toLocaleString("ru-RU")} ₽${p.deal_type === "Аренда" ? "/мес" : ""}`;
}

// ─── Карточка объекта (Variant 2) ───
function GridCard({ property: p, onOpenPKK }: { property: DbProperty; onOpenPKK: (cad: string) => void }) {
  const land = isLandProperty(p.type);
  const landUse = getLandUse(p);
  const cadastral = getLandCadastral(p.extras as Record<string, unknown> | null);
  const price = formatPrice(p);
  const description = p.description?.slice(0, 200) || "";

  return (
    <Link
      to={`/property/${p.id}`}
      className="group flex flex-col h-full bg-card border border-border/60 rounded-lg overflow-hidden hover:shadow-lg hover:border-border transition-all duration-200"
    >
      <div className="relative h-44 bg-muted overflow-hidden">
        <PropertyImage src={p.cover_photo} alt={p.address} imgClassName="transition-transform duration-500 group-hover:scale-[1.04]" />
        {/* Бейдж типа сделки */}
        <div className="absolute top-2.5 left-2.5 inline-block px-2 py-1 rounded-md bg-primary/90 text-primary-foreground text-[10px] font-bold">
          {p.deal_type || "Аренда"}
        </div>
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1 px-2 py-0.5 rounded bg-black/50 backdrop-blur text-[10px] text-white">
          <Eye className="w-3 h-3" /> {p.views_count || 0}
        </div>
        {/* Красная плашка цены поверх нижнего края фото */}
        <div className="absolute bottom-0 left-0">
          <span className="inline-block bg-primary text-primary-foreground text-sm font-bold px-3 py-1.5 leading-none">
            {price ?? "Цена по запросу"}
          </span>
        </div>
      </div>

      <div className="flex flex-col flex-1 p-4">
        <h3 className="text-sm font-bold text-foreground leading-snug mb-2 group-hover:text-primary transition-colors">
          {p.address}
        </h3>
        {description && (
          <p className="text-[10px] text-muted-foreground mb-3 leading-relaxed line-clamp-3">
            {description}
          </p>
        )}

        <div className="grid grid-cols-3 gap-2 pb-3">
          <div className="min-w-0">
            <p className="text-[10px] text-muted-foreground mb-0.5">Площадь</p>
            <p className="text-xs font-semibold text-foreground truncate">{p.area} м²</p>
          </div>
          {land ? (
            <div className="col-span-2 min-w-0">
              <p className="text-[10px] text-muted-foreground mb-0.5">{LAND_TYPE_LABEL}</p>
              <p className="text-xs font-semibold text-foreground truncate">{landUse || "—"}</p>
            </div>
          ) : (
            <>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground mb-0.5">Этаж</p>
                <p className="text-xs font-semibold text-foreground truncate">
                  {p.floor && p.floor !== "-" ? `${p.floor}${p.total_floors ? `/${p.total_floors}` : ""}` : "—"}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-[10px] text-muted-foreground mb-0.5">Потолок</p>
                <p className="text-xs font-semibold text-foreground truncate">
                  {p.ceiling_height && Number(p.ceiling_height) > 0 ? `${p.ceiling_height} м` : "—"}
                </p>
              </div>
            </>
          )}
        </div>

        <div className="mt-auto pt-3 space-y-2">
          <p className="text-[10px] text-muted-foreground">
            <Link to="/about" className="text-primary hover:underline">Аренда сити</Link>
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-primary group-hover:underline underline-offset-4">Подробнее</span>
            {land && cadastral ? (
              <button
                onClick={(e) => { e.preventDefault(); onOpenPKK(cadastral); }}
                className="text-[10px] text-muted-foreground hover:text-primary transition-colors"
              >
                к/н {cadastral}
              </button>
            ) : (
              <span className="text-[10px] text-muted-foreground">{p.district}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Тёмная промо-карточка в сетке ───
function PromoCard() {
  return (
    <div className="relative flex flex-col h-full bg-[#141414] text-white rounded-lg overflow-hidden p-5 min-h-[320px]">
      <span className="absolute top-0 left-0 w-16 h-16 bg-primary [clip-path:polygon(0_0,100%_0,0_100%)]" aria-hidden />
      <p className="relative text-[10px] font-bold tracking-[0.2em] text-primary uppercase mt-6 mb-3">Сдайте объект</p>
      <h3 className="relative font-display text-xl font-bold leading-tight mb-3">Разместите объект за 0 ₽</h3>
      <p className="relative text-xs text-white/60 leading-relaxed mb-4">
        Профессиональная фотосъёмка, экспертная оценка и продвижение вашей коммерческой недвижимости.
      </p>
      <Link
        to="/list-property"
        className="relative mt-auto inline-flex items-center justify-center h-10 px-4 rounded-md bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors"
      >
        Узнать подробнее
      </Link>
    </div>
  );
}

// ─── Нижний CTA-баннер «Сдайте объект за 14 дней» ───
function CtaBanner() {
  return (
    <div className="px-6 lg:px-12 xl:px-20 pb-10">
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-xl bg-[#141414] text-white">
        <span
          className="absolute right-0 top-0 h-full w-56 hidden md:block"
          style={{ background: "repeating-linear-gradient(115deg, hsl(var(--primary)) 0 28px, transparent 28px 72px)" }}
          aria-hidden
        />
        <div className="relative grid md:grid-cols-[1.2fr_1fr_auto] gap-6 items-center px-6 md:px-10 py-8">
          <div>
            <h2 className="font-display text-xl md:text-2xl font-bold mb-2">Сдайте объект за 14 дней</h2>
            <p className="text-xs text-white/50 leading-relaxed max-w-sm">
              Создадим эффективную презентацию, качественный показ и быстрый выход на сделку с проверенными арендаторами.
            </p>
          </div>
          <ul className="space-y-2">
            {["Выведем объект на рынок за 14 дней", "Проверенные арендаторы", "Сопровождение сделки под ключ", "Юридическая чистота договора"].map((t) => (
              <li key={t} className="flex items-start gap-2 text-xs text-white/80">
                <Check className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                {t}
              </li>
            ))}
          </ul>
          <Link
            to="/list-property"
            className="justify-self-start md:justify-self-end inline-flex items-center h-11 px-6 rounded-md bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-colors"
          >
            Разместить объект
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Main Catalog ───
export default function Catalog() {
  const { data: properties = [], isLoading } = useProperties();
  const [searchParams, setSearchParams] = useSearchParams();

  const [viewMode, setViewMode] = useState<"grid" | "list" | "map">("grid");
  const [mobileFilters, setMobileFilters] = useState(false);
  const [activePKK, setActivePKK] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const [dealType, setDealType] = useState(() => searchParams.get("deal") || "Все");
  const [selectedTypes, setSelectedTypes] = useState<string[]>(() => {
    const t = searchParams.get("types");
    return t ? t.split(",").filter(Boolean) : [];
  });
  const [district, setDistrict] = useState(() => searchParams.get("district") || "Все");
  const [propertyClass, setPropertyClass] = useState(() => searchParams.get("cls") || "Все");
  const [condition, setCondition] = useState(() => searchParams.get("cond") || "Все");
  const [sort, setSort] = useState(() => searchParams.get("sort") || "date");
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("q") || "");

  const [priceMin, setPriceMin] = useState(() => Number(searchParams.get("priceMin") || 0));
  const [priceMax, setPriceMax] = useState(() => Number(searchParams.get("priceMax") || PRICE_MAX_DEFAULT));
  const [areaMin, setAreaMin] = useState(() => Number(searchParams.get("areaMin") || 0));
  const [areaMax, setAreaMax] = useState(() => Number(searchParams.get("areaMax") || AREA_MAX_DEFAULT));

  const [ceilingMin, setCeilingMin] = useState(() => Number(searchParams.get("ceil") || 0));
  const [parkingOnly, setParkingOnly] = useState(() => searchParams.get("parking") === "1");
  const [selectedLayouts, setSelectedLayouts] = useState<string[]>(() => {
    const l = searchParams.get("layouts");
    return l ? l.split(",").filter(Boolean) : [];
  });

  const debouncedSearch = useDebounce(searchQuery, 300);

  const districts = useMemo(() => ["Все", ...Array.from(new Set(properties.map((p) => p.district).filter(Boolean)))], [properties]);
  const conditions = useMemo(() => ["Все", ...Array.from(new Set(properties.map((p) => p.condition).filter(Boolean) as string[]))], [properties]);
  // Виды использования только по земельным объектам — фильтр доступен лишь для типа «Земля».
  const landUses = useMemo(() => Array.from(new Set(
    properties.flatMap((p) => {
      if (!isLandProperty(p.type)) return [];
      const landUse = getLandUse(p);
      return landUse ? [landUse] : [];
    })
  )), [properties]);

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
    setSearchParams(params, { replace: true });
  }, [dealType, selectedTypes, district, propertyClass, condition, sort, debouncedSearch, priceMin, priceMax, areaMin, areaMax, ceilingMin, parkingOnly, selectedLayouts]);

  const toggleType = (t: string) => {
    setSelectedTypes((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  };
  const toggleLayout = (l: string) => {
    setSelectedLayouts((prev) => prev.includes(l) ? prev.filter((x) => x !== l) : [...prev, l]);
  };

  const isPriceFiltered = priceMin > 0 || priceMax < PRICE_MAX_DEFAULT;
  const isAreaFiltered = areaMin > 0 || areaMax < AREA_MAX_DEFAULT;
  const moreActive = propertyClass !== "Все" || condition !== "Все" || ceilingMin > 0 || parkingOnly || selectedLayouts.length > 0;

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
  ].filter(Boolean).length;

  const resetFilters = () => {
    setDealType("Все"); setSelectedTypes([]); setDistrict("Все");
    setPropertyClass("Все"); setCondition("Все");
    setPriceMin(0); setPriceMax(PRICE_MAX_DEFAULT); setAreaMin(0); setAreaMax(AREA_MAX_DEFAULT);
    setSearchQuery(""); setCeilingMin(0); setParkingOnly(false); setSelectedLayouts([]);
  };

  const filtered = useMemo(() => {
    let result = [...properties];
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter((p) =>
        p.address.toLowerCase().includes(q) ||
        p.district.toLowerCase().includes(q) ||
        p.type.toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q)
      );
    }
    if (dealType !== "Все") result = result.filter((p) => p.deal_type === dealType);
    if (selectedTypes.length > 0) result = result.filter((p) => selectedTypes.includes(p.type));
    if (district !== "Все") result = result.filter((p) => p.district === district);
    if (propertyClass !== "Все") result = result.filter((p) => p.class === propertyClass);
    if (condition !== "Все") result = result.filter((p) => p.condition === condition);
    if (isPriceFiltered) {
      if (priceMin > 0) result = result.filter((p) => Number(p.price) >= priceMin || Number(p.price) === 0);
      if (priceMax < PRICE_MAX_DEFAULT) result = result.filter((p) => Number(p.price) <= priceMax || Number(p.price) === 0);
    }
    if (areaMin > 0) result = result.filter((p) => Number(p.area) >= areaMin);
    if (areaMax < AREA_MAX_DEFAULT) result = result.filter((p) => Number(p.area) <= areaMax);
    if (ceilingMin > 0) result = result.filter((p) => isLandProperty(p.type) || Number(p.ceiling_height) >= ceilingMin);
    if (parkingOnly) result = result.filter((p) => isLandProperty(p.type) || (p.parking && p.parking !== "Нет" && p.parking !== "-"));
    if (selectedLayouts.length > 0) result = result.filter((p) => {
      if (!isLandProperty(p.type)) return false;
      const landUse = getLandUse(p);
      return landUse ? selectedLayouts.includes(landUse) : false;
    });

    switch (sort) {
      case "price_asc": result.sort((a, b) => Number(a.price) - Number(b.price)); break;
      case "price_desc": result.sort((a, b) => Number(b.price) - Number(a.price)); break;
      case "area_asc": result.sort((a, b) => Number(a.area) - Number(b.area)); break;
      case "area_desc": result.sort((a, b) => Number(b.area) - Number(a.area)); break;
    }
    return result;
  }, [properties, dealType, selectedTypes, district, propertyClass, condition, priceMin, priceMax, areaMin, areaMax, sort, debouncedSearch, ceilingMin, parkingOnly, selectedLayouts, isPriceFiltered]);

  const landTypeFilterOnly = selectedTypes.length > 0 && selectedTypes.every((t) => t === "Земля");
  const layoutFilterOptions = landTypeFilterOnly
    ? Array.from(new Set([...LAND_USE_OPTIONS, ...landUses]))
    : [];

  // Фильтр по виду использования доступен только для земли — иначе сбрасываем,
  // чтобы скрытый фильтр не отсекал объекты незаметно для пользователя.
  useEffect(() => {
    if (!landTypeFilterOnly && selectedLayouts.length > 0) setSelectedLayouts([]);
  }, [landTypeFilterOnly, selectedLayouts.length]);

  const priceLabel = isPriceFiltered
    ? `${priceMin > 0 ? `от ${priceMin.toLocaleString("ru-RU")}` : ""}${priceMax < PRICE_MAX_DEFAULT ? ` до ${priceMax.toLocaleString("ru-RU")}` : ""} ₽`.trim()
    : undefined;
  const areaLabel = isAreaFiltered
    ? `${areaMin > 0 ? `от ${areaMin}` : ""}${areaMax < AREA_MAX_DEFAULT ? ` до ${areaMax}` : ""} м²`.trim()
    : undefined;

  // «Ещё фильтры» — общие поля (используются и в дропдауне, и в мобильной панели)
  const moreFilterFields = (
    <div className="space-y-4">
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">Класс</p>
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
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">Состояние</p>
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
      <div>
        <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">Высота потолков</p>
        <div className="flex flex-wrap gap-1.5">
          {CEILING_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setCeilingMin(ceilingMin === opt.value ? 0 : opt.value)}
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
      <label className="flex items-center gap-2.5 cursor-pointer select-none rounded-md border border-border px-3 py-2.5 hover:bg-muted/40 transition-colors">
        <Checkbox checked={parkingOnly} onCheckedChange={(v) => setParkingOnly(!!v)} className="shrink-0" />
        <span className="text-xs text-foreground">Есть парковка</span>
      </label>
      {landTypeFilterOnly && layoutFilterOptions.length > 0 && (
        <div>
          <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">{LAND_TYPE_LABEL}</p>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {layoutFilterOptions.map((l) => (
              <label key={l} className="flex items-start gap-2.5 cursor-pointer select-none rounded-md px-2 py-1.5 hover:bg-muted/40 transition-colors min-w-0">
                <Checkbox checked={selectedLayouts.includes(l)} onCheckedChange={() => toggleLayout(l)} className="shrink-0 mt-0.5" />
                <span className="text-xs leading-snug text-foreground break-words min-w-0">{l}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Сетка с промо-карточкой на 4-й позиции (как в макете)
  const gridItems = useMemo(() => {
    const items: React.ReactNode[] = [];
    filtered.forEach((p, i) => {
      if (i === 3) items.push(<FadeIn key="promo" delay={0.18} className="h-full"><PromoCard /></FadeIn>);
      items.push(
        <FadeIn key={p.id} delay={(i % 4) * 0.06} className="h-full">
          <GridCard property={p} onOpenPKK={setActivePKK} />
        </FadeIn>
      );
    });
    if (filtered.length > 0 && filtered.length <= 3) items.push(<FadeIn key="promo" className="h-full"><PromoCard /></FadeIn>);
    return items;
  }, [filtered]);

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      <SiteHeader />

      <div className="pt-[100px] flex-1 flex flex-col">

        {/* Горизонтальная панель фильтров (Variant 2) */}
        <div className="sticky top-[100px] z-30 bg-background border-b border-border/40">
          <div className="px-6 lg:px-12 xl:px-20 py-3 hidden lg:flex items-center gap-2 flex-wrap">
            <FilterDropdown label="Тип сделки" valueLabel={dealType} active={dealType !== "Все"} panelWidth={200}>
              {(close) => (
                <div className="space-y-0.5">
                  {DEALS.map((d) => (
                    <OptionRow key={d} label={d} selected={dealType === d} onClick={() => { setDealType(d); close(); }} />
                  ))}
                </div>
              )}
            </FilterDropdown>

            <FilterDropdown
              label="Тип объекта"
              valueLabel={selectedTypes.length > 0 ? selectedTypes.join(", ") : undefined}
              active={selectedTypes.length > 0}
              panelWidth={220}
            >
              <div className="space-y-0.5">
                {TYPES.map((t) => (
                  <OptionRow key={t} label={t} selected={selectedTypes.includes(t)} onClick={() => toggleType(t)} />
                ))}
              </div>
            </FilterDropdown>

            <FilterDropdown label="Район" valueLabel={district} active={district !== "Все"} panelWidth={220}>
              {(close) => (
                <div className="space-y-0.5 max-h-64 overflow-y-auto">
                  {districts.map((d) => (
                    <OptionRow key={d} label={d} selected={district === d} onClick={() => { setDistrict(d); close(); }} />
                  ))}
                </div>
              )}
            </FilterDropdown>

            <FilterDropdown label="Цена, ₽" valueLabel={priceLabel} active={isPriceFiltered} panelWidth={280}>
              <RangeInputs
                min={0} max={PRICE_MAX_DEFAULT} step={50000}
                valueMin={priceMin} valueMax={priceMax}
                onChangeMin={setPriceMin} onChangeMax={setPriceMax}
                suffix="₽"
              />
            </FilterDropdown>

            <FilterDropdown label="Площадь, м²" valueLabel={areaLabel} active={isAreaFiltered} panelWidth={260}>
              <RangeInputs
                min={0} max={AREA_MAX_DEFAULT} step={100}
                valueMin={areaMin} valueMax={areaMax}
                onChangeMin={setAreaMin} onChangeMax={setAreaMax}
                suffix="м²"
              />
            </FilterDropdown>

            <FilterDropdown label="Ещё фильтры" active={moreActive} panelWidth={320}>
              {moreFilterFields}
            </FilterDropdown>

            {/* Поиск */}
            <div className={`flex items-center h-9 rounded-md border transition-all ${searchOpen || searchQuery ? "border-border bg-card pl-3 pr-2 w-56" : "border-transparent w-9"}`}>
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
                    autoFocus
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onBlur={() => { if (!searchQuery) setSearchOpen(false); }}
                    placeholder="Адрес, район..."
                    className="flex-1 min-w-0 px-2 bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} aria-label="Очистить поиск" className="shrink-0 text-muted-foreground hover:text-foreground">
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
              {isLoading ? "…" : <>Найдено <strong className="text-foreground font-semibold tabular-nums">{filtered.length}</strong></>}
            </span>

            <FilterDropdown
              label="Сортировка"
              valueLabel={SORT_OPTIONS.find((o) => o.value === sort)?.label}
              active={sort !== "date"}
              panelWidth={200}
            >
              {(close) => (
                <div className="space-y-0.5">
                  {SORT_OPTIONS.map((o) => (
                    <OptionRow key={o.value} label={o.label} selected={sort === o.value} onClick={() => { setSort(o.value); close(); }} />
                  ))}
                </div>
              )}
            </FilterDropdown>

            <div className="flex items-center h-9 border border-border rounded-md overflow-hidden shrink-0 bg-card">
              {([
                { mode: "grid" as const, icon: LayoutGrid, label: "Сетка" },
                { mode: "list" as const, icon: List, label: "Список" },
                { mode: "map" as const, icon: MapIcon, label: "Карта" },
              ]).map(({ mode, icon: Icon, label }, i) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  title={label}
                  aria-label={label}
                  className={`w-9 h-9 flex items-center justify-center transition-colors ${
                    viewMode === mode ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
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
                <span className="inline-flex items-center justify-center min-w-[16px] h-4 px-1 text-[9px] font-bold rounded-sm bg-primary text-primary-foreground">{activeFiltersCount}</span>
              )}
            </button>
            <div className="text-xs text-muted-foreground">
              {isLoading ? "…" : <><strong className="text-foreground font-semibold">{filtered.length}</strong> объектов</>}
            </div>
            <div className="flex-1" />
            <div className="flex items-center h-9 border border-border rounded-md overflow-hidden shrink-0 bg-card">
              {([
                { mode: "grid" as const, icon: LayoutGrid, label: "Сетка" },
                { mode: "list" as const, icon: List, label: "Список" },
                { mode: "map" as const, icon: MapIcon, label: "Карта" },
              ]).map(({ mode, icon: Icon, label }, i) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  title={label}
                  aria-label={label}
                  className={`w-9 h-9 flex items-center justify-center transition-colors ${
                    viewMode === mode ? "bg-foreground text-background" : "text-muted-foreground"
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
              <button type="button" onClick={() => setMobileFilters(false)} aria-label="Закрыть фильтры">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">Тип сделки</p>
                <div className="flex rounded-md bg-muted/50 p-1 gap-0.5">
                  {DEALS.map((d) => (
                    <button
                      key={d}
                      onClick={() => setDealType(d)}
                      className={`flex-1 py-2 rounded text-xs font-medium transition-all ${
                        dealType === d ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">Тип объекта</p>
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
                <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">Район</p>
                <div className="relative rounded-md border border-border">
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    aria-label="Район"
                    className="w-full appearance-none px-3 py-2 pr-8 bg-transparent text-xs text-foreground focus:outline-none cursor-pointer"
                  >
                    {districts.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">Цена, ₽</p>
                <RangeInputs min={0} max={PRICE_MAX_DEFAULT} step={50000} valueMin={priceMin} valueMax={priceMax} onChangeMin={setPriceMin} onChangeMax={setPriceMax} suffix="₽" />
              </div>
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">Площадь, м²</p>
                <RangeInputs min={0} max={AREA_MAX_DEFAULT} step={100} valueMin={areaMin} valueMax={areaMax} onChangeMin={setAreaMin} onChangeMax={setAreaMax} suffix="м²" />
              </div>
              {moreFilterFields}
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">Сортировка</p>
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
              {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => <GridCardSkeleton key={i} />)}
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-14 h-14 bg-muted flex items-center justify-center mx-auto mb-4 rounded-lg">
                    <PhBuildings className="w-7 h-7 text-muted-foreground" weight="duotone" />
                  </div>
                  <h3 className="font-display text-base font-semibold mb-1">Объекты не найдены</h3>
                  <p className="text-xs text-muted-foreground mb-4">Попробуйте изменить параметры фильтрации</p>
                  <button onClick={resetFilters} className="text-xs text-primary font-medium hover:underline">Сбросить фильтры</button>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {gridItems}
                </div>
              ) : (
                <div className="space-y-3">
                  {filtered.map((p) => (
                    <FadeIn key={p.id}>
                      <ListCard property={p} onOpenPKK={setActivePKK} />
                    </FadeIn>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {viewMode !== "map" && <CtaBanner />}
      </div>

      <SiteFooter />
      {activePKK && <PKKMapModal cadastralNumber={activePKK} onClose={() => setActivePKK(null)} />}
    </div>
  );
}

// ─── List card ───
function ListCard({ property: p, onOpenPKK }: { property: DbProperty; onOpenPKK: (cad: string) => void }) {
  const land = isLandProperty(p.type);
  const landUse = getLandUse(p);
  const cadastral = getLandCadastral(p.extras as Record<string, unknown> | null);
  const price = formatPrice(p);
  const description = p.description?.slice(0, 250) || "";
  return (
    <Link to={`/property/${p.id}`}
      className="group flex bg-card overflow-hidden hover:shadow-md transition-shadow duration-200 border border-border/60 rounded-lg">
      <div className="relative w-48 shrink-0 bg-muted hidden sm:block overflow-hidden">
        <PropertyImage src={p.cover_photo} alt={p.address} imgClassName="transition-transform duration-500 group-hover:scale-[1.03]" />
        {/* Бейдж типа сделки */}
        <div className="absolute top-2 left-2 inline-block px-2 py-1 rounded-md bg-primary/90 text-primary-foreground text-[10px] font-bold">
          {p.deal_type || "Аренда"}
        </div>
        <div className="absolute bottom-0 left-0">
          <span className="inline-block bg-primary text-primary-foreground text-xs font-bold px-2.5 py-1 leading-none">
            {price ?? "Цена по запросу"}
          </span>
        </div>
      </div>
      <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="font-display text-base font-bold text-foreground group-hover:text-primary transition-colors sm:hidden">
                {price ?? "Цена по запросу"}
              </div>
              <div className="text-sm font-bold text-foreground mb-2">
                {p.address}
              </div>
              <span className="inline-block px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold mb-2 sm:hidden">
                {p.deal_type || "Аренда"}
              </span>
              {description && (
                <p className="text-[10px] text-muted-foreground leading-relaxed line-clamp-2">
                  {description}
                </p>
              )}
            </div>
            <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0"><Eye className="w-3 h-3" />{p.views_count || 0}</span>
          </div>
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-foreground mt-2">
            <span>{p.area} м²</span>
            {land ? (
              <>
                {landUse && <span>{LAND_TYPE_LABEL}: {landUse}</span>}
                {cadastral && (
                  <button onClick={(e) => { e.preventDefault(); onOpenPKK(cadastral); }} className="text-primary hover:underline underline-offset-2">
                    к/н {cadastral}
                  </button>
                )}
              </>
            ) : (
              <>
                {p.floor && p.floor !== "-" && <span>Этаж {p.floor}/{p.total_floors}</span>}
                {p.ceiling_height && Number(p.ceiling_height) > 0 && <span>Потолки {p.ceiling_height} м</span>}
                {p.condition && <span>{p.condition}</span>}
              </>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">
            <Link to="/about" className="text-primary hover:underline">Аренда сити</Link>
          </p>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs font-semibold text-primary group-hover:underline underline-offset-4">Подробнее</span>
          <div className="flex flex-wrap gap-1 justify-end">
            {(p.features || []).slice(0, 3).map((f) => (
              <span key={f} className="px-2 py-0.5 rounded bg-muted text-[10px] text-muted-foreground">{f}</span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ─── Skeleton ───
function GridCardSkeleton() {
  return (
    <div className="bg-card overflow-hidden border border-border/60 rounded-lg">
      <div className="relative h-44 overflow-hidden">
        <Skeleton className="absolute inset-0 rounded-none" />
        <div className="absolute bottom-0 left-0">
          <Skeleton className="h-7 w-28 rounded-none" />
        </div>
      </div>
      <div className="p-4 space-y-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
          <Skeleton className="h-8" />
        </div>
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-14" />
        </div>
      </div>
    </div>
  );
}
