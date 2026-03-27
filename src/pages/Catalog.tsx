import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { properties, Property } from "@/data/properties";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import {
  SlidersHorizontal, X, ChevronDown, MapPin, Maximize2, LayoutGrid, List,
  Building2, Store, Warehouse, TreePine, ArrowUpDown, Eye, Calendar,
} from "lucide-react";

const TYPES = ["Все", "Офис", "Торговая", "Склад", "Земля"];
const DEALS = ["Все", "Аренда", "Продажа"];
const CLASSES = ["Все", "A", "B+", "B", "C"];
const DISTRICTS = ["Все", ...Array.from(new Set(properties.map((p) => p.district)))];
const CONDITIONS = ["Все", ...Array.from(new Set(properties.map((p) => p.condition)))];
const SORT_OPTIONS = [
  { label: "Сначала новые", value: "date" },
  { label: "Цена ↑", value: "price_asc" },
  { label: "Цена ↓", value: "price_desc" },
  { label: "Площадь ↑", value: "area_asc" },
  { label: "Площадь ↓", value: "area_desc" },
];

const typeIcons: Record<string, React.ElementType> = {
  "Офис": Building2, "Торговая": Store, "Склад": Warehouse, "Земля": TreePine,
};

function RangeInput({ label, min, max, onMinChange, onMaxChange, suffix }: {
  label: string; min: string; max: string; onMinChange: (v: string) => void; onMaxChange: (v: string) => void; suffix?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="number" placeholder="от" value={min} onChange={(e) => onMinChange(e.target.value)}
            className="w-full px-3 py-2 pr-8 rounded-lg bg-card text-sm text-foreground border border-border focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {suffix && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span>}
        </div>
        <div className="relative flex-1">
          <input
            type="number" placeholder="до" value={max} onChange={(e) => onMaxChange(e.target.value)}
            className="w-full px-3 py-2 pr-8 rounded-lg bg-card text-sm text-foreground border border-border focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {suffix && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">{suffix}</span>}
        </div>
      </div>
    </div>
  );
}

function SelectFilter({ label, value, options, onChange }: {
  label: string; value: string; options: string[]; onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">{label}</label>
      <div className="relative">
        <select
          value={value} onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none px-3 py-2 pr-8 rounded-lg bg-card text-sm text-foreground border border-border focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
      </div>
    </div>
  );
}

