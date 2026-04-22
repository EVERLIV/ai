import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Sparkles, Building2, Store, Warehouse, TreePine, Factory,
  ArrowRight, RotateCcw, MapPin, Check, Wand2,
} from "lucide-react";
import type { DbProperty } from "@/hooks/useProperties";

type Deal = "Аренда" | "Продажа";
type Budget = "low" | "mid" | "high" | "any";
type Size = "small" | "medium" | "large" | "any";

const TYPES = [
  { label: "Офис", icon: Building2 },
  { label: "Торговая", icon: Store },
  { label: "Склад", icon: Warehouse },
  { label: "Производство", icon: Factory },
  { label: "Земля", icon: TreePine },
];

const BUDGETS: { key: Budget; label: string; hint: string }[] = [
  { key: "low",  label: "Эконом",   hint: "до 100 ₽/м²·мес" },
  { key: "mid",  label: "Средний",  hint: "100–500 ₽/м²·мес" },
  { key: "high", label: "Премиум",  hint: "от 500 ₽/м²·мес" },
  { key: "any",  label: "Любой",    hint: "не важно" },
];

const SIZES: { key: Size; label: string; hint: string }[] = [
  { key: "small",  label: "До 100 м²" , hint: "малый формат" },
  { key: "medium", label: "100–500 м²", hint: "средний" },
  { key: "large",  label: "От 500 м²" , hint: "большой" },
  { key: "any",    label: "Любая"     , hint: "не важно" },
];

function matchBudget(p: DbProperty, b: Budget) {
  if (b === "any") return true;
  const ppm = Number(p.price_per_m2) || (Number(p.price) / Math.max(1, Number(p.area)));
  if (b === "low")  return ppm <= 100;
  if (b === "mid")  return ppm > 100 && ppm <= 500;
  if (b === "high") return ppm > 500;
  return true;
}

function matchSize(p: DbProperty, s: Size) {
  const a = Number(p.area) || 0;
  if (s === "any") return true;
  if (s === "small")  return a <= 100;
  if (s === "medium") return a > 100 && a <= 500;
  if (s === "large")  return a > 500;
  return true;
}

