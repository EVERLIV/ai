import { useScrollReveal } from "@/hooks/useScrollReveal";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";

const rateData = [
  { q: "Q1'23", rate: 8200 },
  { q: "Q2'23", rate: 8500 },
  { q: "Q3'23", rate: 8900 },
  { q: "Q4'23", rate: 9100 },
  { q: "Q1'24", rate: 9400 },
  { q: "Q2'24", rate: 9800 },
  { q: "Q3'24", rate: 10200 },
  { q: "Q4'24", rate: 10500 },
];

const pieData = [
  { name: "Офисы", value: 42 },
  { name: "Торговля", value: 25 },
  { name: "Склады", value: 20 },
  { name: "Земля", value: 8 },
  { name: "Другое", value: 5 },
];

const PIE_COLORS = [
  "hsl(0, 72%, 51%)",
  "hsl(38, 75%, 55%)",
  "hsl(220, 25%, 35%)",
  "hsl(35, 30%, 70%)",
  "hsl(220, 10%, 75%)",
];

export default function AnalyticsDashboard() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section ref={ref} className="py-20 bg-surface-cool">
      <div className={`container mx-auto px-4 lg:px-8 ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}>
        <p className="text-sm font-medium tracking-widest uppercase text-primary text-center mb-2">Аналитика</p>
        <h2 className="font-display text-3xl font-bold text-foreground text-center mb-12">
          Рынок Иркутска — сегодня
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Line chart */}
          <div className="bg-card rounded-2xl shadow-card p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Средняя ставка аренды офисов, ₽/м²/год</h3>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={rateData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(35, 15%, 88%)" />
                <XAxis dataKey="q" tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 45%)" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(220, 10%, 45%)" />
                <Tooltip
                  formatter={(v: number) => [`${v.toLocaleString("ru-RU")} ₽`, "Ставка"]}
                  contentStyle={{ borderRadius: 10, border: "1px solid hsl(35, 15%, 88%)" }}
                />
                <Line type="monotone" dataKey="rate" stroke="hsl(0, 72%, 51%)" strokeWidth={2.5} dot={{ fill: "hsl(0, 72%, 51%)", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Pie chart */}
          <div className="bg-card rounded-2xl shadow-card p-6">
            <h3 className="text-sm font-semibold text-foreground mb-4">Распределение по типам объектов</h3>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={55} paddingAngle={3}>
                    {pieData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`${v}%`, "Доля"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap justify-center gap-3 mt-4">
              {pieData.map((d, i) => (
                <div key={d.name} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                  {d.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
