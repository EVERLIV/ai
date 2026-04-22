import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Sparkles, Building2, Store, Warehouse, TreePine, Factory,
  ArrowRight, RotateCcw, MapPin, Check, Wand2, Loader2,
  Coffee, ShoppingBag, Briefcase, Utensils, Dumbbell, Stethoscope,
  GraduationCap, Wrench, Truck, Car, Wifi, Snowflake, ShieldCheck, Zap,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import type { DbProperty } from "@/hooks/useProperties";

type Deal = "Аренда" | "Продажа" | "Любое";

const DEALS: Deal[] = ["Аренда", "Продажа", "Любое"];

const TYPES = [
  { label: "Офис", icon: Building2 },
  { label: "Торговая", icon: Store },
  { label: "Склад", icon: Warehouse },
  { label: "Производство", icon: Factory },
  { label: "Земля", icon: TreePine },
];

const ACTIVITIES = [
  { label: "Кафе / Ресторан", icon: Utensils },
  { label: "Кофейня", icon: Coffee },
  { label: "Магазин", icon: ShoppingBag },
  { label: "Офис компании", icon: Briefcase },
  { label: "Фитнес / Студия", icon: Dumbbell },
  { label: "Медцентр / Клиника", icon: Stethoscope },
  { label: "Образование", icon: GraduationCap },
  { label: "Услуги / Сервис", icon: Wrench },
  { label: "Логистика", icon: Truck },
];

const CLASSES = ["Любой", "A+", "A", "B+", "B", "C"];
const CONDITIONS = ["Любое", "С отделкой", "Под отделку", "Black box", "Косметический ремонт"];

const FEATURES = [
  { label: "Парковка", icon: Car },
  { label: "Wi-Fi", icon: Wifi },
  { label: "Кондиционер", icon: Snowflake },
  { label: "Охрана", icon: ShieldCheck },
  { label: "Высокая мощность", icon: Zap },
];

const STEPS = [
  "Сделка", "Тип", "Деятельность", "Район", "Бюджет", "Площадь", "Класс / Состояние", "Удобства",
] as const;

type AIPick = {
  id: string;
  fit_score: number;
  reason: string;
  highlights: string[];
};

type AIResponse = {
  summary: string;
  picks: AIPick[];
};

