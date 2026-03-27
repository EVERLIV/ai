import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useState } from "react";
import { List, Map } from "lucide-react";

const markers = [
  { x: 45, y: 35, label: "ЦАО" },
  { x: 55, y: 50, label: "ЮАО" },
  { x: 35, y: 55, label: "ЗАО" },
  { x: 60, y: 30, label: "СВАО" },
  { x: 30, y: 40, label: "СЗАО" },
  { x: 70, y: 45, label: "ВАО" },
];

export default function MapSection() {
  const { ref, isVisible } = useScrollReveal();
  const [view, setView] = useState<"map" | "list">("map");

  return (
    <section ref={ref} className="py-16 bg-surface-warm">
      <div className={`container mx-auto px-4 lg:px-8 ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}>
        <div className="flex items-end justify-between mb-8">
          <h2 className="font-display text-3xl font-bold text-foreground">Объекты на карте</h2>
          <div className="flex bg-card rounded-lg shadow-card overflow-hidden">
            <button
              onClick={() => setView("map")}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${view === "map" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              <Map className="w-4 h-4" /> Карта
            </button>
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium transition-colors ${view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
            >
              <List className="w-4 h-4" /> Список
            </button>
          </div>
        </div>

        <div className="bg-card rounded-2xl shadow-card overflow-hidden flex flex-col lg:flex-row" style={{ minHeight: 400 }}>
          {/* Map area */}
          <div className="flex-1 relative bg-gradient-to-br from-secondary to-muted p-4">
            {/* Grid lines */}
            <div className="absolute inset-4 opacity-10">
              {[...Array(8)].map((_, i) => (
                <div key={`h${i}`} className="absolute w-full h-px bg-foreground" style={{ top: `${(i + 1) * 11}%` }} />
              ))}
              {[...Array(8)].map((_, i) => (
                <div key={`v${i}`} className="absolute h-full w-px bg-foreground" style={{ left: `${(i + 1) * 11}%` }} />
              ))}
            </div>

            {/* Markers */}
            {markers.map((m) => (
              <div
                key={m.label}
                className="absolute flex flex-col items-center"
                style={{ left: `${m.x}%`, top: `${m.y}%`, transform: "translate(-50%, -50%)" }}
              >
                <div className="relative">
                  <div className="w-3 h-3 rounded-full bg-primary z-10 relative" />
                  <div className="absolute inset-0 w-3 h-3 rounded-full bg-primary map-pulse" />
                </div>
                <span className="mt-1.5 text-xs font-medium text-foreground bg-card/80 px-1.5 py-0.5 rounded">
                  {m.label}
                </span>
              </div>
            ))}
          </div>

          {/* Sidebar results */}
          <div className="w-full lg:w-72 border-t lg:border-t-0 lg:border-l border-border p-4 space-y-3 overflow-y-auto max-h-[400px]">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Найдено 847 объектов</p>
            {["ЦАО — 245 объектов", "ЮАО — 189 объектов", "СВАО — 134 объекта", "ЗАО — 112 объектов", "СЗАО — 98 объектов", "ВАО — 69 объектов"].map((item) => (
              <div key={item} className="px-3 py-2.5 rounded-lg hover:bg-muted transition-colors cursor-pointer text-sm text-foreground">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
