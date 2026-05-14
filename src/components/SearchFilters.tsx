import { useState } from "react";
import { Search, X } from "lucide-react";

export type PropertyFilters = {
  type: string;
  areaMin: number;
  areaMax: number;
  priceMin: number;
  priceMax: number;
  district: string;
  cls: string;
};

export const defaultFilters: PropertyFilters = {
  type: "Все",
  areaMin: 0,
  areaMax: 100000,
  priceMin: 0,
  priceMax: 100000000,
  district: "Все",
  cls: "Все",
};

const tabs = ["Все", "Офис", "Торговая", "Склад", "ПСН", "Земля"];
const districts = ["Все", "Кировский", "Октябрьский", "Свердловский", "Ленинский", "Куйбышевский", "Ангарск", "Шелехов", "Усолье-Сибирское"];
const classes = ["Все", "A", "B", "C"];

const SELECT_CLS = "w-full h-9 pl-3 pr-8 bg-background border border-border text-sm text-foreground focus:outline-none focus:border-foreground/40 transition-colors appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%23888%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22square%22%3E%3Cpath%20d%3D%22M6%209l6%206%206-6%22%2F%3E%3C%2Fsvg%3E')] bg-no-repeat bg-[right_10px_center]";
const INPUT_CLS  = "w-full h-9 px-3 bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-foreground/40 transition-colors";

interface Props {
  onAIClick: () => void;
  filters?: PropertyFilters;
  onChange?: (f: PropertyFilters) => void;
}

function isDirty(f: PropertyFilters) {
  return f.type !== "Все" || f.areaMin > 0 || f.areaMax < 100000
    || f.priceMin > 0 || f.priceMax < 100000000
    || f.district !== "Все" || f.cls !== "Все";
}

export default function SearchFilters({ filters, onChange }: Props) {
  const [local, setLocal] = useState<PropertyFilters>(filters ?? defaultFilters);
  const f = filters ?? local;

  const set = (patch: Partial<PropertyFilters>) => {
    const next = { ...f, ...patch };
    setLocal(next);
    onChange?.(next);
  };

  const reset = () => set(defaultFilters);

  const scrollToResults = () =>
    document.getElementById("property-results")?.scrollIntoView({ behavior: "smooth", block: "start" });

  const dirty = isDirty(f);

  return (
    <section id="search" className="bg-muted/40 border-b border-border">
      <div className="container mx-auto px-4 lg:px-8 py-5">

        {/* Type tabs — compact pill row */}
        <div className="flex items-center gap-1.5 flex-wrap mb-4">
          <span className="text-xs text-muted-foreground mr-1 shrink-0">Тип:</span>
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => set({ type: t })}
              className={`h-7 px-3 text-xs font-medium transition-colors duration-150 border ${
                f.type === t
                  ? "bg-foreground text-background border-foreground"
                  : "bg-background text-muted-foreground border-border hover:text-foreground hover:border-foreground/30"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-end">

          {/* Area */}
          <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Площадь, м²</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                placeholder="от"
                value={f.areaMin || ""}
                onChange={(e) => set({ areaMin: +e.target.value || 0 })}
                className={INPUT_CLS}
              />
              <span className="text-muted-foreground text-xs shrink-0">—</span>
              <input
                type="number"
                placeholder="до"
                value={f.areaMax >= 100000 ? "" : f.areaMax}
                onChange={(e) => set({ areaMax: +e.target.value || 100000 })}
                className={INPUT_CLS}
              />
            </div>
          </div>

          {/* Price */}
          <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Цена, ₽/мес</span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                placeholder="от"
                value={f.priceMin || ""}
                onChange={(e) => set({ priceMin: +e.target.value || 0 })}
                className={INPUT_CLS}
              />
              <span className="text-muted-foreground text-xs shrink-0">—</span>
              <input
                type="number"
                placeholder="до"
                value={f.priceMax >= 100000000 ? "" : f.priceMax}
                onChange={(e) => set({ priceMax: +e.target.value || 100000000 })}
                className={INPUT_CLS}
              />
            </div>
          </div>

          {/* District */}
          <div className="flex flex-col gap-1 flex-1 min-w-[130px]">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Район</span>
            <select value={f.district} onChange={(e) => set({ district: e.target.value })} className={SELECT_CLS}>
              {districts.map((d) => <option key={d} value={d}>{d === "Все" ? "Все районы" : d}</option>)}
            </select>
          </div>

          {/* Class */}
          <div className="flex flex-col gap-1 w-24 shrink-0">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Класс</span>
            <select value={f.cls} onChange={(e) => set({ cls: e.target.value })} className={SELECT_CLS}>
              {classes.map((c) => <option key={c} value={c}>{c === "Все" ? "Любой" : c}</option>)}
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-end gap-2 shrink-0">
            <button
              onClick={scrollToResults}
              className="h-9 px-5 flex items-center gap-1.5 bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <Search className="w-3.5 h-3.5" />
              Найти
            </button>
            {dirty && (
              <button
                onClick={reset}
                title="Сбросить"
                className="h-9 w-9 flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Active filter summary */}
        {dirty && (
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-muted-foreground">Активны:</span>
            {f.type !== "Все" && <Chip label={f.type} onRemove={() => set({ type: "Все" })} />}
            {(f.areaMin > 0 || f.areaMax < 100000) && (
              <Chip
                label={`${f.areaMin || "0"}–${f.areaMax >= 100000 ? "∞" : f.areaMax} м²`}
                onRemove={() => set({ areaMin: 0, areaMax: 100000 })}
              />
            )}
            {(f.priceMin > 0 || f.priceMax < 100000000) && (
              <Chip
                label={`${f.priceMin ? (f.priceMin / 1000).toFixed(0) + "К" : "0"}–${f.priceMax >= 100000000 ? "∞" : (f.priceMax / 1000).toFixed(0) + "К"} ₽`}
                onRemove={() => set({ priceMin: 0, priceMax: 100000000 })}
              />
            )}
            {f.district !== "Все" && <Chip label={f.district} onRemove={() => set({ district: "Все" })} />}
            {f.cls !== "Все" && <Chip label={`Класс ${f.cls}`} onRemove={() => set({ cls: "Все" })} />}
            <button onClick={reset} className="text-[10px] text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors">
              Сбросить всё
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 h-5 pl-2 pr-1 bg-foreground/8 border border-border text-[10px] text-foreground">
      {label}
      <button onClick={onRemove} className="text-muted-foreground hover:text-foreground transition-colors">
        <X className="w-2.5 h-2.5" />
      </button>
    </span>
  );
}
