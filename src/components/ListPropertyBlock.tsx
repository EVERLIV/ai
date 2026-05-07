import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Building2, KeyRound, ShieldCheck, TrendingUp, Sparkles, ArrowRight, CheckCircle2, Send, User, Phone as PhoneIcon, Mail } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type Mode = "management" | "rent";

const benefits: Record<Mode, { title: string; subtitle: string; perks: string[]; cta: string }> = {
  management: {
    title: "Передать в управление",
    subtitle: "Мы берём объект под полное управление: ищем арендатора, ведём документы, контролируем платежи и обслуживание.",
    perks: [
      "Поиск и проверка арендаторов",
      "Юридическое сопровождение договоров",
      "Контроль оплат и индексации",
      "Маркетинг и фотосъёмка за наш счёт",
      "Ежемесячный отчёт собственнику",
    ],
    cta: "Передать в управление",
  },
  rent: {
    title: "Сдать через АрендаСити",
    subtitle: "Разместим ваш объект в каталоге и приведём целевых арендаторов. Вы сами выбираете арендатора и подписываете договор.",
    perks: [
      "Размещение в каталоге и на SEO-страницах",
      "Профессиональные фото и описание",
      "Заявки от проверенных компаний",
      "Поддержка менеджера на всех этапах",
      "Без скрытых комиссий",
    ],
    cta: "Сдать объект",
  },
};

interface Props {
  variant?: "page" | "section";
}

