import { Search } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useCountUp } from "@/hooks/useCountUp";
import { useState } from "react";
import heroImg from "@/assets/hero-commercial.jpg";

const stats = [
  { value: 1850, suffix: "+", label: "объектов" },
  { value: 24, suffix: "", label: "города региона" },
  { value: 97, suffix: "%", label: "довольных клиентов" },
];

export default function HeroSection() {
  const { ref, isVisible } = useScrollReveal(0.1);
  const [searchType, setSearchType] = useState("Офис");

  const c1 = useCountUp(stats[0].value, 2200, isVisible);
  const c2 = useCountUp(stats[1].value, 2000, isVisible);
  const c3 = useCountUp(stats[2].value, 1800, isVisible);
  const counts = [c1, c2, c3];

  return (
    <section ref={ref} className="hero-mesh min-h-screen flex items-center pt-16">
      <div className="container mx-auto px-4 lg:px-8 py-20">
        <div className={`max-w-3xl mx-auto text-center ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}>
          <p className="text-sm font-medium tracking-widest uppercase text-primary mb-4">
            Коммерческая недвижимость Иркутска
          </p>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground leading-tight mb-6">
            Аренда коммерческой
            <br />
            <span className="text-primary">недвижимости</span> в Иркутске
          </h1>
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            Офисы, торговые площади, склады и земельные участки в Иркутске и Иркутской области. Профессиональный подбор от агентства.
          </p>

          {/* Search bar */}
          <div className="bg-card rounded-2xl shadow-card p-2 flex flex-col sm:flex-row gap-2 max-w-2xl mx-auto">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl bg-muted text-sm text-foreground focus:outline-none"
            >
              <option>Офис</option>
              <option>Торговая площадь</option>
              <option>Склад</option>
              <option>Земля</option>
            </select>
            <input
              type="text"
              placeholder="Район или улица"
              className="flex-1 px-4 py-3 rounded-xl bg-muted text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <input
              type="text"
              placeholder="Площадь от–до м²"
              className="flex-1 px-4 py-3 rounded-xl bg-muted text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
            <button className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl text-sm font-medium hover:opacity-90 transition-opacity shrink-0">
              <Search className="w-4 h-4" />
              Найти
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className={`flex justify-center gap-8 sm:gap-16 mt-16 ${isVisible ? "animate-fade-in-up" : "opacity-0"}`} style={{ animationDelay: "0.3s" }}>
          {stats.map((s, i) => (
            <div key={s.label} className="text-center">
              <div className="font-display text-3xl sm:text-4xl font-bold text-foreground">
                {counts[i].toLocaleString("ru-RU")}{s.suffix}
              </div>
              <div className="text-sm text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