export default function Catalog() {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [dealType, setDealType] = useState("Все");
  const [propertyType, setPropertyType] = useState("Все");
  const [district, setDistrict] = useState("Все");
  const [propertyClass, setPropertyClass] = useState("Все");
  const [condition, setCondition] = useState("Все");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [areaMin, setAreaMin] = useState("");
  const [areaMax, setAreaMax] = useState("");
  const [sort, setSort] = useState("date");

  const activeFiltersCount = [
    dealType !== "Все", propertyType !== "Все", district !== "Все",
    propertyClass !== "Все", condition !== "Все",
    priceMin, priceMax, areaMin, areaMax,
  ].filter(Boolean).length;

  const resetFilters = () => {
    setDealType("Все"); setPropertyType("Все"); setDistrict("Все");
    setPropertyClass("Все"); setCondition("Все");
    setPriceMin(""); setPriceMax(""); setAreaMin(""); setAreaMax("");
  };

  const filtered = useMemo(() => {
    let result = [...properties];
    if (dealType !== "Все") result = result.filter((p) => p.dealType === dealType);
    if (propertyType !== "Все") result = result.filter((p) => p.type === propertyType);
    if (district !== "Все") result = result.filter((p) => p.district === district);
    if (propertyClass !== "Все") result = result.filter((p) => p.class === propertyClass);
    if (condition !== "Все") result = result.filter((p) => p.condition === condition);
    if (priceMin) result = result.filter((p) => p.price >= Number(priceMin));
    if (priceMax) result = result.filter((p) => p.price <= Number(priceMax));
    if (areaMin) result = result.filter((p) => p.area >= Number(areaMin));
    if (areaMax) result = result.filter((p) => p.area <= Number(areaMax));

    switch (sort) {
      case "price_asc": result.sort((a, b) => a.price - b.price); break;
      case "price_desc": result.sort((a, b) => b.price - a.price); break;
      case "area_asc": result.sort((a, b) => a.area - b.area); break;
      case "area_desc": result.sort((a, b) => b.area - a.area); break;
    }
    return result;
  }, [dealType, propertyType, district, propertyClass, condition, priceMin, priceMax, areaMin, areaMax, sort]);

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero banner */}
      <div className="pt-16">
        <div className="bg-gradient-to-br from-primary/8 to-accent/5 border-b border-border">
          <div className="container mx-auto px-4 lg:px-8 py-8 lg:py-12">
            <h1 className="font-display text-3xl lg:text-4xl font-bold text-foreground mb-2">
              Каталог объектов
            </h1>
            <p className="text-muted-foreground">
              Коммерческая недвижимость в Иркутске и области — офисы, торговые площади, склады, земля
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 lg:px-8 py-6">
        {/* Deal type tabs */}
        <div className="flex items-center gap-2 mb-6">
          {DEALS.map((d) => (
            <button
              key={d}
              onClick={() => setDealType(d)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                dealType === d
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-card text-muted-foreground border border-border hover:text-foreground hover:border-foreground/20"
              }`}
            >
              {d}
            </button>
          ))}
          <div className="flex-1" />
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
              filtersOpen ? "bg-primary/5 border-primary/20 text-primary" : "bg-card border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Фильтры
            {activeFiltersCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Filters panel */}
        {filtersOpen && (
          <div className="bg-card rounded-2xl border border-border p-5 mb-6 animate-fade-in-up">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <SelectFilter label="Тип объекта" value={propertyType} options={TYPES} onChange={setPropertyType} />
              <SelectFilter label="Район / Город" value={district} options={DISTRICTS} onChange={setDistrict} />
              <SelectFilter label="Класс" value={propertyClass} options={CLASSES} onChange={setPropertyClass} />
              <SelectFilter label="Состояние" value={condition} options={CONDITIONS} onChange={setCondition} />
              <RangeInput label="Площадь, м²" min={areaMin} max={areaMax} onMinChange={setAreaMin} onMaxChange={setAreaMax} suffix="м²" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mt-4">
              <div className="lg:col-span-2">
                <RangeInput label="Цена, ₽/мес" min={priceMin} max={priceMax} onMinChange={setPriceMin} onMaxChange={setPriceMax} suffix="₽" />
              </div>
              <div className="flex items-end">
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Сбросить всё
                </button>
              </div>
            </div>

            {/* Quick type chips */}
            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
              {TYPES.filter((t) => t !== "Все").map((t) => {
                const Icon = typeIcons[t];
                const active = propertyType === t;
                return (
                  <button
                    key={t}
                    onClick={() => setPropertyType(active ? "Все" : t)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:text-foreground hover:bg-muted/80"
                    }`}
                  >
                    {Icon && <Icon className="w-3.5 h-3.5" />}
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="flex items-center justify-between mb-5">
          <p className="text-sm text-muted-foreground">
            Найдено <span className="font-semibold text-foreground">{filtered.length}</span> объектов
          </p>
          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={sort} onChange={(e) => setSort(e.target.value)}
                className="appearance-none pl-8 pr-6 py-1.5 rounded-lg bg-card text-xs font-medium text-foreground border border-border focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ArrowUpDown className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>
            <div className="flex bg-muted rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-md transition-all ${viewMode === "grid" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-all ${viewMode === "list" ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Building2 className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-display text-lg font-semibold text-foreground mb-2">Объекты не найдены</h3>
            <p className="text-sm text-muted-foreground mb-4">Попробуйте изменить параметры фильтрации</p>
            <button onClick={resetFilters} className="text-sm text-primary font-medium hover:underline">Сбросить фильтры</button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => <GridCard key={p.id} property={p} />)}
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((p) => <ListCard key={p.id} property={p} />)}
          </div>
        )}
      </div>

      <SiteFooter />
    </div>
  );
}

