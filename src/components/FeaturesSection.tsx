import { Brain, BarChart3, Bell, FileText } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const features = [
  {
    icon: Brain,
    title: "ИИ-подбор",
    desc: "Опишите задачу голосом или текстом, ИИ найдёт лучшие варианты за секунды",
  },
  {
    icon: BarChart3,
    title: "Аналитика рынка",
    desc: "Динамика ставок, вакантность, тренды по районам в реальном времени",
  },
  {
    icon: Bell,
    title: "Умные уведомления",
    desc: "Получайте оповещения о новых объектах по вашим критериям",
  },
  {
    icon: FileText,
    title: "Онлайн-сделки",
    desc: "Электронные договоры, проверка объектов, безопасные расчёты",
  },
];

export default function FeaturesSection() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section ref={ref} className="py-20">
      <div className={`container mx-auto px-4 lg:px-8 ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}>
        <p className="text-sm font-medium tracking-widest uppercase text-primary text-center mb-2">Возможности</p>
        <h2 className="font-display text-3xl font-bold text-foreground text-center mb-12">
          Умные функции платформы
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.title}
                className="bg-card rounded-2xl shadow-card p-6 hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display text-lg font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
