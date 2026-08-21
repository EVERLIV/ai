import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles, ArrowRight, RotateCcw, MapPin, Check, Loader2,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import {
  Buildings, Storefront, Warehouse, Factory, Tree, HouseLine, Storefront as KioskIcon,
  Car, WifiHigh, Snowflake, ShieldCheck, Lightning,
} from "@phosphor-icons/react";
import type { DbProperty } from "@/hooks/useProperties";
import type { PropertySegment } from "@/config/propertySegments";
import { getPropertyTypes, propertyMatchesTypes } from "@/lib/propertyTypes";
import { invokePropertyPick, type AIResponse } from "@/lib/aiPropertyPick";
import { buildPropertyDisplayTitle, formatPropertyAddressShort } from "@/lib/propertyCard";

type Deal = "Аренда" | "Продажа" | "Посуточно" | "Любое";

const COMMERCIAL_DEALS: Deal[] = ["Аренда", "Продажа", "Любое"];
const RESIDENTIAL_DEALS: Deal[] = ["Аренда", "Продажа", "Посуточно", "Любое"];
const COMMERCIAL_TYPE_ORDER = ["Офис", "Торговая", "Помещение", "Павильон", "Киоск", "Склад", "Производство", "Земля"] as const;
const RESIDENTIAL_TYPE_ORDER = ["Квартира", "Дом", "Комната", "Таунхаус", "Апартаменты", "Дача", "Коттедж", "Участок"] as const;
const STEPS = [
  "Сделка", "Тип", "Сценарий", "Район", "Бюджет", "Площадь", "Класс / Состояние", "Удобства",
] as const;
const LAND_CONDITIONS = ["Любое", "У трассы", "В черте города", "С коммуникациями", "Под базу / склад"];

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Офис: Buildings,
  Торговая: Storefront,
  Помещение: HouseLine,
  Павильон: Storefront,
  Киоск: KioskIcon,
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
};

const SCENARIO_BY_TYPE: Record<string, string[]> = {
  default: ["Для бизнеса", "Инвестиция", "Переезд", "Новая точка", "Собственные нужды"],
  Офис: ["Офис компании", "Шоурум", "Колл-центр", "Медцентр", "Учебный центр"],
  Торговая: ["Магазин", "Кафе", "Салон", "Аптека", "ПВЗ"],
  Помещение: ["Услуги", "Свободное назначение", "Шоурум", "Студия", "Офис-продажи"],
  Павильон: ["Стрит-ритейл", "Кофе с собой", "Овощи / продукты", "ПВЗ", "Сезонная торговля"],
  Киоск: ["Кофе с собой", "Фастфуд", "Мини-магазин", "Точка у остановки", "Сезонная торговля"],
  Склад: ["Логистика", "Холодный склад", "Тёплый склад", "Фулфилмент", "Оптовая база"],
  Производство: ["Цех", "Автосервис", "Мебельное производство", "Пищевая линия", "База с офисом"],
  Земля: ["Коммерция", "Под базу / склад", "ИЖС", "Сельхоз", "Участок у трассы"],
  Квартира: ["Для себя", "Инвестиция", "Сдача в аренду", "Переезд", "Семья"],
  Дом: ["Для себя", "Дача", "Инвестиция", "Большая семья", "Переезд"],
  Комната: ["Для себя", "Студент", "Временное жильё", "Экономия"],
  Таунхаус: ["Для семьи", "Инвестиция", "Переезд"],
  Апартаменты: ["Для себя", "Инвестиция", "Сдача посуточно"],
  Дача: ["Отдых", "Сезонное проживание", "Инвестиция"],
  Коттедж: ["Для семьи", "Постоянное жильё", "Инвестиция"],
  Участок: ["ИЖС", "Дача", "Инвестиция", "Строительство"],
};

function uniqueNonEmpty(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.map((value) => value?.trim()).filter(Boolean) as string[]));
}