function GridCard({ property: p }: { property: Property }) {
  const Icon = p.icon;
  return (
    <Link
      to={`/property/${p.id}`}
      className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-card-hover transition-all duration-300"
    >
      {/* Image placeholder */}
      <div className="relative h-48 bg-gradient-to-br from-muted to-muted/60">
        <div className="absolute inset-0 flex items-center justify-center">
          <Icon className="w-12 h-12 text-muted-foreground/30" />
        </div>
        <div className="absolute top-3 left-3 flex gap-1.5">
          <span className="px-2 py-0.5 rounded-md bg-primary text-primary-foreground text-[10px] font-semibold uppercase tracking-wide">
            {p.dealType}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-card/90 backdrop-blur text-foreground text-[10px] font-semibold">
            {p.type}
          </span>
          {p.class !== "-" && (
            <span className="px-2 py-0.5 rounded-md bg-accent/90 text-accent-foreground text-[10px] font-semibold">
              Класс {p.class}
            </span>
          )}
        </div>
        <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-md bg-card/80 backdrop-blur text-[10px] text-muted-foreground">
          <Eye className="w-3 h-3" /> {p.views}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="font-display text-lg font-bold text-foreground group-hover:text-primary transition-colors">
              {p.price.toLocaleString("ru-RU")} ₽<span className="text-xs font-normal text-muted-foreground">/мес</span>
            </div>
            <div className="text-xs text-muted-foreground">{p.pricePerM2.toLocaleString("ru-RU")} ₽/м²</div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
          <MapPin className="w-3 h-3 shrink-0" />
          <span className="truncate">{p.address}</span>
        </div>

        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground">
          <span className="flex items-center gap-1">
            <Maximize2 className="w-3 h-3 text-muted-foreground" />
            {p.area} м²
          </span>
          {p.floor !== "-" && (
            <span>Этаж {p.floor}/{p.totalFloors}</span>
          )}
          {p.ceilingHeight > 0 && (
            <span>Потолки {p.ceilingHeight} м</span>
          )}
        </div>

        <div className="flex flex-wrap gap-1 mt-3">
          {p.features.slice(0, 3).map((f) => (
            <span key={f} className="px-2 py-0.5 rounded-md bg-muted text-[10px] text-muted-foreground">{f}</span>
          ))}
          {p.features.length > 3 && (
            <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] text-muted-foreground">+{p.features.length - 3}</span>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {p.publishedDate}</span>
          <span>{p.district}</span>
        </div>
      </div>
    </Link>
  );
}

function ListCard({ property: p }: { property: Property }) {
  const Icon = p.icon;
  return (
    <Link
      to={`/property/${p.id}`}
      className="group flex bg-card rounded-xl border border-border overflow-hidden hover:shadow-card-hover transition-all duration-300"
    >
      {/* Image */}
      <div className="relative w-56 shrink-0 bg-gradient-to-br from-muted to-muted/60 hidden sm:flex items-center justify-center">
        <Icon className="w-10 h-10 text-muted-foreground/30" />
        <div className="absolute top-2 left-2 flex gap-1">
          <span className="px-2 py-0.5 rounded-md bg-primary text-primary-foreground text-[10px] font-semibold uppercase tracking-wide">{p.dealType}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between">
            <div>
              <div className="font-display text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                {p.price.toLocaleString("ru-RU")} ₽<span className="text-xs font-normal text-muted-foreground">/мес</span>
              </div>
              <div className="text-xs text-muted-foreground">{p.pricePerM2.toLocaleString("ru-RU")} ₽/м² · {p.type} {p.class !== "-" ? `класса ${p.class}` : ""}</div>
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{p.views}</span>
              <span>{p.publishedDate}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
            <MapPin className="w-3 h-3 shrink-0" />
            {p.address} · {p.district}
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-foreground mt-2">
            <span>{p.area} м²</span>
            {p.floor !== "-" && <span>Этаж {p.floor}/{p.totalFloors}</span>}
            {p.ceilingHeight > 0 && <span>Потолки {p.ceilingHeight} м</span>}
            <span>{p.condition}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-1 mt-3">
          {p.features.slice(0, 5).map((f) => (
            <span key={f} className="px-2 py-0.5 rounded-md bg-muted text-[10px] text-muted-foreground">{f}</span>
          ))}
          {p.features.length > 5 && (
            <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] text-muted-foreground">+{p.features.length - 5}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
