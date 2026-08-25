import {
  Buildings,
  Factory,
  HouseLine,
  Storefront,
  Tree,
  Warehouse,
} from "@phosphor-icons/react";
import {
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import LocationPickerModal from "@/components/LocationPickerModal";
import PropertyImage from "@/components/PropertyImage";
import {
  type PropertySegment,
  RESIDENTIAL_MARKET_TYPES,
} from "@/config/propertySegments";
import { useToast } from "@/hooks/use-toast";
import { useAllDictionaryValues } from "@/hooks/useDictionaries";
import type { DbProperty } from "@/hooks/useProperties";
import { type AIResponse, invokePropertyPick } from "@/lib/aiPropertyPick";
import { buildCatalogUrl } from "@/lib/catalogLinks";
import { isBroadLocation } from "@/lib/irkutskLocations";
import {
  CONDITIONS,
  DEAL_TYPES,
  PROPERTY_CLASSES,
  RESIDENTIAL_CONDITIONS,
  RESIDENTIAL_DEAL_TYPES,
} from "@/lib/propertyOptions";
import {
  buildPropertyDisplayTitle,
  formatPropertyAddressShort,
  formatPropertyPrice,
} from "@/lib/propertyCard";
import {
  buildSmartPickSummary,
  rankSmartPicks,
  type SmartPickCatalog,
  type SmartPickCriteria,
  toSmartPickLite,
  typeUsesRooms,
} from "@/lib/smartPick";
import { cn } from "@/lib/utils";

const STEPS = [
  "Каталог",
  "Сделка",
  "Тип",
  "Где искать",
  "Бюджет",
  "Уточнения",
] as const;

const POPULAR_LOCATIONS = [
  "Иркутск",
  "Ангарск",
  "Шелехов",
  "Иркутский район",
  "Хомутово",
  "Маркова",
];

const ROOM_OPTIONS = ["Студия", "1", "2", "3", "4+"];

const TYPE_ICONS: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  Офис: Buildings,
  Торговая: Storefront,
  Склад: Warehouse,
  Производство: Factory,
  Земля: Tree,
  Квартира: HouseLine,
  Дом: HouseLine,
  Комната: HouseLine,
  Таунхаус: Buildings,
  Апартаменты: Buildings,
  Дача: Tree,
  Коттедж: HouseLine,
  Участок: Tree,
  Гараж: Warehouse,
  Машиноместо: Warehouse,
  Доля: HouseLine,
};

const SCENARIO_BY_TYPE: Record<string, string[]> = {
  default: ["Для себя", "Инвестиция", "Переезд", "Для бизнеса"],
  Офис: ["Офис компании", "Шоурум", "Колл-центр", "Медцентр"],
  Торговая: ["Магазин", "Кафе", "Салон", "ПВЗ"],
  Склад: ["Логистика", "Тёплый склад", "Холодный склад", "Оптовая база"],
  Производство: ["Цех", "Автосервис", "База с офисом"],
  Земля: ["Под базу", "Коммерция", "ИЖС"],
  Квартира: ["Для себя", "Семья", "Инвестиция", "Сдача в аренду"],
  Дом: ["Для семьи", "Постоянное жильё", "Инвестиция"],
  Комната: ["Для себя", "Временное жильё"],
  Апартаменты: ["Для себя", "Сдача посуточно", "Инвестиция"],
};

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-foreground hover:bg-muted/70",
      )}
    >
      {children}
    </button>
  );
}

const fieldClass =
  "w-full min-w-0 rounded-md bg-muted px-3 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring";