function featureIcon(label: string) {
  const value = label.toLowerCase();
  if (value.includes("парков")) return Car;
  if (value.includes("wifi") || value.includes("wi-fi") || value.includes("интернет")) return WifiHigh;
  if (value.includes("конди") || value.includes("вентил")) return Snowflake;
  if (value.includes("охран") || value.includes("видеонаблю")) return ShieldCheck;
  if (value.includes("мощн") || value.includes("элект")) return Lightning;
  return Check;
}

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
  const isResidential = segment === "residential";
  const DEALS = isResidential ? RESIDENTIAL_DEALS : COMMERCIAL_DEALS;
  const TYPE_ORDER = isResidential ? RESIDENTIAL_TYPE_ORDER : COMMERCIAL_TYPE_ORDER;
  const [step, setStep] = useState(0);
  const [deal, setDeal] = useState<Deal>("Любое");
  const [type, setType] = useState("");
  const [activity, setActivity] = useState("");
  const [district, setDistrict] = useState("Любой");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [areaMin, setAreaMin] = useState("");
  const [areaMax, setAreaMax] = useState("");
  const [propertyClass, setPropertyClass] = useState("Любой");
  const [condition, setCondition] = useState("Любое");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResponse | null>(null);
  const [showResult, setShowResult] = useState(false);

  const typeOptions = useMemo(() => {
    const counts = new Map<string, number>();
    properties.forEach((property) => {
      getPropertyTypes(property).forEach((value) => {
        const trimmed = value.trim();
        if (!trimmed) return;
        counts.set(trimmed, (counts.get(trimmed) || 0) + 1);
      });
    });

    return [...counts.entries()]
      .sort((a, b) => {
        const aIdx = TYPE_ORDER.indexOf(a[0] as (typeof TYPE_ORDER)[number]);
        const bIdx = TYPE_ORDER.indexOf(b[0] as (typeof TYPE_ORDER)[number]);
        if (aIdx !== -1 || bIdx !== -1) return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
        return b[1] - a[1];
      })
      .map(([label]) => ({ label, icon: TYPE_ICONS[label] || Buildings }));
  }, [properties, TYPE_ORDER]);

  const districts = useMemo(() => ["Любой", ...uniqueNonEmpty(properties.map((property) => property.district))], [properties]);

  const pool = useMemo(() => {
    return properties.filter((property) => {
      if (deal !== "Любое" && property.deal_type !== deal) return false;
      if (type && !propertyMatchesTypes(property, [type])) return false;
      return true;
    });
  }, [properties, deal, type]);

  const classOptions = useMemo(() => {
    const source = pool.length > 0 ? pool : properties;
    return ["Любой", ...uniqueNonEmpty(source.map((property) => property.class)).filter((value) => value !== "-")];
  }, [pool, properties]);

  const featureOptions = useMemo(() => {
    const source = pool.length > 0 ? pool : properties;
    const counts = new Map<string, { label: string; count: number }>();

    source.forEach((property) => {
      if (!Array.isArray(property.features)) return;
      property.features.forEach((raw) => {
        const label = raw.replace(/\s+/g, " ").replace(/\.$/, "").trim();
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
  }, [pool, properties]);

  const propertiesById = useMemo(() => Object.fromEntries(properties.map((property) => [property.id, property])), [properties]);
  const isLandFlow = type === "Земля";
  const scenarioOptions = SCENARIO_BY_TYPE[type] || SCENARIO_BY_TYPE.default;

  const reset = () => {
    setStep(0);
    setDeal("Любое");
    setType("");
    setActivity("");
    setDistrict("Любой");
    setBudgetMin("");
    setBudgetMax("");
    setAreaMin("");
    setAreaMax("");
    setPropertyClass("Любой");
    setCondition("Любое");
    setSelectedFeatures([]);
    setNotes("");
    setResult(null);
    setShowResult(false);
  };

  const toggleFeature = (feature: string) => {
    setSelectedFeatures((prev) => (prev.includes(feature) ? prev.filter((item) => item !== feature) : [...prev, feature]));
  };

  const next = () => setStep((current) => Math.min(STEPS.length - 1, current + 1));
  const back = () => setStep((current) => Math.max(0, current - 1));

  const shortlist = useMemo(() => {
    return properties.filter((property) => {
      if (deal !== "Любое" && property.deal_type !== deal) return false;
      if (type && !propertyMatchesTypes(property, [type])) return false;
      if (district !== "Любой" && property.district !== district) return false;
      if (!isLandFlow && propertyClass !== "Любой" && property.class !== propertyClass) return false;
      if (budgetMin && Number(property.price) < Number(budgetMin)) return false;
      if (budgetMax && Number(property.price) > Number(budgetMax)) return false;
      if (areaMin && Number(property.area) < Number(areaMin)) return false;
      if (areaMax && Number(property.area) > Number(areaMax)) return false;
      if (selectedFeatures.length > 0) {
        const values = (property.features || []).map((feature) => feature.toLowerCase().trim());
        const selected = selectedFeatures.map((feature) => feature.toLowerCase().trim());
        if (!selected.every((feature) => values.some((value) => value.includes(feature) || feature.includes(value)))) {
          return false;
        }
      }
      return true;
    });
  }, [properties, deal, type, district, propertyClass, budgetMin, budgetMax, areaMin, areaMax, isLandFlow, selectedFeatures]);

  const stepTitle =
    step === 2 ? "Сценарий использования" :
    step === 6 && isLandFlow ? "Параметры сделки" :
    step === 7 && isLandFlow ? "Комментарий к участку" :
    STEPS[step];

  const buildFallbackResult = (): AIResponse => {
    const source = shortlist.length > 0 ? shortlist : properties;
    const picks = source
      .map((property) => {
        let score = 35;
        const highlights: string[] = [];

        if (deal !== "Любое" && property.deal_type === deal) {
          score += 12;
          highlights.push(property.deal_type);
        }
        if (type && propertyMatchesTypes(property, [type])) {
          score += 18;
          highlights.push(type);
        }
        if (district !== "Любой" && property.district === district) {
          score += 10;
          highlights.push(district);
        }

        const price = Number(property.price) || 0;
        if (budgetMin || budgetMax) {
          const min = budgetMin ? Number(budgetMin) : 0;
          const max = budgetMax ? Number(budgetMax) : Number.POSITIVE_INFINITY;
          if (price >= min && price <= max) {
            score += 12;
            highlights.push("в бюджете");
          }
        }

        const area = Number(property.area) || 0;
        if (areaMin || areaMax) {
          const min = areaMin ? Number(areaMin) : 0;
          const max = areaMax ? Number(areaMax) : Number.POSITIVE_INFINITY;
          if (area >= min && area <= max) {
            score += 10;
            highlights.push(`${area} м²`);
          }
        }

        if (!isLandFlow && propertyClass !== "Любой" && property.class === propertyClass) {
          score += 8;
          highlights.push(`класс ${property.class}`);
        }

        const propertyFeatures = (property.features || []).map((feature) => feature.toLowerCase().trim());
        const matchedFeatures = selectedFeatures.filter((feature) =>
          propertyFeatures.some((value) => value.includes(feature.toLowerCase()) || feature.toLowerCase().includes(value)),
        );
        if (matchedFeatures.length > 0) {
          score += matchedFeatures.length * 4;
          highlights.push(...matchedFeatures.slice(0, 2));
        }

        const haystack = [
          property.address,
          property.district,
          property.description || "",
          ...(property.features || []),
          property.type,
        ].join(" ").toLowerCase();
        const scenarioNeedle = [activity, notes].join(" ").toLowerCase().trim();
        if (scenarioNeedle) {
          const tokens = scenarioNeedle.split(/[\s,.;:()/-]+/).filter((token) => token.length > 3);
          const hits = tokens.filter((token) => haystack.includes(token));
          if (hits.length > 0) {
            score += Math.min(12, hits.length * 4);
            highlights.push("по сценарию");
          }
        }

        return {
          id: property.id,
          fit_score: Math.max(45, Math.min(98, Math.round(score))),
          reason: [
            type ? `подходит по типу ${type}` : null,
            district !== "Любой" ? `локация ${property.district || "без района"}` : null,
            budgetMin || budgetMax ? `цена ${price.toLocaleString("ru-RU")} ₽` : null,
            areaMin || areaMax ? `площадь ${area} м²` : null,
          ].filter(Boolean).slice(0, 2).join(", ") || "Хорошо совпадает с базовыми параметрами запроса.",
          highlights: [...new Set(highlights)].slice(0, 4),
        };
      })
      .sort((a, b) => b.fit_score - a.fit_score)
      .slice(0, 3);

    return {
      summary: picks.length > 0
        ? buildFallbackSummary(picks.length)
        : "Подходящих объектов по выбранным параметрам не найдено.",
      picks,
    };
  };

  function buildFallbackSummary(count: number): string {
    const parts: string[] = [];
    if (deal !== "Любое") parts.push(deal.toLowerCase());
    if (type) parts.push(type.toLowerCase());
    if (district !== "Любой") parts.push(`в ${district}`);
    const criteria = parts.length > 0 ? ` по критериям: ${parts.join(", ")}` : " по вашему запросу";
    const noun = count === 1 ? "вариант" : count < 5 ? "варианта" : "вариантов";
    return `Подобрали ${count} ${noun}${criteria} — объекты с наибольшим совпадением по параметрам каталога.`;
  }

  const runAI = async () => {
    setLoading(true);
    setShowResult(true);

    try {
      const source = (shortlist.length > 0 ? shortlist : properties).slice(0, 60);
      const liteList = source.map((property) => ({
        id: property.id,
        type: property.type,
        deal_type: property.deal_type,
        district: property.district,
        address: property.address,
        price: Number(property.price),
        price_per_m2: Number(property.price_per_m2),
        area: Number(property.area),
        class: property.class,
        condition: property.condition,
        features: property.features,
        floor: property.floor,
        total_floors: property.total_floors,
        ceiling_height: property.ceiling_height ? Number(property.ceiling_height) : null,
      }));

      const data = await invokePropertyPick(
        {
          deal,
          type,
          activity,
          district,
          budget_min: budgetMin ? Number(budgetMin) : null,
          budget_max: budgetMax ? Number(budgetMax) : null,
          area_min: areaMin ? Number(areaMin) : null,
          area_max: areaMax ? Number(areaMax) : null,
          property_class: propertyClass,
          condition,
          features: selectedFeatures,
          notes,
        },
        liteList,
      );

      setResult(data);
    } catch (error) {
      const fallback = buildFallbackResult();
      setResult(fallback);
      if (fallback.picks.length === 0) {
        const message = error instanceof Error ? error.message : "Попробуйте позже";
        toast({
          title: "ИИ-подбор временно недоступен",
          description: message,
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const Progress = (
    <div className="px-3 pb-2 flex gap-0.5">
      {STEPS.map((_, index) => (
        <div
          key={index}
          className={`h-1 flex-1 rounded-full transition-all duration-500 ${
            showResult || step > index ? "bg-primary" : step === index ? "bg-primary/40" : "bg-muted"
          }`}
        />
      ))}
    </div>
  );

  if (showResult) {
    return (
      <div className="bg-muted/40 min-w-0 overflow-hidden">
        {Progress}
        <div className="px-3 pb-3 space-y-2 min-w-0">
          {loading ? (
            <div className="py-6 flex flex-col items-center gap-2">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <div className="text-[11px] text-muted-foreground">ИИ анализирует {shortlist.length || properties.length} объектов...</div>
            </div>
          ) : !result || result.picks.length === 0 ? (
            <div className="py-3 text-center">
              <div className="text-[11px] text-foreground mb-1">Подходящих вариантов не найдено</div>
              <div className="text-[10px] text-muted-foreground mb-2">{result?.summary || "Попробуйте смягчить параметры"}</div>
              <button onClick={reset} className="text-[11px] text-primary font-medium hover:underline">
                Новый подбор
              </button>
            </div>
          ) : (
            <>
              <div className="bg-muted/40 p-2.5">
                <div className="flex items-start gap-1.5">
                  <Sparkles className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                  <div className="text-[10.5px] text-foreground/90 leading-relaxed">{result.summary}</div>
                </div>
              </div>

              <div className="space-y-1.5">
                {result.picks.map((pick) => {
                  const property = propertiesById[pick.id];
                  if (!property) return null;

                  return (
                    <div key={pick.id} className="bg-card/60 hover:bg-card transition-all p-2.5 space-y-2 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[11px] font-semibold text-foreground line-clamp-2 leading-snug">
                            {buildPropertyDisplayTitle(property)}
                          </div>
                          {formatPropertyAddressShort(property.address) && (
                            <div className="text-[10px] text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                              <MapPin className="w-2.5 h-2.5 shrink-0" /> {formatPropertyAddressShort(property.address)}
                            </div>
                          )}
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {Number(property.price).toLocaleString("ru-RU")} ₽
                            {property.deal_type === "Аренда" && <span>/мес</span>} · {property.area} м²
                          </div>
                        </div>
                        <div className="shrink-0 text-center">
                          <div className="text-[14px] font-bold text-primary leading-none">{pick.fit_score}</div>
                          <div className="text-[8px] text-muted-foreground uppercase tracking-wider">совпадение</div>
                        </div>
                      </div>

                      <div className="text-[10.5px] text-foreground/85 leading-relaxed border-l-2 border-primary/40 pl-2">
                        {pick.reason}
                      </div>

                      {pick.highlights?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {pick.highlights.map((highlight, index) => (
                            <span key={index} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] bg-foreground/[0.06] text-primary border border-primary/20 font-medium">
                              <Check className="w-2 h-2" /> {highlight}
                            </span>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-1">
                        <Link
                          to={`/property/${property.id}`}
                          onClick={onClose}
                          className="flex-1 text-center px-2 py-1 text-[10px] font-medium text-foreground bg-muted hover:bg-muted/70 hover:text-primary transition-all"
                        >
                          Подробнее
                        </Link>
                        <Link
                          to={`/?focus=${property.id}#map`}
                          onClick={onClose}
                          className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 text-[10px] font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                        >
                          На карте <ArrowRight className="w-2.5 h-2.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={reset}
                className="w-full inline-flex items-center justify-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors py-1.5 mt-1"
              >
                <RotateCcw className="w-2.5 h-2.5" /> Новый подбор
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-muted/40 min-w-0 overflow-hidden">
      {Progress}

      <div className="px-3 pb-3 min-h-[120px] min-w-0">
        <div className="mb-3 rounded-xl bg-card px-3 py-2 shadow-sm">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Шаг {step + 1} из {STEPS.length}</p>
          <p className="text-sm font-medium text-foreground">{stepTitle}</p>
        </div>

        {step === 0 && (
          <div className="animate-fade-in-up">
            <p className="text-[11px] text-foreground/80 mb-2">Тип сделки</p>
            <div className="grid grid-cols-3 gap-1.5">
              {DEALS.map((value) => (
                <button
                  key={value}
                  onClick={() => {
                    setDeal(value);
                    next();
                  }}
                  className={`px-2 py-2 text-[11px] font-medium transition-all ${
                    deal === value
                      ? "bg-foreground/[0.06] text-primary border border-primary/20"
                      : "bg-muted text-foreground hover:bg-muted/70 hover:text-primary"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="animate-fade-in-up">
            <p className="text-[11px] text-foreground/80 mb-2">Тип объекта</p>
            <div className="flex flex-wrap gap-1.5">
              {typeOptions.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  onClick={() => {
                    setType(label);
                    next();
                  }}
                  className={`inline-flex items-center gap-1 px-2 py-1.5 text-[11px] transition-all ${
                    type === label
                      ? "bg-foreground/[0.06] text-primary border border-primary/20"
                      : "bg-muted text-foreground hover:bg-muted/70 hover:text-primary"
                  }`}
                >
                  <Icon className="w-3 h-3" /> {label}
                </button>
              ))}
            </div>
            <button onClick={() => { setType(""); next(); }} className="mt-2 text-[10px] text-muted-foreground hover:text-primary transition-colors">
              Пропустить →
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in-up">
            <p className="text-[11px] text-foreground/80 mb-2">Что ищете под свою задачу</p>
            <div className="flex flex-wrap gap-1.5">
              {scenarioOptions.map((value) => {
                const Icon = TYPE_ICONS[type] || Buildings;
                return (
                  <button
                    key={value}
                    onClick={() => setActivity(value)}
                    className={`inline-flex items-center gap-1 px-2 py-1.5 text-[11px] transition-all ${
                      activity === value
                        ? "bg-foreground/[0.06] text-primary border border-primary/20"
                        : "bg-muted text-foreground hover:bg-muted/70 hover:text-primary"
                    }`}
                  >
                    <Icon className="w-3 h-3" /> {value}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[10px] text-muted-foreground">Если сценарий нестандартный, просто опишите его на последнем шаге.</p>
          </div>
        )}

        {step === 3 && (
          <div className="animate-fade-in-up">
            <p className="text-[11px] text-foreground/80 mb-2">Район / город</p>
            <div className="flex flex-wrap gap-1">
              {districts.slice(0, 16).map((value) => (
                <button
                  key={value}
                  onClick={() => setDistrict(value)}
                  className={`px-2 py-1 text-[11px] transition-all ${
                    district === value
                      ? "bg-foreground/[0.06] text-primary border border-primary/20"
                      : "bg-muted text-foreground hover:bg-muted/70 hover:text-primary"
                  }`}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="animate-fade-in-up min-w-0">
            <p className="text-[11px] text-foreground/80 mb-2">Бюджет, ₽ {deal === "Аренда" ? "(в месяц)" : ""}</p>
            <div className="flex gap-1.5 mb-2 min-w-0">
              <input
                type="number"
                inputMode="numeric"
                value={budgetMin}
                onChange={(e) => setBudgetMin(e.target.value)}
                placeholder="от"
                className="flex-1 min-w-0 w-full px-2 py-1.5 bg-muted text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-muted/70"
              />
              <input
                type="number"
                inputMode="numeric"
                value={budgetMax}
                onChange={(e) => setBudgetMax(e.target.value)}
                placeholder="до"
                className="flex-1 min-w-0 w-full px-2 py-1.5 bg-muted text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-muted/70"
              />
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="animate-fade-in-up min-w-0">
            <p className="text-[11px] text-foreground/80 mb-2">Площадь, м²</p>
            <div className="flex gap-1.5 mb-2 min-w-0">
              <input
                type="number"
                inputMode="numeric"
                value={areaMin}
                onChange={(e) => setAreaMin(e.target.value)}
                placeholder="от"
                className="flex-1 min-w-0 w-full px-2 py-1.5 bg-muted text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-muted/70"
              />
              <input
                type="number"
                inputMode="numeric"
                value={areaMax}
                onChange={(e) => setAreaMax(e.target.value)}
                placeholder="до"
                className="flex-1 min-w-0 w-full px-2 py-1.5 bg-muted text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-muted/70"
              />
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="animate-fade-in-up space-y-2.5">
            {!isLandFlow && classOptions.length > 1 && (
              <div>
                <p className="text-[11px] text-foreground/80 mb-1.5">Класс</p>
                <div className="flex flex-wrap gap-1">
                  {classOptions.map((value) => (
                    <button
                      key={value}
                      onClick={() => setPropertyClass(value)}
                      className={`px-2 py-1 text-[11px] transition-all ${
                        propertyClass === value
                          ? "bg-foreground/[0.06] text-primary border border-primary/20"
                          : "bg-muted text-foreground hover:bg-muted/70 hover:text-primary"
                      }`}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-[11px] text-foreground/80 mb-1.5">{isLandFlow ? "Какой участок нужен" : "Состояние"}</p>
              <div className="flex flex-wrap gap-1">
                {(isLandFlow ? LAND_CONDITIONS : ["Любое", "С отделкой", "Под отделку", "Black box", "Косметический ремонт"]).map((value) => (
                  <button
                    key={value}
                    onClick={() => setCondition(value)}
                    className={`px-2 py-1 text-[11px] transition-all ${
                      condition === value
                        ? "bg-foreground/[0.06] text-primary border border-primary/20"
                        : "bg-muted text-foreground hover:bg-muted/70 hover:text-primary"
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 7 && (
          <div className="animate-fade-in-up space-y-2.5 min-w-0">
            {featureOptions.length > 0 && (
              <div>
                <p className="text-[11px] text-foreground/80 mb-1.5">{isLandFlow ? "Что важно на участке" : "Ключевые характеристики"}</p>
                <div className="flex flex-wrap gap-1.5">
                  {featureOptions.map((label) => {
                    const active = selectedFeatures.includes(label);
                    const Icon = featureIcon(label);
                    return (
                      <button
                        key={label}
                        onClick={() => toggleFeature(label)}
                        className={`inline-flex items-center gap-1 px-2 py-1 text-[11px] transition-all ${
                          active
                            ? "bg-foreground/[0.06] text-primary border border-primary/20"
                            : "bg-muted text-foreground hover:bg-muted/70 hover:text-primary"
                        }`}
                      >
                        <Icon className="w-3 h-3" /> {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="min-w-0">
              <p className="text-[11px] text-foreground/80 mb-1.5">{isLandFlow ? "Комментарий" : "Опишите задачу своими словами"}</p>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={isLandFlow ? "Например: первая линия, подъезд для фур, рядом электричество и вода..." : "Например: нужен офис с парковкой, входной группой и хорошим ремонтом..."}
                rows={3}
                className="w-full min-w-0 px-2 py-1.5 bg-muted text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-muted/70 resize-none"
              />
            </div>
          </div>
        )}

        <div className="sticky bottom-0 -mx-3 mt-3 border-t border-border bg-card/95 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
          <button
            onClick={back}
            disabled={step === 0}
            className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-primary disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors"
          >
            <ChevronLeft className="w-3 h-3" /> Назад
          </button>
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-[10px] text-muted-foreground">{shortlist.length} подходящих</span>
            {step < STEPS.length - 1 ? (
              <button onClick={next} className="inline-flex items-center gap-0.5 text-[11px] font-medium text-primary hover:opacity-80 transition-opacity">
                Далее <ChevronRight className="w-3 h-3" />
              </button>
            ) : (
              <button onClick={runAI} className="inline-flex items-center gap-1 rounded-md px-3 py-1.5 text-[11px] font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
                ИИ-подбор <Sparkles className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
