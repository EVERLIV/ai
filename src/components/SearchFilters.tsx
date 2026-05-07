import { useState } from "react";
import { Sparkles, Search } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

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
  onAIClick: () => void;
  filters?: PropertyFilters;
  onChange?: (f: PropertyFilters) => void;
}

export default function SearchFilters({ onAIClick, filters, onChange }: Props) {
  const [local, setLocal] = useState<PropertyFilters>(filters ?? defaultFilters);
  const f = filters ?? local;
  const set = (patch: Partial<PropertyFilters>) => {
    const next = { ...f, ...patch };
    setLocal(next);
    onChange?.(next);
  };

  const { ref, isVisible } = useScrollReveal();

  const reset = () => set(defaultFilters);
  const scrollToResults = () => {
    document.getElementById("property-results")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <section ref={ref} id="search" className="py-16 bg-surface-warm">
      <div className={`container mx-auto px-4 lg:px-8 ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}>
        <h2 className="font-display text-3xl font-bold text-foreground text-center mb-8">
          Поиск объектов
        </h2>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => set({ type: t })}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                f.type === t
                  ? "bg-primary text-primary-foreground shadow-float"
                  : "bg-card text-muted-foreground hover:text-foreground shadow-card"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Filters row */}
        <div className="bg-card rounded-2xl shadow-card p-6 flex flex-col lg:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Площадь, м²</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="от"
                value={f.areaMin || ""}
                onChange={(e) => set({ areaMin: +e.target.value || 0 })}
                className="w-full px-3 py-2.5 rounded-lg bg-muted text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="text-muted-foreground text-xs">—</span>
              <input
                type="number"
                placeholder="до"
                value={f.areaMax >= 100000 ? "" : f.areaMax}
                onChange={(e) => set({ areaMax: +e.target.value || 100000 })}
                className="w-full px-3 py-2.5 rounded-lg bg-muted text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex-1 w-full">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Цена, ₽/мес</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="от"
                value={f.priceMin || ""}
                onChange={(e) => set({ priceMin: +e.target.value || 0 })}
                className="w-full px-3 py-2.5 rounded-lg bg-muted text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="text-muted-foreground text-xs">—</span>
              <input
                type="number"
                placeholder="до"
                value={f.priceMax >= 100000000 ? "" : f.priceMax}
                onChange={(e) => set({ priceMax: +e.target.value || 100000000 })}
                className="w-full px-3 py-2.5 rounded-lg bg-muted text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex-1 w-full">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Район / Город</label>
            <select
              value={f.district}
              onChange={(e) => set({ district: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg bg-muted text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {districts.map((d) => <option key={d} value={d}>{d === "Все" ? "Все районы" : d}</option>)}
            </select>
          </div>

          <div className="flex-1 w-full">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Класс</label>
            <select
              value={f.cls}
              onChange={(e) => set({ cls: e.target.value })}
              className="w-full px-3 py-2.5 rounded-lg bg-muted text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            >
              {classes.map((c) => <option key={c} value={c}>{c === "Все" ? "Любой" : c}</option>)}
            </select>
          </div>

          <button
            onClick={scrollToResults}
            className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Search className="w-4 h-4" />
            Найти
          </button>
          <button
            onClick={onAIClick}
            className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gold text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Sparkles className="w-4 h-4" />
            Подбор с ИИ
          </button>
        </div>

        <div className="text-center mt-3">
          <button onClick={reset} className="text-xs text-muted-foreground hover:text-primary transition-colors">
            Сбросить фильтры
          </button>
        </div>
      </div>
    </section>
  );
}
