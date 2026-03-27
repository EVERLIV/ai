import { CheckCircle2 } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const perks = [
  "850 000+ потенциальных арендаторов",
  "Бесплатное размещение на 30 дней",
  "Верификация объектов",
  "Персональный менеджер",
];

export default function OwnerSection() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section ref={ref} className="py-20">
      <div className={`container mx-auto px-4 lg:px-8 ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}>
        <div className="bg-card rounded-3xl shadow-card overflow-hidden flex flex-col lg:flex-row">
          {/* Left */}
          <div className="flex-1 p-8 lg:p-12">
            <p className="text-sm font-medium tracking-widest uppercase text-primary mb-2">Для владельцев</p>
            <h2 className="font-display text-3xl font-bold text-foreground mb-6">
              Разместите объект бесплатно
            </h2>
            <div className="space-y-4 mb-8">
              {perks.map((p) => (
                <div key={p} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-sm text-foreground">{p}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — form */}
          <div className="flex-1 bg-surface-warm p-8 lg:p-12">
            <h3 className="font-display text-xl font-semibold text-foreground mb-6">Добавить объект</h3>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <input
                type="text"
                placeholder="Ваше имя"
                className="w-full px-4 py-3 rounded-xl bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary border border-border"
              />
              <input
                type="tel"
                placeholder="Телефон"
                className="w-full px-4 py-3 rounded-xl bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary border border-border"
              />
              <select className="w-full px-4 py-3 rounded-xl bg-card text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary border border-border">
                <option>Тип объекта</option>
                <option>Офис</option>
                <option>Торговая площадь</option>
                <option>Склад</option>
                <option>Земля</option>
              </select>
              <input
                type="text"
                placeholder="Площадь, м²"
                className="w-full px-4 py-3 rounded-xl bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary border border-border"
              />
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Отправить заявку
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
