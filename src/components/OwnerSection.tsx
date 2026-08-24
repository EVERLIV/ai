import { Building, CheckCircle2, Loader2, Phone } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { submitLead } from "@/lib/submitLead";

const perks = [
  "Профессиональная оценка и фотосъёмка",
  "Полное юридическое сопровождение",
  "База проверенных арендаторов",
  "Без комиссии для собственников",
  "Реклама на всех площадках",
];

const fieldClass =
  "w-full px-4 py-3 rounded-md bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-foreground/30 border border-border";

export default function OwnerSection() {
  const { ref, isVisible } = useScrollReveal();
  const { toast } = useToast();
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "").trim();
    const phone = String(fd.get("phone") || "").trim();
    const objectType = String(fd.get("objectType") || "").trim();
    const message = String(fd.get("message") || "").trim();

    if (name.length < 2 || phone.length < 6) {
      toast({ title: "Заполните имя и телефон" });
      return;
    }

    setLoading(true);
    try {
      await submitLead({
        name,
        phone,
        message: message || null,
        source: "homepage_owner",
        business_category: objectType || "Сдать объект",
      });
      setSent(true);
      toast({
        title: "Заявка отправлена!",
        description: "Мы свяжемся с вами в течение 1 рабочего дня.",
      });
    } catch {
      toast({ title: "Не удалось отправить", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section ref={ref} id="Сдать объект" className="py-20">
      <div
        className={`container mx-auto px-4 lg:px-8 ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}
      >
        {/* z-index above the floating consultation widget so the submit button stays clickable */}
        <div className="relative z-[45] bg-card rounded-3xl shadow-card overflow-hidden flex flex-col lg:flex-row">
          <div className="flex-1 p-8 lg:p-12">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gold/15 text-gold-dark text-xs font-medium mb-4">
              <Building className="w-3.5 h-3.5" />
              Для собственников
            </div>
            <h2 className="font-display text-3xl font-bold text-foreground mb-4">
              Доверьте аренду профессионалам
            </h2>
            <p className="text-muted-foreground mb-6 leading-relaxed">
              АрендаСити — агентство коммерческой недвижимости в Иркутске. Мы
              берём объекты собственников в управление и находим надёжных
              арендаторов. Вы получаете стабильный доход без лишних забот.
            </p>
            <div className="space-y-3 mb-8">
              {perks.map((p) => (
                <div key={p} className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-foreground shrink-0" strokeWidth={1.75} />
                  <span className="text-sm text-foreground">{p}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex-1 bg-surface-warm p-8 lg:p-12">
            {sent ? (
              <div className="flex flex-col items-center justify-center text-center py-8 gap-3 min-h-[280px]">
                <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                <h3 className="font-display text-xl font-semibold text-foreground">
                  Заявка отправлена
                </h3>
                <p className="text-sm text-muted-foreground">
                  Мы свяжемся с вами в течение 1 рабочего дня
                </p>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="mt-2 text-sm text-foreground hover:underline"
                >
                  Отправить ещё
                </button>
              </div>
            ) : (
              <>
                <h3 className="font-display text-xl font-semibold text-foreground mb-2">
                  Оставьте заявку
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Мы свяжемся с вами в течение 1 рабочего дня
                </p>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <input
                    name="name"
                    type="text"
                    placeholder="Ваше имя"
                    required
                    autoComplete="name"
                    className={fieldClass}
                  />
                  <input
                    name="phone"
                    type="tel"
                    placeholder="Телефон"
                    required
                    autoComplete="tel"
                    className={fieldClass}
                  />
                  <select
                    name="objectType"
                    defaultValue=""
                    className={fieldClass}
                  >
                    <option value="" disabled>
                      Тип объекта
                    </option>
                    <option value="Офис">Офис</option>
                    <option value="Торговая площадь">Торговая площадь</option>
                    <option value="Склад">Склад</option>
                    <option value="Земля">Земля</option>
                  </select>
                  <textarea
                    name="message"
                    placeholder="Адрес и описание объекта"
                    rows={3}
                    className={`${fieldClass} resize-none`}
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-60 disabled:pointer-events-none"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Phone className="w-4 h-4" />
                    )}
                    {loading ? "Отправка…" : "Отправить заявку"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
