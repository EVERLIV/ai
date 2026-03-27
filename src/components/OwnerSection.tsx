import { CheckCircle2, Phone, Building } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

const perks = [
  "Профессиональная оценка и фотосъёмка",
  "Полное юридическое сопровождение",
  "База проверенных арендаторов",
  "Без комиссии для собственников",
  "Реклама на всех площадках",
];

export default function OwnerSection() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section ref={ref} id="Сдать объект" className="py-20">
      <div className={`container mx-auto px-4 lg:px-8 ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}>
        <div className="bg-card rounded-3xl shadow-card overflow-hidden flex flex-col lg:flex-row">
          {/* Left */}
          <div className="flex-1 p-8 lg:p-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/15 text-gold-dark text-xs font-medium mb-4">
              <Building className="w-3.5 h-3.5" />
              Для собственников
            </div>
            <h2 className="font-display text-3xl font-bold text-foreground mb-4">
              Доверьте аренду профессионалам
            </h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              АрендаСити — агентство коммерческой недвижимости в Иркутске. 
              Мы берём объекты собственников в управление и находим надёжных арендаторов. 
              Вы получаете стабильный доход без лишних забот.
            </p>
            <div className="space-y-3 mb-8">
              {perks.map((p) => (
                <div key={p} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  <span className="text-sm text-foreground">{p}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — contact form */}
          <div className="flex-1 bg-surface-warm p-8 lg:p-12">
            <h3 className="font-display text-xl font-semibold text-foreground mb-2">Оставьте заявку</h3>
            <p className="text-sm text-muted-foreground mb-6">Мы свяжемся с вами в течение 1 рабочего дня</p>
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
              <textarea
                placeholder="Адрес и описание объекта"
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary border border-border resize-none"
              />
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                Отправить заявку
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