export default function AIPropertyWizard({ properties }: { properties: DbProperty[] }) {
  const [step, setStep] = useState<0 | 1 | 2 | 3>(0);
  const [deal, setDeal] = useState<Deal | null>(null);
  const [type, setType] = useState<string | null>(null);
  const [budget, setBudget] = useState<Budget | null>(null);
  const [size, setSize] = useState<Size | null>(null);

  const matches = useMemo(() => {
    if (step !== 3 || !deal || !type || !budget || !size) return [];
    return properties
      .filter((p) => p.deal_type === deal)
      .filter((p) => p.type === type)
      .filter((p) => matchBudget(p, budget))
      .filter((p) => matchSize(p, size))
      .sort((a, b) => Number(a.price) - Number(b.price))
      .slice(0, 3);
  }, [step, deal, type, budget, size, properties]);

  const reset = () => {
    setStep(0); setDeal(null); setType(null); setBudget(null); setSize(null);
  };

  // ─── Header ───
  const Header = (
    <div className="flex items-center gap-2 px-3 pt-3 pb-2">
      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary to-gold flex items-center justify-center shadow-sm">
        <Wand2 className="w-3 h-3 text-primary-foreground" />
      </div>
      <div className="flex-1">
        <div className="text-[11px] font-semibold text-foreground leading-tight">ИИ-подбор объекта</div>
        <div className="text-[10px] text-muted-foreground leading-tight">
          {step === 3 ? "Готово · подходящие варианты" : `Шаг ${step + 1} из 3`}
        </div>
      </div>
      {step > 0 && (
        <button onClick={reset} title="Начать заново"
          className="p-1 rounded-md text-muted-foreground hover:text-primary transition-colors">
          <RotateCcw className="w-3 h-3" />
        </button>
      )}
    </div>
  );

  // ─── Progress ───
  const Progress = (
    <div className="px-3 pb-2 flex gap-1">
      {[0, 1, 2].map((i) => (
        <div key={i}
          className={`h-1 flex-1 rounded-full transition-all duration-500 ${
            step > i ? "bg-gradient-to-r from-primary to-gold" :
            step === i ? "bg-primary/40" : "bg-muted"
          }`}
        />
      ))}
    </div>
  );

  return (
    <div className="rounded-xl bg-gradient-to-br from-primary/5 via-transparent to-gold/5 ring-1 ring-primary/10">
      {Header}
      {Progress}

      <div className="px-3 pb-3">
        {/* Step 0: тип сделки */}
        {step === 0 && (
          <div className="animate-fade-in-up">
            <p className="text-[11px] text-foreground/80 mb-2">
              Что вы ищете — <span className="text-primary font-medium">аренду</span> или <span className="text-primary font-medium">покупку</span>?
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {(["Аренда", "Продажа"] as Deal[]).map((d) => (
                <button
                  key={d}
                  onClick={() => { setDeal(d); setStep(1); }}
                  className="group px-2 py-2 rounded-lg text-[11px] font-medium border border-border hover:border-primary hover:bg-primary/5 transition-all duration-200 text-foreground"
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 1: тип объекта */}
        {step === 1 && (
          <div className="animate-fade-in-up">
            <p className="text-[11px] text-foreground/80 mb-2">
              Какой <span className="text-primary font-medium">тип объекта</span> подходит?
            </p>
            <div className="flex flex-wrap gap-1.5">
              {TYPES.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  onClick={() => { setType(label); setStep(2); }}
                  className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-[11px] border border-border hover:border-primary hover:bg-primary/5 hover:text-primary transition-all"
                >
                  <Icon className="w-3 h-3" /> {label}
                </button>
              ))}
            </div>
            <button onClick={() => setStep(0)}
              className="mt-2 text-[10px] text-muted-foreground hover:text-primary transition-colors">
              ← Назад
            </button>
          </div>
        )}

        {/* Step 2: бюджет + площадь */}
        {step === 2 && (
          <div className="animate-fade-in-up space-y-2.5">
            <div>
              <p className="text-[11px] text-foreground/80 mb-1.5">Бюджет на м²</p>
              <div className="grid grid-cols-2 gap-1.5">
                {BUDGETS.map((b) => (
                  <button key={b.key} onClick={() => setBudget(b.key)}
                    className={`px-2 py-1.5 rounded-lg text-[11px] border transition-all text-left ${
                      budget === b.key
                        ? "border-primary bg-primary/10 text-foreground shadow-sm"
                        : "border-border hover:border-primary/60 text-foreground"
                    }`}>
                    <div className="flex items-center gap-1 font-medium">
                      {budget === b.key && <Check className="w-3 h-3 text-primary" />} {b.label}
                    </div>
                    <div className="text-[9px] text-muted-foreground">{b.hint}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[11px] text-foreground/80 mb-1.5">Площадь</p>
              <div className="grid grid-cols-2 gap-1.5">
                {SIZES.map((s) => (
                  <button key={s.key} onClick={() => setSize(s.key)}
                    className={`px-2 py-1.5 rounded-lg text-[11px] border transition-all text-left ${
                      size === s.key
                        ? "border-primary bg-primary/10 text-foreground shadow-sm"
                        : "border-border hover:border-primary/60 text-foreground"
                    }`}>
                    <div className="flex items-center gap-1 font-medium">
                      {size === s.key && <Check className="w-3 h-3 text-primary" />} {s.label}
                    </div>
                    <div className="text-[9px] text-muted-foreground">{s.hint}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <button onClick={() => setStep(1)}
                className="text-[10px] text-muted-foreground hover:text-primary transition-colors">
                ← Назад
              </button>
              <button
                disabled={!budget || !size}
                onClick={() => setStep(3)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-medium bg-gradient-to-r from-primary to-gold text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
              >
                Подобрать <Sparkles className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: results */}
        {step === 3 && (
          <div className="animate-fade-in-up space-y-2">
            <div className="text-[10px] text-muted-foreground">
              {deal} · {type} · {BUDGETS.find((b) => b.key === budget)?.label} · {SIZES.find((s) => s.key === size)?.label}
            </div>

            {matches.length === 0 ? (
              <div className="text-center py-3">
                <div className="text-[11px] text-foreground mb-1">Под запрос ничего не нашлось</div>
                <div className="text-[10px] text-muted-foreground mb-2">Попробуйте смягчить параметры</div>
                <button onClick={reset}
                  className="text-[11px] text-primary font-medium hover:underline">
                  Попробовать снова
                </button>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  {matches.map((p) => (
                    <div key={p.id}
                      className="group rounded-lg border border-border bg-card/50 hover:border-primary/40 hover:bg-card transition-all p-2">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="min-w-0">
                          <div className="text-[11px] font-semibold text-foreground truncate">
                            {Number(p.price).toLocaleString("ru-RU")} ₽
                            {p.deal_type === "Аренда" && <span className="text-muted-foreground font-normal">/мес</span>}
                          </div>
                          <div className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5 shrink-0" /> {p.address}
                          </div>
                        </div>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium shrink-0">
                          {p.area} м²
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Link to={`/property/${p.id}`}
                          className="flex-1 text-center px-2 py-1 rounded-md text-[10px] font-medium text-foreground border border-border hover:border-primary hover:text-primary transition-all">
                          Подробнее
                        </Link>
                        <Link to={`/?focus=${p.id}#map`}
                          className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium bg-gradient-to-r from-primary to-gold text-primary-foreground hover:opacity-90 transition-opacity">
                          На карте <ArrowRight className="w-2.5 h-2.5" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>

                <button onClick={reset}
                  className="w-full inline-flex items-center justify-center gap-1 text-[10px] text-muted-foreground hover:text-primary transition-colors py-1">
                  <RotateCcw className="w-2.5 h-2.5" /> Новый подбор
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
