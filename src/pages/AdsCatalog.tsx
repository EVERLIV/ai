import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { useAdPlacementsWithProperty } from "@/hooks/useAdPlacements";
import {
  AD_TYPES, AD_TYPE_MAP, TRAFFIC_LABELS, TRAFFIC_BADGE,
  AVAILABILITY_LABELS, AVAILABILITY_BADGE,
  type AdTypeKey, type TrafficKey, type AvailabilityKey,
} from "@/lib/adTypes";
import { Skeleton } from "@/components/ui/skeleton";
import { getPropertyCover } from "@/lib/propertyImages";
import {
  MapPin, SlidersHorizontal, X, Maximize2, ChevronDown, Search, Megaphone,
} from "lucide-react";

const TRAFFIC_OPTIONS: { v: TrafficKey | "all"; label: string }[] = [
  { v: "all", label: "Любой" },
  { v: "low", label: "Низкий" },
  { v: "medium", label: "Средний" },
  { v: "high", label: "Высокий" },
];

const AVAILABILITY_OPTIONS: { v: AvailabilityKey | "all"; label: string }[] = [
  { v: "all", label: "Все" },
  { v: "available", label: "Свободно" },
  { v: "reserved", label: "Бронь" },
  { v: "occupied", label: "Занято" },
];

