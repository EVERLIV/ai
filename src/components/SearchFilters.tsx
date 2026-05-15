import { useState } from "react";
import { Search, X, ChevronDown } from "lucide-react";

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

interface Props {
  onAIClick?: () => void;
  filters?: PropertyFilters;
  onChange?: (f: PropertyFilters) => void;
}

function isDirty(f: PropertyFilters) {
  return f.type !== "Все" || f.areaMin > 0 || f.areaMax < 100000
    || f.priceMin > 0 || f.priceMax < 100000000
    || f.district !== "Все" || f.cls !== "Все";
}

function RangeInput({ label, valMin, valMax, placeholder, suffix, onMin, onMax }: {
  label: string; valMin: number | string; valMax: number | string;
  placeholder?: string; suffix?: string;
  onMin: (v: string) => void; onMax: (v: string) => void;
}) {
  const [focusMin, setFocusMin] = useState(false);
  const [focusMax, setFocusMax] = useState(false);
  const focused = focusMin || focusMax;
  return (
    <div className="flex-1 min-w-0">
      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{label}</div>
      <div className={`flex items-center bg-background border transition-all duration-150 ${focused ? "border-primary/60 shadow-[0_0_0_2px_hsl(var(--primary)/0.12)]" : "border-border hover:border-border/80"}`}>
        <input
          type="number" placeholder="от" value={valMin || ""}
          onChange={(e) => onMin(e.target.value)}
          onFocus={() => setFocusMin(true)} onBlur={() => setFocusMin(false)}
          className="w-full h-9 px-2.5 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none tabular-nums"
        />
        <span className="text-muted-foreground/40 text-xs px-1 shrink-0">—</span>
        <input
          type="number" placeholder="до" value={valMax || ""}
          onChange={(e) => onMax(e.target.value)}
          onFocus={() => setFocusMax(true)} onBlur={() => setFocusMax(false)}
          className="w-full h-9 px-2.5 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none tabular-nums"
        />
        {suffix && <span className="text-[10px] text-muted-foreground/50 pr-2 shrink-0">{suffix}</span>}
      </div>
    </div>
  );
}

function SelectInput({ label, value, options, onChange }: {
  label: string; value: string; options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex-1 min-w-0">
      <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{label}</div>
      <div className={`relative bg-background border transition-all duration-150 ${focused ? "border-primary/60 shadow-[0_0_0_2px_hsl(var(--primary)/0.12)]" : "border-border hover:border-border/80"}`}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          className="w-full h-9 pl-3 pr-8 bg-transparent text-sm text-foreground focus:outline-none appearance-none cursor-pointer"
        >
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
      </div>
    </div>
  );
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
    <section id="search" className="bg-card border-b border-border/60">
      <div className="container mx-auto px-4 lg:px-8 py-4">

        {/* Type tabs — одна строка, скролл на мобильных */}
        <div className="flex gap-1 overflow-x-auto scrollbar-none mb-4 pb-0.5">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => set({ type: t })}
              className={`h-7 px-3.5 text-xs font-medium whitespace-nowrap shrink-0 transition-all duration-150 active:scale-95 ${
                f.type === t
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Filter row */}
        <div className="flex flex-wrap lg:flex-nowrap gap-2 items-end">

          <RangeInput
            label="Площадь, м²"
            valMin={f.areaMin || ""}
            valMax={f.areaMax >= 100000 ? "" : f.areaMax}
            onMin={(v) => set({ areaMin: +v || 0 })}
            onMax={(v) => set({ areaMax: +v || 100000 })}
          />

          <RangeInput
            label="Цена, ₽/мес"
            valMin={f.priceMin || ""}
            valMax={f.priceMax >= 100000000 ? "" : f.priceMax}
            onMin={(v) => set({ priceMin: +v || 0 })}
            onMax={(v) => set({ priceMax: +v || 100000000 })}
          />

          <SelectInput
            label="Район"
            value={f.district}
            options={districts.map((d) => ({ value: d, label: d === "Все" ? "Все районы" : d }))}
            onChange={(v) => set({ district: v })}
          />

          <div className="w-24 shrink-0">
            <SelectInput
              label="Класс"
              value={f.cls}
              options={classes.map((c) => ({ value: c, label: c === "Все" ? "Любой" : c }))}
              onChange={(v) => set({ cls: v })}
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-1.5 shrink-0 self-end">
            <button
              onClick={scrollToResults}
              className="h-9 px-5 flex items-center gap-1.5 bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 active:scale-[0.97] transition-all duration-150"
            >
              <Search className="w-3.5 h-3.5" />
              Найти
            </button>
            {dirty && (
              <button
                onClick={reset}
                title="Сбросить"
                className="h-9 w-9 flex items-center justify-center border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 active:scale-95 transition-all duration-150"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Active chips */}
        {dirty && (
          <div className="mt-3 flex items-center gap-1.5 flex-wrap">
            {f.type !== "Все" && <Chip label={f.type} onRemove={() => set({ type: "Все" })} />}
            {(f.areaMin > 0 || f.areaMax < 100000) && (
              <Chip label={`${f.areaMin || 0}–${f.areaMax >= 100000 ? "∞" : f.areaMax} м²`} onRemove={() => set({ areaMin: 0, areaMax: 100000 })} />
            )}
            {(f.priceMin > 0 || f.priceMax < 100000000) && (
              <Chip label={`${f.priceMin ? (f.priceMin / 1000).toFixed(0) + "к" : "0"}–${f.priceMax >= 100000000 ? "∞" : (f.priceMax / 1000).toFixed(0) + "к"} ₽`}
                onRemove={() => set({ priceMin: 0, priceMax: 100000000 })} />
            )}
            {f.district !== "Все" && <Chip label={f.district} onRemove={() => set({ district: "Все" })} />}
            {f.cls !== "Все" && <Chip label={`Класс ${f.cls}`} onRemove={() => set({ cls: "Все" })} />}
            <button onClick={reset} className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground transition-colors">
              Сбросить всё
            </button>
          </div>
        )}
      </div>

      <style>{`
        .scrollbar-none::-webkit-scrollbar { display: none; }
        .scrollbar-none { scrollbar-width: none; }
      `}</style>
    </section>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 h-5 pl-2 pr-1 bg-primary/8 text-primary text-[10px] font-medium transition-colors">
      {label}
      <button onClick={onRemove} className="hover:text-primary/60 transition-colors active:scale-90">
        <X className="w-2.5 h-2.5" />
      </button>
    </span>
  );
}
