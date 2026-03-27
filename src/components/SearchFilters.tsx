import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const tabs = ["Офисы", "Торговля", "Склады", "ПСН", "Земля", "Готовый бизнес"];

export default function SearchFilters({ onAIClick }: { onAIClick: () => void }) {
  const [active, setActive] = useState(0);
  const [area, setArea] = useState([30, 400]);
  const [price, setPrice] = useState([15000, 200000]);
  const { ref, isVisible } = useScrollReveal();

  return (
    <section ref={ref} id="search" className="py-16 bg-surface-warm">
      <div className={`container mx-auto px-4 lg:px-8 ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}>
        <h2 className="font-display text-3xl font-bold text-foreground text-center mb-8">
          Поиск объектов
        </h2>

        {/* Tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {tabs.map((t, i) => (
            <button
              key={t}
              onClick={() => setActive(i)}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                active === i
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
                value={area[0]}
                onChange={(e) => setArea([+e.target.value, area[1]])}
                className="w-full px-3 py-2.5 rounded-lg bg-muted text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="text-muted-foreground text-xs">—</span>
              <input
                type="number"
                value={area[1]}
                onChange={(e) => setArea([area[0], +e.target.value])}
                className="w-full px-3 py-2.5 rounded-lg bg-muted text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex-1 w-full">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Цена, ₽/мес</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={price[0]}
                onChange={(e) => setPrice([+e.target.value, price[1]])}
                className="w-full px-3 py-2.5 rounded-lg bg-muted text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <span className="text-muted-foreground text-xs">—</span>
              <input
                type="number"
                value={price[1]}
                onChange={(e) => setPrice([price[0], +e.target.value])}
                className="w-full px-3 py-2.5 rounded-lg bg-muted text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          <div className="flex-1 w-full">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Район / Город</label>
            <select className="w-full px-3 py-2.5 rounded-lg bg-muted text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
              <option>Все районы</option>
              <option>Кировский</option>
              <option>Октябрьский</option>
              <option>Свердловский</option>
              <option>Ленинский</option>
              <option>Куйбышевский</option>
              <option>Ангарск</option>
              <option>Шелехов</option>
              <option>Усолье-Сибирское</option>
            </select>
          </div>

          <div className="flex-1 w-full">
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Класс</label>
            <select className="w-full px-3 py-2.5 rounded-lg bg-muted text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
              <option>Любой</option>
              <option>A</option>
              <option>B</option>
              <option>C</option>
            </select>
          </div>

          <button
            onClick={onAIClick}
            className="shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gold text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Sparkles className="w-4 h-4" />
            Подбор с ИИ
          </button>
        </div>
      </div>
    </section>
  );
}