export default function AIPropertyWizard({ properties }: { properties: DbProperty[] }) {
  const { toast } = useToast();
  const [step, setStep] = useState(0);

  // criteria
  const [deal, setDeal] = useState<Deal>("Любое");
  const [type, setType] = useState<string>("");
  const [activity, setActivity] = useState<string>("");
  const [district, setDistrict] = useState<string>("Любой");
  const [budgetMin, setBudgetMin] = useState("");
  const [budgetMax, setBudgetMax] = useState("");
  const [areaMin, setAreaMin] = useState("");
  const [areaMax, setAreaMax] = useState("");
  const [propertyClass, setPropertyClass] = useState("Любой");
  const [condition, setCondition] = useState("Любое");
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  // result state
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIResponse | null>(null);
  const [showResult, setShowResult] = useState(false);

  const districts = useMemo(
    () => ["Любой", ...Array.from(new Set(properties.map((p) => p.district))).filter(Boolean)],
    [properties],
  );

  const reset = () => {
    setStep(0); setDeal("Любое"); setType(""); setActivity("");
    setDistrict("Любой"); setBudgetMin(""); setBudgetMax("");
    setAreaMin(""); setAreaMax(""); setPropertyClass("Любой");
    setCondition("Любое"); setSelectedFeatures([]); setNotes("");
    setResult(null); setShowResult(false);
  };

  const toggleFeature = (f: string) => {
    setSelectedFeatures((p) => p.includes(f) ? p.filter((x) => x !== f) : [...p, f]);
  };

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  const propertiesById = useMemo(
    () => Object.fromEntries(properties.map((p) => [p.id, p])),
    [properties],
  );

  // Pre-filter properties to keep prompt small and relevant
  const shortlist = useMemo(() => {
    return properties.filter((p) => {
      if (deal !== "Любое" && p.deal_type !== deal) return false;
      if (type && p.type !== type) return false;
      if (district !== "Любой" && p.district !== district) return false;
      if (propertyClass !== "Любой" && p.class !== propertyClass) return false;
      if (budgetMin && Number(p.price) < Number(budgetMin)) return false;
      if (budgetMax && Number(p.price) > Number(budgetMax)) return false;
      if (areaMin && Number(p.area) < Number(areaMin)) return false;
      if (areaMax && Number(p.area) > Number(areaMax)) return false;
      return true;
    });
  }, [properties, deal, type, district, propertyClass, budgetMin, budgetMax, areaMin, areaMax]);

  const runAI = async () => {
    setLoading(true);
    setShowResult(true);
    try {
      const liteList = (shortlist.length ? shortlist : properties).slice(0, 60).map((p) => ({
        id: p.id, type: p.type, deal_type: p.deal_type, district: p.district,
        address: p.address, price: Number(p.price), price_per_m2: Number(p.price_per_m2),
        area: Number(p.area), class: p.class, condition: p.condition,
        features: p.features, floor: p.floor, total_floors: p.total_floors,
        ceiling_height: p.ceiling_height ? Number(p.ceiling_height) : null,
      }));

      const { data, error } = await supabase.functions.invoke("ai-property-pick", {
        body: {
          criteria: {
            deal, type, activity, district,
            budget_min: budgetMin ? Number(budgetMin) : null,
            budget_max: budgetMax ? Number(budgetMax) : null,
            area_min: areaMin ? Number(areaMin) : null,
            area_max: areaMax ? Number(areaMax) : null,
            property_class: propertyClass, condition,
            features: selectedFeatures, notes,
          },
          properties: liteList,
        },
      });

      if (error) throw error;
      if (data?.error) {
        toast({ title: "ИИ-подбор", description: data.error, variant: "destructive" });
        setResult(null);
        return;
      }
      setResult(data as AIResponse);
    } catch (e: any) {
      toast({ title: "Ошибка ИИ-подбора", description: e?.message || "Попробуйте позже", variant: "destructive" });
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  // ── Header ──
  const Header = (
    <div className="flex items-center gap-2 px-3 pt-3 pb-2">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary to-gold flex items-center justify-center shadow-sm">
        <Wand2 className="w-3.5 h-3.5 text-primary-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-semibold text-foreground leading-tight">ИИ-подбор объекта</div>
        <div className="text-[10px] text-muted-foreground leading-tight truncate">
          {showResult ? (loading ? "ИИ анализирует..." : "Результат подбора") : `Шаг ${step + 1} из ${STEPS.length} · ${STEPS[step]}`}
        </div>
      </div>
      {(step > 0 || showResult) && (
        <button onClick={reset} title="Начать заново"
          className="p-1 rounded-md text-muted-foreground hover:text-primary transition-colors">
          <RotateCcw className="w-3 h-3" />
        </button>
      )}
    </div>
  );

  // ── Progress ──
  const Progress = (
    <div className="px-3 pb-2 flex gap-0.5">
      {STEPS.map((_, i) => (
        <div key={i}
          className={`h-1 flex-1 rounded-full transition-all duration-500 ${
            (showResult || step > i) ? "bg-gradient-to-r from-primary to-gold" :
            step === i ? "bg-primary/40" : "bg-muted"
          }`}
        />
      ))}
    </div>
  );

  // ── Result view ──
  if (showResult) {
    return (
      <div className="rounded-xl bg-gradient-to-br from-primary/5 via-transparent to-gold/5 ring-1 ring-primary/10">
        {Header}
        {Progress}
        <div className="px-3 pb-3 space-y-2">
          {loading ? (
            <div className="py-6 flex flex-col items-center gap-2">
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
              <div className="text-[11px] text-muted-foreground">ИИ анализирует {shortlist.length || properties.length} объектов...</div>
            </div>
          ) : !result || result.picks.length === 0 ? (
            <div className="py-3 text-center">
              <div className="text-[11px] text-foreground mb-1">ИИ не нашёл подходящих вариантов</div>
              <div className="text-[10px] text-muted-foreground mb-2">{result?.summary || "Попробуйте смягчить параметры"}</div>
              <button onClick={reset} className="text-[11px] text-primary font-medium hover:underline">
                Новый подбор
              </button>
            </div>
          ) : (
            <>
              {/* AI summary */}
              <div className="rounded-lg bg-card/60 border border-primary/15 p-2.5">
                <div className="flex items-start gap-1.5">
                  <Sparkles className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                  <div className="text-[10.5px] text-foreground/90 leading-relaxed">{result.summary}</div>
                </div>
              </div>

              {/* picks */}
              <div className="space-y-1.5">
                {result.picks.map((pick) => {
                  const p = propertiesById[pick.id];
                  if (!p) return null;
                  return (
                    <div key={pick.id}
                      className="rounded-lg border border-border bg-card/60 hover:border-primary/40 transition-all p-2.5 space-y-2">
                      {/* score + price */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[12px] font-bold text-foreground truncate">
                            {Number(p.price).toLocaleString("ru-RU")} ₽
                            {p.deal_type === "Аренда" && <span className="text-muted-foreground font-normal text-[10px]">/мес</span>}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5 shrink-0" /> {p.address}
                          </div>
                          <div className="text-[10px] text-muted-foreground mt-0.5">
                            {p.type} · {p.area} м² · {p.district}
                          </div>
                        </div>
                        <div className="shrink-0 text-center">
                          <div className="text-[14px] font-bold bg-gradient-to-br from-primary to-gold bg-clip-text text-transparent leading-none">
                            {pick.fit_score}
                          </div>
                          <div className="text-[8px] text-muted-foreground uppercase tracking-wider">match</div>
                        </div>
                      </div>

                      {/* AI reason */}
                      <div className="text-[10.5px] text-foreground/85 leading-relaxed border-l-2 border-primary/40 pl-2">
                        {pick.reason}
                      </div>

                      {/* highlights */}
                      {pick.highlights?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {pick.highlights.map((h, i) => (
                            <span key={i} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] bg-primary/10 text-primary font-medium">
                              <Check className="w-2 h-2" /> {h}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* actions */}
                      <div className="flex gap-1">
                        <Link to={`/property/${p.id}`}
                          className="flex-1 text-center px-2 py-1 text-[10px] font-medium text-foreground bg-muted hover:bg-muted/70 hover:text-primary transition-all">
                          Подробнее
                        </Link>
                        <Link to={`/?focus=${p.id}#map`}
                          className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 text-[10px] font-medium bg-gradient-to-r from-primary to-gold text-primary-foreground hover:opacity-90 transition-opacity">
                          На карте <ArrowRight className="w-2.5 h-2.5" />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>

              <button onClick={reset}
                className="w-full inline-flex items-center justify-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors py-1.5 mt-1">
                <RotateCcw className="w-2.5 h-2.5" /> Новый подбор
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Steps ──
  return (
    <div className="bg-gradient-to-br from-primary/5 via-transparent to-gold/5 min-w-0 overflow-hidden">
      {Header}
      {Progress}

      <div className="px-3 pb-3 min-h-[120px] min-w-0">
        {/* 0: deal */}
        {step === 0 && (
          <div className="animate-fade-in-up">
            <p className="text-[11px] text-foreground/80 mb-2">Тип сделки</p>
            <div className="grid grid-cols-3 gap-1.5">
              {DEALS.map((d) => (
                <button key={d} onClick={() => { setDeal(d); next(); }}
                  className={`px-2 py-2 rounded-lg text-[11px] font-medium border transition-all ${
                    deal === d
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border hover:border-primary text-foreground hover:bg-primary/5"
                  }`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 1: type */}
        {step === 1 && (
          <div className="animate-fade-in-up">
            <p className="text-[11px] text-foreground/80 mb-2">Тип объекта</p>
            <div className="flex flex-wrap gap-1.5">
              {TYPES.map(({ label, icon: Icon }) => (
                <button key={label}
                  onClick={() => { setType(label); next(); }}
                  className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] border transition-all ${
                    type === label
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border hover:border-primary hover:text-primary"
                  }`}>
                  <Icon className="w-3 h-3" /> {label}
                </button>
              ))}
            </div>
            <button onClick={() => { setType(""); next(); }}
              className="mt-2 text-[10px] text-muted-foreground hover:text-primary transition-colors">
              Пропустить →
            </button>
          </div>
        )}

        {/* 2: activity */}
        {step === 2 && (
          <div className="animate-fade-in-up">
            <p className="text-[11px] text-foreground/80 mb-2">Вид деятельности</p>
            <div className="flex flex-wrap gap-1.5">
              {ACTIVITIES.map(({ label, icon: Icon }) => (
                <button key={label} onClick={() => setActivity(label)}
                  className={`inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] border transition-all ${
                    activity === label
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border hover:border-primary hover:text-primary"
                  }`}>
                  <Icon className="w-3 h-3" /> {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 3: district */}
        {step === 3 && (
          <div className="animate-fade-in-up">
            <p className="text-[11px] text-foreground/80 mb-2">Район / город</p>
            <div className="flex flex-wrap gap-1">
              {districts.slice(0, 12).map((d) => (
                <button key={d} onClick={() => setDistrict(d)}
                  className={`px-2 py-1 rounded-md text-[11px] border transition-all ${
                    district === d
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border hover:border-primary hover:text-primary"
                  }`}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 4: budget */}
        {step === 4 && (
          <div className="animate-fade-in-up">
            <p className="text-[11px] text-foreground/80 mb-2">
              Бюджет, ₽ {deal === "Аренда" ? "(в месяц)" : ""}
            </p>
            <div className="flex gap-1.5 mb-2">
              <input type="number" value={budgetMin} onChange={(e) => setBudgetMin(e.target.value)}
                placeholder="от"
                className="flex-1 px-2 py-1.5 bg-transparent text-[11px] text-foreground border-b border-border focus:outline-none focus:border-primary" />
              <input type="number" value={budgetMax} onChange={(e) => setBudgetMax(e.target.value)}
                placeholder="до"
                className="flex-1 px-2 py-1.5 bg-transparent text-[11px] text-foreground border-b border-border focus:outline-none focus:border-primary" />
            </div>
            <div className="flex flex-wrap gap-1">
              {[
                { label: "до 50К", min: "", max: "50000" },
                { label: "50–150К", min: "50000", max: "150000" },
                { label: "150–500К", min: "150000", max: "500000" },
                { label: "от 500К", min: "500000", max: "" },
              ].map((q) => (
                <button key={q.label}
                  onClick={() => { setBudgetMin(q.min); setBudgetMax(q.max); }}
                  className="px-1.5 py-0.5 text-[10px] rounded border border-border hover:border-primary hover:text-primary transition-all">
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 5: area */}
        {step === 5 && (
          <div className="animate-fade-in-up">
            <p className="text-[11px] text-foreground/80 mb-2">Площадь, м²</p>
            <div className="flex gap-1.5 mb-2">
              <input type="number" value={areaMin} onChange={(e) => setAreaMin(e.target.value)}
                placeholder="от"
                className="flex-1 px-2 py-1.5 bg-transparent text-[11px] text-foreground border-b border-border focus:outline-none focus:border-primary" />
              <input type="number" value={areaMax} onChange={(e) => setAreaMax(e.target.value)}
                placeholder="до"
                className="flex-1 px-2 py-1.5 bg-transparent text-[11px] text-foreground border-b border-border focus:outline-none focus:border-primary" />
            </div>
            <div className="flex flex-wrap gap-1">
              {[
                { label: "до 50", min: "", max: "50" },
                { label: "50–100", min: "50", max: "100" },
                { label: "100–300", min: "100", max: "300" },
                { label: "300–1000", min: "300", max: "1000" },
                { label: "1000+", min: "1000", max: "" },
              ].map((q) => (
                <button key={q.label}
                  onClick={() => { setAreaMin(q.min); setAreaMax(q.max); }}
                  className="px-1.5 py-0.5 text-[10px] rounded border border-border hover:border-primary hover:text-primary transition-all">
                  {q.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 6: class + condition */}
        {step === 6 && (
          <div className="animate-fade-in-up space-y-2.5">
            <div>
              <p className="text-[11px] text-foreground/80 mb-1.5">Класс</p>
              <div className="flex flex-wrap gap-1">
                {CLASSES.map((c) => (
                  <button key={c} onClick={() => setPropertyClass(c)}
                    className={`px-2 py-1 rounded-md text-[11px] border transition-all ${
                      propertyClass === c
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border hover:border-primary hover:text-primary"
                    }`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] text-foreground/80 mb-1.5">Состояние</p>
              <div className="flex flex-wrap gap-1">
                {CONDITIONS.map((c) => (
                  <button key={c} onClick={() => setCondition(c)}
                    className={`px-2 py-1 rounded-md text-[11px] border transition-all ${
                      condition === c
                        ? "border-primary bg-primary/10 text-foreground"
                        : "border-border hover:border-primary hover:text-primary"
                    }`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 7: features + notes */}
        {step === 7 && (
          <div className="animate-fade-in-up space-y-2.5">
            <div>
              <p className="text-[11px] text-foreground/80 mb-1.5">Удобства</p>
              <div className="flex flex-wrap gap-1.5">
                {FEATURES.map(({ label, icon: Icon }) => {
                  const active = selectedFeatures.includes(label);
                  return (
                    <button key={label} onClick={() => toggleFeature(label)}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] border transition-all ${
                        active
                          ? "border-primary bg-primary/10 text-foreground"
                          : "border-border hover:border-primary hover:text-primary"
                      }`}>
                      <Icon className="w-3 h-3" /> {label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <p className="text-[11px] text-foreground/80 mb-1.5">Доп. пожелания</p>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="Например: рядом метро, отдельный вход, витрина 5м..."
                rows={2}
                className="w-full px-2 py-1.5 bg-transparent text-[11px] text-foreground border border-border rounded-md focus:outline-none focus:border-primary resize-none" />
            </div>
          </div>
        )}

        {/* nav */}
        <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-border/40">
          <button onClick={back} disabled={step === 0}
            className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground hover:text-primary disabled:opacity-30 disabled:hover:text-muted-foreground transition-colors">
            <ChevronLeft className="w-3 h-3" /> Назад
          </button>
          <span className="text-[10px] text-muted-foreground">
            {shortlist.length} подходящих
          </span>
          {step < STEPS.length - 1 ? (
            <button onClick={next}
              className="inline-flex items-center gap-0.5 text-[11px] font-medium text-primary hover:opacity-80 transition-opacity">
              Далее <ChevronRight className="w-3 h-3" />
            </button>
          ) : (
            <button onClick={runAI}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-gradient-to-r from-primary to-gold text-primary-foreground hover:opacity-90 transition-opacity shadow-sm">
              ИИ-подбор <Sparkles className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
