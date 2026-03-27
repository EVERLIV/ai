import { Home, UserPlus, LogIn } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";

export default function ResidentialSection() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section ref={ref} id="Жилая аренда" className="py-20">
      <div className={`container mx-auto px-4 lg:px-8 ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}>
        <div className="bg-card rounded-3xl shadow-card overflow-hidden flex flex-col lg:flex-row">
          {/* Left — info */}
          <div className="flex-1 p-8 lg:p-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-medium mb-4">
              <Home className="w-3.5 h-3.5" />
              Жилая аренда
            </div>
            <h2 className="font-display text-3xl font-bold text-foreground mb-4">
              Сдайте жильё бесплатно
            </h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              Зарегистрируйтесь на платформе и разместите объявление о сдаче жилой недвижимости совершенно бесплатно.
              Квартиры, комнаты, дома — ваше объявление увидят тысячи потенциальных арендаторов в Иркутске и области.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <UserPlus className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">Простая регистрация</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Создайте аккаунт за 1 минуту по email</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Home className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">Бесплатное размещение</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Никаких платежей — полностью бесплатно для жилой аренды</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <LogIn className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-foreground">Личный кабинет</div>
                  <div className="text-xs text-muted-foreground mt-0.5">Управляйте объявлениями, отвечайте на запросы</div>
                </div>
              </div>
            </div>

            <p className="text-xs text-muted-foreground italic">
              * Коммерческая недвижимость размещается только агентством АрендаСити.
              Раздел жилой аренды открыт для всех зарегистрированных пользователей.
            </p>
          </div>

          {/* Right — CTA */}
          <div className="flex-1 bg-surface-warm p-8 lg:p-12 flex flex-col items-center justify-center text-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <Home className="w-10 h-10 text-primary" />
            </div>
            <h3 className="font-display text-xl font-semibold text-foreground mb-3">
              Разместите объявление
            </h3>
            <p className="text-sm text-muted-foreground mb-8 max-w-sm">
              Войдите или зарегистрируйтесь, чтобы добавить объявление о сдаче жилья в Иркутске
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
              <button className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity">
                Регистрация
              </button>
              <button className="flex-1 py-3 rounded-xl border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors">
                Войти
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Для работы раздела необходимо подключить Lovable Cloud
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