export default function AdsCatalog() {
  const { data: placements = [], isLoading } = useAdPlacementsWithProperty();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<AdTypeKey[]>([]);
  const [district, setDistrict] = useState("Все");
  const [traffic, setTraffic] = useState<TrafficKey | "all">("all");
  const [availability, setAvailability] = useState<AvailabilityKey | "all">("all");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [sort, setSort] = useState<"date" | "price_asc" | "price_desc">("date");

  const districts = useMemo(() => {
    const s = new Set<string>();
    placements.forEach((p) => p.property?.district && s.add(p.property.district));
    return ["Все", ...Array.from(s).sort()];
  }, [placements]);

  const toggleType = (k: AdTypeKey) =>
    setSelectedTypes((prev) =>
      prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]
    );

  const filtered = useMemo(() => {
    let list = [...placements];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((p) =>
        (p.property?.address || "").toLowerCase().includes(q) ||
        (p.property?.district || "").toLowerCase().includes(q) ||
        (p.title || "").toLowerCase().includes(q)
      );
    }
    if (selectedTypes.length > 0)
      list = list.filter((p) => selectedTypes.includes(p.ad_type as AdTypeKey));
    if (district !== "Все")
      list = list.filter((p) => p.property?.district === district);
    if (traffic !== "all") list = list.filter((p) => p.traffic === traffic);
    if (availability !== "all") list = list.filter((p) => p.availability === availability);
    if (priceMin) list = list.filter((p) => Number(p.monthly_price) >= Number(priceMin));
    if (priceMax) list = list.filter((p) => Number(p.monthly_price) <= Number(priceMax));

    switch (sort) {
      case "price_asc": list.sort((a, b) => Number(a.monthly_price) - Number(b.monthly_price)); break;
      case "price_desc": list.sort((a, b) => Number(b.monthly_price) - Number(a.monthly_price)); break;
    }
    return list;
  }, [placements, search, selectedTypes, district, traffic, availability, priceMin, priceMax, sort]);

  const activeCount =
    (search ? 1 : 0) + selectedTypes.length + (district !== "Все" ? 1 : 0) +
    (traffic !== "all" ? 1 : 0) + (availability !== "all" ? 1 : 0) +
    (priceMin ? 1 : 0) + (priceMax ? 1 : 0);

  const reset = () => {
    setSearch(""); setSelectedTypes([]); setDistrict("Все");
    setTraffic("all"); setAvailability("all");
    setPriceMin(""); setPriceMax("");
  };

  const filtersBlock = (
    <div className="space-y-4 p-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Адрес, район, название..."
          className="w-full pl-6 pr-2 py-2 bg-transparent text-xs text-foreground border-0 border-b border-border focus:outline-none focus:border-primary"
        />
      </div>

      {/* Type chips */}
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-2 text-foreground">
          Тип рекламы
        </div>
        <div className="flex flex-wrap gap-1.5">
          {AD_TYPES.map((t) => {
            const Icon = t.icon;
            const checked = selectedTypes.includes(t.key);
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => toggleType(t.key)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] border transition-colors ${
                  checked
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background text-muted-foreground border-border hover:text-foreground hover:border-foreground/30"
                }`}
              >
                <Icon className="w-3 h-3" />
                <span>{t.short}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* District */}
      <div>
        <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Район</label>
        <div className="relative">
          <select
            value={district}
            onChange={(e) => setDistrict(e.target.value)}
            className="w-full appearance-none px-0 py-1.5 pr-7 bg-transparent text-xs text-foreground border-0 border-b border-border focus:outline-none focus:border-primary"
          >
            {districts.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
          <ChevronDown className="absolute right-1 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Traffic */}
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-2 text-foreground">
          Трафик / проходимость
        </div>
        <div className="flex gap-1">
          {TRAFFIC_OPTIONS.map((t) => (
            <button
              key={t.v}
              onClick={() => setTraffic(t.v)}
              className={`flex-1 px-2 py-2 text-[11px] font-medium border transition-colors ${
                traffic === t.v
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-2 text-foreground">
          Доступность
        </div>
        <div className="flex flex-wrap gap-1">
          {AVAILABILITY_OPTIONS.map((a) => (
            <button
              key={a.v}
              onClick={() => setAvailability(a.v)}
              className={`px-2.5 py-1.5 text-[11px] font-medium border transition-colors ${
                availability === a.v
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              {a.label}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Цена за месяц, ₽</label>
        <div className="flex gap-1.5">
          <input
            type="number" placeholder="от" value={priceMin}
            onChange={(e) => setPriceMin(e.target.value)}
            className="w-full px-0 py-1.5 bg-transparent text-xs text-foreground border-0 border-b border-border focus:outline-none focus:border-primary"
          />
          <input
            type="number" placeholder="до" value={priceMax}
            onChange={(e) => setPriceMax(e.target.value)}
            className="w-full px-0 py-1.5 bg-transparent text-xs text-foreground border-0 border-b border-border focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      {activeCount > 0 && (
        <button
          onClick={reset}
          className="w-full text-[11px] py-2 border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
        >
          Сбросить фильтры ({activeCount})
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <main className="flex-1 pt-16">
        {/* Page intro */}
        <section className="border-b border-border bg-card/30">
          <div className="container mx-auto px-4 lg:px-8 py-6 lg:py-10">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
              <Megaphone className="w-3.5 h-3.5" />
              <span>Реклама на наших объектах</span>
            </div>
            <h1 className="font-display text-2xl lg:text-4xl font-bold text-foreground mb-2">
              Каталог рекламных размещений
            </h1>
            <p className="text-sm text-muted-foreground max-w-2xl">
              Билборды, фасадные баннеры, бегущие строки и брендирование на коммерческой
              недвижимости в Иркутске и области. Фильтруйте по типу, району, трафику и цене.
            </p>
          </div>
        </section>

        {/* Layout: sidebar + grid */}
        <div className="container mx-auto px-0 lg:px-8 py-4 lg:py-6">
          <div className="flex gap-0 lg:gap-6">
            {/* Desktop sidebar */}
            <aside className="hidden lg:block w-[280px] xl:w-[300px] shrink-0">
              <div className="sticky top-20 bg-card border border-border">
                <div className="px-4 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-foreground border-b border-border">
                  Фильтры
                </div>
                {filtersBlock}
              </div>
            </aside>

            {/* Main */}
            <div className="flex-1 min-w-0 px-4 lg:px-0">
              {/* Toolbar */}
              <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
                <div className="text-xs text-muted-foreground">
                  {isLoading ? "Загрузка..." : `Найдено ${filtered.length} ${filtered.length === 1 ? "позиция" : "позиций"}`}
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as typeof sort)}
                    className="text-xs px-2 py-1.5 border border-border bg-background text-foreground"
                  >
                    <option value="date">Сначала новые</option>
                    <option value="price_asc">Цена ↑</option>
                    <option value="price_desc">Цена ↓</option>
                  </select>
                  <button
                    onClick={() => setMobileFiltersOpen(true)}
                    className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border text-foreground"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                    Фильтры
                    {activeCount > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-[10px]">
                        {activeCount}
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Grid */}
              {isLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-72 w-full" />
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="border border-border bg-card p-10 text-center">
                  <Megaphone className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-foreground font-medium mb-1">Ничего не найдено</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Попробуйте изменить фильтры или сбросить их
                  </p>
                  <button
                    onClick={reset}
                    className="text-xs px-4 py-2 border border-border hover:border-foreground/40"
                  >
                    Сбросить фильтры
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filtered.map((p) => <AdCard key={p.id} placement={p} />)}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Mobile filters drawer */}
      {mobileFiltersOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-background animate-fade-in">
          <div className="flex items-center justify-between px-4 h-14 border-b border-border">
            <span className="text-sm font-semibold">Фильтры</span>
            <button onClick={() => setMobileFiltersOpen(false)} className="p-2 -mr-2">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="overflow-y-auto h-[calc(100vh-114px)]">{filtersBlock}</div>
          <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-border bg-card flex gap-2">
            <button
              onClick={reset}
              className="flex-1 py-2.5 text-xs border border-border text-foreground"
            >
              Сбросить
            </button>
            <button
              onClick={() => setMobileFiltersOpen(false)}
              className="flex-1 py-2.5 text-xs bg-primary text-primary-foreground font-medium"
            >
              Показать {filtered.length}
            </button>
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  );
}

function AdCard({ placement }: { placement: any }) {
  const meta = AD_TYPE_MAP[placement.ad_type as AdTypeKey];
  const Icon = meta?.icon || Megaphone;
  const property = placement.property;
  const cover = placement.photo || (property ? getPropertyCover(property.cover_photo, property.type) : "");
  const traffic = placement.traffic as TrafficKey;
  const availability = placement.availability as AvailabilityKey;

  return (
    <article className="group bg-card border border-border overflow-hidden flex flex-col hover:border-foreground/30 transition-colors">
      <div className="relative aspect-[4/3] bg-muted overflow-hidden">
        {cover ? (
          <img
            src={cover}
            alt={meta?.label || "Реклама"}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Icon className="w-10 h-10" />
          </div>
        )}
        <div className="absolute top-2 left-2 inline-flex items-center gap-1 px-2 py-1 bg-background/90 backdrop-blur text-[10px] font-medium uppercase tracking-wide border border-border">
          <Icon className="w-3 h-3" />
          {meta?.short}
        </div>
        <div className={`absolute top-2 right-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${AVAILABILITY_BADGE[availability]}`}>
          {AVAILABILITY_LABELS[availability]}
        </div>
      </div>

      <div className="p-3 flex-1 flex flex-col">
        <div className="font-display text-base font-bold text-foreground mb-0.5">
          {Number(placement.monthly_price).toLocaleString("ru-RU")} ₽
          <span className="text-[11px] font-normal text-muted-foreground">/мес</span>
        </div>

        <div className="text-xs text-foreground font-medium truncate mb-1">
          {meta?.label}
        </div>

        {property && (
          <div className="flex items-start gap-1 text-[11px] text-muted-foreground mb-2">
            <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
            <span className="truncate">{property.address}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-1 text-[10px] mb-3">
          <span className={`px-1.5 py-0.5 ${TRAFFIC_BADGE[traffic]}`}>
            Трафик: {TRAFFIC_LABELS[traffic]}
          </span>
          {placement.side && (
            <span className="px-1.5 py-0.5 bg-muted text-muted-foreground">
              {placement.side}
            </span>
          )}
          {(placement.width_m > 0 || placement.height_m > 0) && (
            <span className="px-1.5 py-0.5 bg-muted text-muted-foreground inline-flex items-center gap-0.5">
              <Maximize2 className="w-2.5 h-2.5" />
              {placement.width_m}×{placement.height_m} м
            </span>
          )}
        </div>

        {property && (
          <Link
            to={`/property/${property.id}`}
            className="mt-auto inline-flex items-center justify-center px-3 py-1.5 border border-border text-[11px] font-medium hover:bg-foreground hover:text-background transition-colors"
          >
            Посмотреть объект
          </Link>
        )}
      </div>
    </article>
  );
}