export default function ListPropertyBlock({ variant = "section" }: Props) {
  const [mode, setMode] = useState<Mode>("management");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();
  const { ref, isVisible } = useScrollReveal();
  const { search } = useLocation();

  useEffect(() => {
    const m = new URLSearchParams(search).get("mode");
    if (m === "rent" || m === "management") setMode(m);
  }, [search]);

  const data = benefits[mode];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "").trim();
    const phone = String(fd.get("phone") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const address = String(fd.get("address") || "").trim();
    const area = String(fd.get("area") || "").trim();
    const message = String(fd.get("message") || "").trim();

    if (name.length < 2 || phone.length < 6) {
      toast({ title: "Заполните имя и телефон" });
      return;
    }

    setLoading(true);
    try {
      await supabase.from("crm_leads").insert({
        name,
        phone,
        email: email || null,
        message: `Тип заявки: ${mode === "management" ? "Передача в управление" : "Сдача через АрендаСити"}\nАдрес: ${address}\nПлощадь: ${area} м²\n${message}`,
        source: mode === "management" ? "list_property_management" : "list_property_rent",
      });
      setSent(true);
      toast({ title: "Заявка отправлена", description: "Менеджер свяжется в течение 30 минут." });
    } catch {
      toast({ title: "Не удалось отправить", description: "Попробуйте ещё раз или позвоните нам." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      ref={ref}
      id="list-property"
      className={`${variant === "page" ? "py-20 pt-28" : "py-20"} bg-gradient-to-b from-surface-warm to-background scroll-mt-24`}
    >
      <div className={`container mx-auto px-4 lg:px-8 ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}>
        <div className="max-w-3xl mb-10">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold/15 text-gold-dark text-xs font-semibold tracking-wide uppercase mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Для собственников
          </span>
          <h2 className={`font-display ${variant === "page" ? "text-4xl lg:text-5xl" : "text-3xl lg:text-4xl"} font-bold text-foreground leading-tight mb-3`}>
            Разместите объект — получите арендатора <span className="text-primary">за 14 дней</span>
          </h2>
          <p className="text-base text-muted-foreground leading-relaxed">
            Передайте объект под полное управление АрендаСити или просто разместите его в каталоге.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left */}
          <div className="lg:col-span-7 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ModeCard
                active={mode === "management"}
                onClick={() => setMode("management")}
                icon={ShieldCheck}
                title="Под управлением"
                desc="Полный цикл: арендаторы, договоры, платежи, обслуживание."
                badge="Популярно"
              />
              <ModeCard
                active={mode === "rent"}
                onClick={() => setMode("rent")}
                icon={KeyRound}
                title="Сдать через каталог"
                desc="Размещение объекта и поток заявок от проверенных компаний."
              />
            </div>

            <div className="bg-card rounded-3xl p-6 lg:p-7 shadow-card">
              <h3 className="font-display text-xl lg:text-2xl font-bold text-foreground mb-2">{data.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-5">{data.subtitle}</p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {data.perks.map((p) => (
                  <li key={p} className="flex items-start gap-2.5 text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: Building2, value: "320+", label: "объектов" },
                { icon: TrendingUp, value: "14 дн.", label: "ср. срок сдачи" },
                { icon: ShieldCheck, value: "98%", label: "повторных сделок" },
              ].map((s) => {
                const I = s.icon;
                return (
                  <div key={s.label} className="bg-card rounded-2xl p-4 shadow-card">
                    <I className="w-4 h-4 text-primary mb-2" />
                    <div className="font-display text-xl font-bold text-foreground leading-none">{s.value}</div>
                    <div className="text-[11px] text-muted-foreground mt-1.5">{s.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right form */}
          <div className="lg:col-span-5">
            <div className="bg-card rounded-3xl shadow-card p-6 lg:p-7 border border-gold/30">
              {sent ? (
                <div className="text-center py-10 space-y-3">
                  <CheckCircle2 className="w-14 h-14 text-primary mx-auto" />
                  <h3 className="font-display text-lg font-semibold text-foreground">Заявка принята</h3>
                  <p className="text-sm text-muted-foreground">Менеджер свяжется с вами в течение 30 минут.</p>
                  <Button variant="outline" onClick={() => setSent(false)}>Отправить ещё одну</Button>
                </div>
              ) : (
                <>
                  <div className="mb-5">
                    <div className="text-xs uppercase tracking-wider text-gold-dark font-semibold mb-1">Заявка собственника</div>
                    <h3 className="font-display text-xl font-bold text-foreground">{data.cta}</h3>
                    <p className="text-xs text-muted-foreground mt-1">Расскажите об объекте — перезвоним за 30 минут.</p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-2.5">
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input name="name" placeholder="Ваше имя" required className="h-11 pl-9" />
                    </div>
                    <div className="relative">
                      <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input name="phone" type="tel" placeholder="+7 (___) ___-__-__" required className="h-11 pl-9" />
                    </div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input name="email" type="email" placeholder="Email (необязательно)" className="h-11 pl-9" />
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <Input name="address" placeholder="Адрес объекта" className="h-11" />
                      <Input name="area" placeholder="Площадь, м²" inputMode="numeric" className="h-11" />
                    </div>
                    <Textarea name="message" placeholder="Тип, цена, особенности…" rows={3} className="resize-none text-sm" />
                    <Button type="submit" disabled={loading} className="w-full h-11 gap-2">
                      <Send className="w-4 h-4" />
                      {loading ? "Отправка…" : data.cta}
                    </Button>
                    <p className="text-[10px] text-muted-foreground text-center pt-1">
                      Нажимая кнопку, вы соглашаетесь с обработкой персональных данных
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ModeCard({
  active, onClick, icon: Icon, title, desc, badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  title: string;
  desc: string;
  badge?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative text-left rounded-2xl p-5 border-2 transition-all duration-300 ${
        active
          ? "border-primary bg-primary/5 shadow-card"
          : "border-border bg-card hover:border-gold/40 hover:-translate-y-0.5"
      }`}
    >
      {badge && (
        <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-gold text-primary-foreground text-[9px] font-semibold uppercase tracking-wider">
          {badge}
        </span>
      )}
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 transition-colors ${
        active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
      }`}>
        <Icon style={{ width: 18, height: 18 }} />
      </div>
      <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
        {title}
        <ArrowRight className={`w-3.5 h-3.5 transition-transform ${active ? "translate-x-0.5 text-primary" : "text-muted-foreground"}`} />
      </div>
      <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{desc}</p>
    </button>
  );
}
