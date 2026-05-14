import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Quote, ShieldCheck, TrendingUp, Users, Award } from "lucide-react";
import managerPhoto from "@/assets/manager-arenda-city.jpg";
import NewsSidebar from "@/components/NewsSidebar";

const stats = [
  { icon: TrendingUp, value: "12+", label: "лет на рынке" },
  { icon: Users, value: "850+", label: "арендаторов" },
  { icon: ShieldCheck, value: "320+", label: "объектов в управлении" },
  { icon: Award, value: "98%", label: "повторных сделок" },
];

export default function AboutSection() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section ref={ref} id="about" className="py-20 bg-surface-warm">
      <div className={`container mx-auto px-4 lg:px-8 ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}>
        <div className="max-w-2xl mb-12">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold tracking-wide uppercase mb-4">
            О компании
          </span>
          <h2 className="font-display text-4xl lg:text-5xl font-bold text-foreground leading-tight">
            АРЕНДА<span className="text-primary">СИТИ</span> — экспертиза в коммерческой недвижимости Иркутска
          </h2>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Main content */}
          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Photo + quote */}
              <div className="lg:col-span-7 relative overflow-hidden bg-foreground min-h-[440px]">
                <img
                  src={managerPhoto}
                  alt="Менеджер АрендаСити"
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover opacity-95"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/95 via-foreground/40 to-transparent" />
                <div className="relative h-full flex flex-col justify-end p-8 lg:p-10 text-background">
                  <Quote className="w-10 h-10 text-primary mb-3 -ml-1" />
                  <blockquote className="font-display text-xl lg:text-2xl leading-snug font-medium max-w-xl">
                    «Мы не сдаём квадратные метры — мы помогаем бизнесу расти.
                    Каждый объект подбираем под задачу клиента, а не наоборот.»
                  </blockquote>
                  <div className="mt-5 flex items-center gap-3">
                    <div className="w-10 h-px bg-primary" />
                    <div>
                      <div className="text-sm font-semibold">Анастасия Зорина</div>
                      <div className="text-xs text-background/70">Директор АрендаСити</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats + text */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <div className="bg-card p-7 shadow-card flex-1">
                  <h3 className="font-display text-xl font-bold text-foreground mb-3">
                    Полный цикл управления коммерческой недвижимостью
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5">
                    Подбор арендаторов, юридическое сопровождение, контроль платежей,
                    управление рекламными конструкциями и постоянная аналитика портфеля.
                    Работаем в Иркутске, Ангарске и Шелехове с 2013 года.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {stats.map((s) => {
                      const Icon = s.icon;
                      return (
                        <div key={s.label} className="bg-surface-warm p-4">
                          <Icon className="w-4 h-4 text-primary mb-2" />
                          <div className="font-display text-2xl font-bold text-foreground leading-none">{s.value}</div>
                          <div className="text-[11px] text-muted-foreground mt-1.5 leading-tight">{s.label}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="bg-foreground text-background p-7 shadow-card">
                  <div className="text-xs uppercase tracking-wider text-background/60 mb-2">Наш подход</div>
                  <p className="text-base font-medium leading-relaxed">
                    Один менеджер ведёт сделку от показа до подписания договора —
                    без передачи между отделами и потери контекста.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <NewsSidebar />
        </div>
      </div>
    </section>
  );
}