export default function AIPropertyWizard({
  properties,
  onClose,
  segment = "commercial",
}: {
  properties: DbProperty[];
  onClose?: () => void;
  segment?: PropertySegment;
}) {
  const { toast } = useToast();
  const { propertyTypes } = useAllDictionaryValues();
  const [step, setStep] = useState(0);
  const [catalog, setCatalog] = useState<SmartPickCatalog>(segment);
  const [deal, setDeal] = useState("Любое");
  const [type, setType] = useState("");
  const [activity, setActivity] = useState("");
  const [location, setLocation] = useState("Любой");
  const [locationOpen, setLocationOpen] = useState(false);
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [areaMin, setAreaMin] = useState("");
  const [areaMax, setAreaMax] = useState("");
  const [rooms, setRooms] = useState("");
  const [market, setMarket] = useState("");
  const [propertyClass, setPropertyClass] = useState("Любой");
  const [condition, setCondition] = useState("Любое");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResponse | null>(null);
  const [showResult, setShowResult] = useState(false);

  const criteria: SmartPickCriteria = {
    catalog,
    deal,
    type,
    location,
    budgetMin: budgetMin ? Number(budgetMin) : null,
    budgetMax: budgetMax ? Number(budgetMax) : null,
    areaMin: areaMin ? Number(areaMin) : null,
    areaMax: areaMax ? Number(areaMax) : null,
    rooms,
    market,
    propertyClass,
    condition,
    features: selectedFeatures,
    activity,
    notes,
  };

  const deals =
    catalog === "commercial"
      ? ["Любое", ...DEAL_TYPES]
      : catalog === "residential"
        ? ["Любое", ...RESIDENTIAL_DEAL_TYPES]
        : catalog === "land"
          ? ["Любое", "Аренда", "Продажа"]
          : ["Любое", "Аренда", "Продажа", "Посуточно"];

  const typeGroups = useMemo(() => {
    const groups: { title: string; items: readonly string[] }[] = [];
    if (catalog === "residential" || catalog === "all") {
      groups.push({ title: "Жилая", items: propertyTypes("residential") });
    }
    if (catalog === "commercial" || catalog === "all") {
      groups.push({ title: "Коммерческая", items: propertyTypes("commercial") });
    }
    if (catalog === "land" || catalog === "all") {
      groups.push({ title: "Земля", items: propertyTypes("land") });
    }
    if (groups.length === 0) {
      groups.push({ title: "Жилая", items: propertyTypes("residential") });
      groups.push({ title: "Коммерческая", items: propertyTypes("commercial") });
      groups.push({ title: "Земля", items: propertyTypes("land") });
    }
    return groups;
  }, [catalog, propertyTypes]);

  const ranked = useMemo(
    () => rankSmartPicks(properties, criteria, 40),
    [properties, criteria],
  );

  const featureOptions = useMemo(() => {
    const source = ranked.length > 0 ? ranked.map((r) => r.property) : properties;
    const counts = new Map<string, { label: string; count: number }>();
    source.forEach((property) => {
      if (!Array.isArray(property.features)) return;
      property.features.forEach((raw) => {
        const label = String(raw).replace(/\s+/g, " ").replace(/\.$/, "").trim();
        if (!label) return;
        const key = label.toLowerCase();
        const prev = counts.get(key);
        counts.set(key, { label, count: (prev?.count || 0) + 1 });
      });
    });
    return [...counts.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
      .map((item) => item.label);
  }, [ranked, properties]);

  const propertiesById = useMemo(
    () => Object.fromEntries(properties.map((p) => [p.id, p])),
    [properties],
  );

  const isLand = type === "Земля" || type === "Участок";
  const showRooms =
    typeUsesRooms(type) || (!type && catalog !== "commercial");
  const showClass = catalog !== "residential" && !isLand;
  const scenarioOptions = SCENARIO_BY_TYPE[type] || SCENARIO_BY_TYPE.default;
  const conditions = catalog === "residential" ? RESIDENTIAL_CONDITIONS : CONDITIONS;

  const catalogHref = buildCatalogUrl({
    segment: catalog === "residential" ? "residential" : "commercial",
    types: type || undefined,
    deal: deal !== "Любое" ? (deal as "Аренда" | "Продажа" | "Посуточно") : undefined,
    district: isBroadLocation(location) ? undefined : location,
    rooms: rooms || undefined,
    market: market || undefined,
  });

  const reset = () => {
    setStep(0);
    setCatalog(segment);
    setDeal("Любое");
    setType("");
    setActivity("");
    setLocation("Любой");
    setBudgetMin("");
    setBudgetMax("");
    setAreaMin("");
    setAreaMax("");
    setRooms("");
    setMarket("");
    setPropertyClass("Любой");
    setCondition("Любое");
    setSelectedFeatures([]);
    setNotes("");
    setResult(null);
    setShowResult(false);
  };

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const runPick = async () => {
    setLoading(true);
    setShowResult(true);
    const fallback: AIResponse = {
      summary: buildSmartPickSummary(Math.min(5, ranked.length), criteria),
      picks: ranked.slice(0, 5).map((item) => ({
        id: item.property.id,
        fit_score: item.fit_score,
        reason: item.reason,
        highlights: item.highlights,
      })),
    };

    try {
      const data = await invokePropertyPick(
        criteria,
        ranked.slice(0, 50).map((item) => toSmartPickLite(item.property)),
      );
      const allowed = new Set(ranked.map((item) => item.property.id));
      const picks = (data.picks || []).filter((pick) => allowed.has(pick.id));
      setResult(
        picks.length > 0
          ? { summary: data.summary || fallback.summary, picks: picks.slice(0, 5) }
          : fallback,
      );
    } catch (error) {
      setResult(fallback);
      if (fallback.picks.length === 0) {
        toast({
          title: "Подбор временно недоступен",
          description:
            error instanceof Error ? error.message : "Попробуйте позже",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const Progress = (
    <div className="flex gap-1 px-4 pb-3">
      {STEPS.map((_, index) => (
        <div
          key={index}
          className={cn(
            "h-1 flex-1 rounded-full transition-colors",
            showResult || step > index
              ? "bg-primary"
              : step === index
                ? "bg-primary/40"
                : "bg-muted",
          )}
        />
      ))}
    </div>
  );

  if (showResult) {
    return (
      <div className="min-w-0">
        {Progress}
        <div className="space-y-3 px-4 pb-4">
          {loading ? (
            <div className="flex flex-col items-center gap-2 py-10">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <p className="text-[13px] text-muted-foreground">
                Сверяем {ranked.length || properties.length} объектов из базы
              </p>
            </div>
          ) : !result || result.picks.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm font-medium text-foreground">
                Подходящих вариантов не найдено
              </p>
              <p className="mt-1 text-[13px] text-muted-foreground">
                {result?.summary || "Смягчите район, бюджет или тип"}
              </p>
              <button
                type="button"
                onClick={reset}
                className="mt-4 text-[13px] font-medium text-primary hover:underline"
              >
                Новый подбор
              </button>
            </div>
          ) : (
            <>
              <div className="rounded-lg bg-muted/60 px-3 py-2.5">
                <div className="flex items-start gap-2">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <p className="text-[13px] leading-relaxed text-foreground/90">
                    {result.summary}
                  </p>
                </div>
              </div>

              <div className="space-y-2.5">
                {result.picks.map((pick) => {
                  const property = propertiesById[pick.id];
                  if (!property) return null;
                  return (
                    <div
                      key={pick.id}
                      className="rounded-lg bg-card p-2.5"
                    >
                      <div className="flex gap-3">
                        <div className="relative h-[72px] w-[96px] shrink-0 overflow-hidden rounded-md bg-muted">
                          <PropertyImage
                            src={property.cover_photo}
                            alt={buildPropertyDisplayTitle(property)}
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="line-clamp-2 text-[13px] font-semibold leading-snug text-foreground">
                              {buildPropertyDisplayTitle(property)}
                            </p>
                            <div className="shrink-0 text-right">
                              <div className="text-base font-bold leading-none text-primary">
                                {pick.fit_score}
                              </div>
                              <div className="mt-0.5 text-[9px] uppercase tracking-wide text-muted-foreground">
                                %
                              </div>
                            </div>
                          </div>
                          {formatPropertyAddressShort(property.address) && (
                            <p className="mt-0.5 flex items-center gap-1 truncate text-[12px] text-muted-foreground">
                              <MapPin className="h-3 w-3 shrink-0" />
                              {formatPropertyAddressShort(property.address)}
                            </p>
                          )}
                          <p className="mt-0.5 text-[12px] text-muted-foreground">
                            {formatPropertyPrice(property) ?? "По запросу"}
                            {" · "}
                            {property.area} м²
                          </p>
                        </div>
                      </div>
                      <p className="mt-2 border-l-2 border-primary/40 pl-2 text-[12px] leading-relaxed text-foreground/80">
                        {pick.reason}
                      </p>
                      {pick.highlights?.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {pick.highlights.map((highlight) => (
                            <span
                              key={highlight}
                              className="inline-flex items-center gap-0.5 rounded-md bg-primary/10 px-1.5 py-0.5 text-[11px] font-medium text-primary"
                            >
                              <Check className="h-2.5 w-2.5" /> {highlight}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="mt-2.5 flex gap-2">
                        <Link
                          to={`/property/${property.id}`}
                          onClick={onClose}
                          className="flex-1 rounded-md bg-primary py-2 text-center text-[12px] font-semibold text-primary-foreground hover:opacity-90"
                        >
                          К объекту
                        </Link>
                        <Link
                          to={catalogHref}
                          onClick={onClose}
                          className="inline-flex flex-1 items-center justify-center gap-1 rounded-md bg-muted py-2 text-[12px] font-medium text-foreground hover:bg-muted/70"
                        >
                          В каталог <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={reset}
                className="inline-flex w-full items-center justify-center gap-1 py-2 text-[12px] text-muted-foreground hover:text-primary"
              >
                <RotateCcw className="h-3 w-3" /> Новый подбор
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      {Progress}
      <div className="px-4 pb-4">
        <div className="mb-3">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Шаг {step + 1} из {STEPS.length}
          </p>
          <p className="text-sm font-semibold text-foreground">{STEPS[step]}</p>
        </div>

        {step === 0 && (
          <div className="grid grid-cols-1 gap-2">
            {(
              [
                ["all", "Вся база", "Жильё, коммерция и земля"],
                ["residential", "Жилая", "Квартиры, дома, комнаты"],
                ["commercial", "Коммерческая", "Офисы, торговля, склады"],
                ["land", "Земля", "Участки: ИЖС, жилая, коммерческая"],
              ] as const
            ).map(([value, label, hint]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setCatalog(value);
                  next();
                }}
                className={cn(
                  "rounded-lg px-3 py-3 text-left transition-colors",
                  catalog === value
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-foreground hover:bg-muted/70",
                )}
              >
                <div className="text-[13px] font-semibold">{label}</div>
                <div
                  className={cn(
                    "mt-0.5 text-[12px]",
                    catalog === value
                      ? "text-primary-foreground/80"
                      : "text-muted-foreground",
                  )}
                >
                  {hint}
                </div>
              </button>
            ))}
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-wrap gap-2">
            {deals.map((value) => (
              <Chip
                key={value}
                active={deal === value}
                onClick={() => {
                  setDeal(value);
                  next();
                }}
              >
                {value}
              </Chip>
            ))}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            {typeGroups.map((group) => (
              <div key={group.title}>
                {typeGroups.length > 1 && (
                  <p className="mb-1.5 text-[12px] text-muted-foreground">
                    {group.title}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  {group.items.map((label) => {
                    const Icon = TYPE_ICONS[label] || Buildings;
                    return (
                      <Chip
                        key={label}
                        active={type === label}
                        onClick={() => {
                          setType(label);
                          next();
                        }}
                      >
                        <Icon className="h-3.5 w-3.5" /> {label}
                      </Chip>
                    );
                  })}
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                setType("");
                next();
              }}
              className="text-[12px] text-muted-foreground hover:text-primary"
            >
              Любой тип →
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            {(() => {
              const customLocation =
                !isBroadLocation(location) &&
                location !== "Любой" &&
                !POPULAR_LOCATIONS.includes(location);
              const citiesActive = locationOpen || customLocation;
              return (
                <>
                  <div className="flex flex-wrap gap-2">
                    <Chip
                      active={!locationOpen && location === "Любой"}
                      onClick={() => setLocation("Любой")}
                    >
                      Любой
                    </Chip>
                    {POPULAR_LOCATIONS.map((value) => (
                      <Chip
                        key={value}
                        active={!locationOpen && location === value}
                        onClick={() => setLocation(value)}
                      >
                        {value}
                      </Chip>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setLocationOpen(true)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-[13px] font-medium transition-colors",
                      citiesActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-foreground hover:bg-muted/70",
                    )}
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    {customLocation ? location : "Все города и районы"}
                  </button>
                  <LocationPickerModal
                    open={locationOpen}
                    onOpenChange={setLocationOpen}
                    elevated
                    value={isBroadLocation(location) ? "" : location}
                    onSelect={(value) =>
                      setLocation(value === "Все" ? "Любой" : value)
                    }
                  />
                </>
              );
            })()}
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <div>
              <p className="mb-1.5 text-[13px] text-foreground">
                Бюджет, ₽ {deal === "Аренда" || deal === "Посуточно" ? "в месяц" : ""}
              </p>
              <div className="flex gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  value={budgetMin}
                  onChange={(e) => setBudgetMin(e.target.value)}
                  placeholder="от"
                  className={fieldClass}
                />
                <input
                  type="number"
                  inputMode="numeric"
                  value={budgetMax}
                  onChange={(e) => setBudgetMax(e.target.value)}
                  placeholder="до"
                  className={fieldClass}
                />
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-[13px] text-foreground">Площадь, м²</p>
              <div className="flex gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  value={areaMin}
                  onChange={(e) => setAreaMin(e.target.value)}
                  placeholder="от"
                  className={fieldClass}
                />
                <input
                  type="number"
                  inputMode="numeric"
                  value={areaMax}
                  onChange={(e) => setAreaMax(e.target.value)}
                  placeholder="до"
                  className={fieldClass}
                />
              </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            {showRooms && (
              <div>
                <p className="mb-1.5 text-[13px] text-foreground">Комнаты</p>
                <div className="flex flex-wrap gap-2">
                  <Chip active={!rooms} onClick={() => setRooms("")}>
                    Любые
                  </Chip>
                  {ROOM_OPTIONS.map((value) => (
                    <Chip
                      key={value}
                      active={rooms === value}
                      onClick={() => setRooms(value)}
                    >
                      {value}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
            {catalog !== "commercial" && (
              <div>
                <p className="mb-1.5 text-[13px] text-foreground">Рынок</p>
                <div className="flex flex-wrap gap-2">
                  <Chip active={!market} onClick={() => setMarket("")}>
                    Любой
                  </Chip>
                  {RESIDENTIAL_MARKET_TYPES.map((value) => (
                    <Chip
                      key={value}
                      active={market === value}
                      onClick={() => setMarket(value)}
                    >
                      {value}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
            {showClass && (
              <div>
                <p className="mb-1.5 text-[13px] text-foreground">Класс</p>
                <div className="flex flex-wrap gap-2">
                  {["Любой", ...PROPERTY_CLASSES.filter((v) => v !== "-")].map(
                    (value) => (
                      <Chip
                        key={value}
                        active={propertyClass === value}
                        onClick={() => setPropertyClass(value)}
                      >
                        {value}
                      </Chip>
                    ),
                  )}
                </div>
              </div>
            )}
            <div>
              <p className="mb-1.5 text-[13px] text-foreground">Состояние</p>
              <div className="flex flex-wrap gap-2">
                {["Любое", ...conditions.slice(0, 8)].map((value) => (
                  <Chip
                    key={value}
                    active={condition === value}
                    onClick={() => setCondition(value)}
                  >
                    {value}
                  </Chip>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1.5 text-[13px] text-foreground">Задача</p>
              <div className="flex flex-wrap gap-2">
                {scenarioOptions.map((value) => (
                  <Chip
                    key={value}
                    active={activity === value}
                    onClick={() => setActivity(value)}
                  >
                    {value}
                  </Chip>
                ))}
              </div>
            </div>
            {featureOptions.length > 0 && (
              <div>
                <p className="mb-1.5 text-[13px] text-foreground">Важно</p>
                <div className="flex flex-wrap gap-2">
                  {featureOptions.map((label) => (
                    <Chip
                      key={label}
                      active={selectedFeatures.includes(label)}
                      onClick={() =>
                        setSelectedFeatures((prev) =>
                          prev.includes(label)
                            ? prev.filter((item) => item !== label)
                            : [...prev, label],
                        )
                      }
                    >
                      {label}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Коротко своими словами: парковка, первый этаж, у школы..."
              rows={3}
              className={`${fieldClass} resize-none`}
            />
          </div>
        )}

        <div className="sticky bottom-0 -mx-4 mt-4 border-t border-border/50 bg-card/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
          <button
            type="button"
            onClick={back}
            disabled={step === 0}
            className="inline-flex items-center gap-0.5 text-[12px] text-muted-foreground hover:text-primary disabled:opacity-30"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Назад
          </button>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-[12px] text-muted-foreground">
              {ranked.length} в выборке · {properties.length} в базе
            </span>
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={next}
                className="inline-flex items-center gap-0.5 rounded-md bg-primary px-3 py-2 text-[13px] font-semibold text-primary-foreground hover:opacity-90"
              >
                Далее <ChevronRight className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={runPick}
                className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-2 text-[13px] font-semibold text-primary-foreground hover:opacity-90"
              >
                <Sparkles className="h-3.5 w-3.5" /> Подобрать
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
