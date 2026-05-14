import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  ShieldCheck, TrendingUp, Camera, FileText, Users,
  CheckCircle2, Send, User, Phone as PhoneIcon, Mail,
  Star, BadgeCheck, Clock3, ArrowRight, Building2, KeyRound, BarChart3,
} from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import consultantAvatar from "@/assets/consultant-anastasia.jpg";

type Mode = "management" | "rent";

interface Props {
  variant?: "page" | "section";
}

const steps = [
  {
    n: "1",
    title: "Подберём лучшего менеджера",
    body: "Персональный менеджер изучит ваш объект и предложит оптимальную стратегию сдачи — цену, условия, целевую аудиторию.",
  },
  {
    n: "2",
    title: "Подготовим объект к успешной аренде",
    body: "Сделаем профессиональные фото, напишем продающее описание и оценим рыночную стоимость аренды.",
  },
  {
    n: "3",
    title: "Ваше объявление увидят все",
    body: "Размещаем объект в нашем каталоге, SEO-страницах и партнёрских площадках — чтобы найти арендатора быстрее.",
  },
  {
    n: "4",
    title: "Звонки и просмотры — взяли на себя",
    body: "Менеджер сам принимает звонки, организует показы и отсеивает неподходящих кандидатов. Вам только принять решение.",
  },
];

const perks = [
  {
    icon: ShieldCheck,
    title: "Проверенные арендаторы",
    body: "Проверяем платёжеспособность и деловую репутацию каждого кандидата перед показом.",
  },
  {
    icon: FileText,
    title: "Договор и документы",
    body: "Юридическое сопровождение от А до Я: договор, акты, контроль оплат и индексации.",
  },
  {
    icon: Camera,
    title: "Фото и маркетинг",
    body: "Профессиональная съёмка и продающее описание объекта — за наш счёт.",
  },
  {
    icon: BarChart3,
    title: "Аналитика и отчёты",
    body: "Ежемесячный отчёт о состоянии объекта, платежах и рыночной ситуации.",
  },
  {
    icon: Users,
    title: "Поток заявок",
    body: "Целевые арендаторы из каталога, SEO и партнёрских каналов — без лишних звонков для вас.",
  },
  {
    icon: TrendingUp,
    title: "Доход без простоев",
    body: "Средний срок сдачи — 14 дней. Контролируем заполняемость и вовремя начинаем поиск нового арендатора.",
  },
];

const stats = [
  { value: "320+", label: "объектов под управлением" },
  { value: "14 дн.", label: "средний срок сдачи" },
  { value: "98%", label: "клиентов возвращаются" },
];

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
        name, phone,
        email: email || null,
        message: `Тип: ${mode === "management" ? "Управление" : "Сдача"}\nАдрес: ${address}\nПлощадь: ${area} м²\n${message}`,
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

  const isPage = variant === "page";

  return (
    <div ref={ref} className={`${isPage ? "pt-0" : ""} ${isVisible ? "animate-fade-in-up" : "opacity-0"}`}>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="bg-muted/60 border-b border-border py-16 lg:py-20">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-primary text-xs font-semibold uppercase tracking-widest mb-3">
              Сдайте на АрендаСити
            </p>
            <h1 className="font-display text-4xl lg:text-5xl font-bold leading-tight text-foreground mb-6">
              Передайте объект —<br />мы возьмём управление
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed mb-8 max-w-xl">
              АрендаСити берёт под контроль поиск арендаторов, юридическое сопровождение, контроль платежей и обслуживание — вы получаете доход без забот.
            </p>

            {/* Mode switcher */}
            <div className="flex gap-3 flex-wrap mb-8">
              <button
                onClick={() => setMode("management")}
                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border transition-all ${
                  mode === "management"
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-muted-foreground border-border hover:border-foreground/40"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                Передать в управление
              </button>
              <button
                onClick={() => setMode("rent")}
                className={`flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border transition-all ${
                  mode === "rent"
                    ? "bg-foreground text-background border-foreground"
                    : "bg-background text-muted-foreground border-border hover:border-foreground/40"
                }`}
              >
                <KeyRound className="w-4 h-4" />
                Разместить в каталоге
              </button>
            </div>

            {/* Stats row */}
            <div className="flex flex-wrap gap-8">
              {stats.map((s) => (
                <div key={s.label}>
                  <div className="font-display text-2xl font-bold text-foreground">{s.value}</div>
                  <div className="text-muted-foreground text-xs mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── ЧТО ВЫ ПОЛУЧИТЕ ─────────────────────────────── */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">Что вы получите</h2>
          <p className="text-sm text-muted-foreground mb-10">
            {mode === "management"
              ? "Полное операционное управление — от поиска до контроля платежей"
              : "Профессиональное размещение и поток целевых заявок"}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {perks.map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-card border border-border p-6 flex flex-col gap-3">
                <div className="w-10 h-10 bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-semibold text-sm text-foreground">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ПРОЙДЁМ С ВАМИ ВЕСЬ ПУТЬ ────────────────────── */}
      <section className="py-16 bg-card border-y border-border">
        <div className="container mx-auto px-4 lg:px-8">
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">Пройдём с вами весь путь</h2>
          <p className="text-sm text-muted-foreground mb-12">
            Прозрачный процесс от заявки до подписания договора
          </p>
          <div className="space-y-0">
            {steps.map((step, i) => (
              <div
                key={step.n}
                className={`grid lg:grid-cols-2 gap-0 border border-border ${i > 0 ? "border-t-0" : ""}`}
              >
                {/* Text side */}
                <div className={`p-8 lg:p-10 flex gap-6 items-start ${i % 2 === 1 ? "lg:order-2" : ""}`}>
                  <div className="shrink-0 w-10 h-10 bg-primary flex items-center justify-center">
                    <span className="text-primary-foreground font-bold text-sm">{step.n}</span>
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-bold text-foreground mb-2">{step.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.body}</p>
                  </div>
                </div>
                {/* Visual side */}
                <div className={`hidden lg:flex bg-muted items-center justify-center min-h-[200px] border-l border-border ${i % 2 === 1 ? "lg:order-1 border-l-0 border-r border-border" : ""}`}>
                  <StepVisual n={step.n} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ФОРМА + КОНСУЛЬТАНТ ──────────────────────────── */}
      <section className="py-16 bg-background" id="list-property">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 items-start">

            {/* Consultant card */}
            <div className="space-y-6">
              <div>
                <h2 className="font-display text-2xl font-bold text-foreground mb-2">
                  Оставьте заявку — перезвоним за 30 минут
                </h2>
                <p className="text-sm text-muted-foreground">
                  Персональный менеджер ответит на все вопросы и подберёт оптимальный формат сотрудничества.
                </p>
              </div>

              {/* Agent */}
              <div className="flex items-center gap-4 p-5 border border-border bg-card">
                <div className="relative shrink-0">
                  <img
                    src={consultantAvatar}
                    alt="Анастасия Романова"
                    className="w-16 h-16 object-cover ring-2 ring-primary/20"
                  />
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 ring-2 ring-card" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground">Анастасия Романова</span>
                    <BadgeCheck className="w-4 h-4 text-primary shrink-0" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Менеджер по коммерческой недвижимости</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="font-semibold text-foreground">4.9</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock3 className="w-3.5 h-3.5" /> ~12 мин ответ
                    </span>
                    <span className="text-xs text-muted-foreground">47 объектов</span>
                  </div>
                </div>
              </div>

              {/* Checklist */}
              <ul className="space-y-3">
                {[
                  "Бесплатная оценка объекта",
                  "Фотосъёмка за наш счёт",
                  "Договор без скрытых платежей",
                  "Поиск арендатора за 14 дней",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-foreground">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>

              <a
                href="tel:+73952551234"
                className="inline-flex items-center gap-2 px-5 py-3 bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                <PhoneIcon className="w-4 h-4" />
                +7 (3952) 55-12-34
              </a>
            </div>

            {/* Form */}
            <div className="bg-card border border-border p-7">
              {sent ? (
                <div className="py-12 flex flex-col items-center gap-4 text-center">
                  <CheckCircle2 className="w-14 h-14 text-primary" />
                  <h3 className="font-display text-xl font-bold text-foreground">Заявка принята</h3>
                  <p className="text-sm text-muted-foreground">Менеджер свяжется с вами в течение 30 минут.</p>
                  <Button variant="outline" onClick={() => setSent(false)}>Отправить ещё одну</Button>
                </div>
              ) : (
                <>
                  <div className="mb-6">
                    <div className="flex gap-2 mb-5">
                      <button
                        type="button"
                        onClick={() => setMode("management")}
                        className={`flex-1 py-2 text-xs font-semibold border transition-colors ${
                          mode === "management"
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-muted-foreground border-border hover:border-primary/40"
                        }`}
                      >
                        <Building2 className="w-3.5 h-3.5 inline mr-1.5" />
                        Управление
                      </button>
                      <button
                        type="button"
                        onClick={() => setMode("rent")}
                        className={`flex-1 py-2 text-xs font-semibold border transition-colors ${
                          mode === "rent"
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background text-muted-foreground border-border hover:border-primary/40"
                        }`}
                      >
                        <KeyRound className="w-3.5 h-3.5 inline mr-1.5" />
                        Каталог
                      </button>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-3">
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
                    <div className="grid grid-cols-2 gap-3">
                      <Input name="address" placeholder="Адрес объекта" className="h-11" />
                      <Input name="area" placeholder="Площадь, м²" inputMode="numeric" className="h-11" />
                    </div>
                    <Textarea name="message" placeholder="Тип объекта, желаемая ставка, особенности…" rows={3} className="resize-none text-sm" />
                    <Button type="submit" disabled={loading} className="w-full h-11 gap-2">
                      <Send className="w-4 h-4" />
                      {loading ? "Отправка…" : mode === "management" ? "Передать в управление" : "Разместить объект"}
                    </Button>
                    <p className="text-[10px] text-muted-foreground text-center">
                      Нажимая кнопку, вы соглашаетесь с обработкой персональных данных
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function StepVisual({ n }: { n: string }) {
  const visuals: Record<string, React.ReactNode> = {
    "1": (
      <div className="p-6 w-full max-w-[260px]">
        <div className="bg-card border border-border p-4 space-y-3">
          <div className="flex items-center gap-3">
            <img src={consultantAvatar} alt="" className="w-10 h-10 object-cover" />
            <div>
              <div className="h-2.5 w-24 bg-muted" />
              <div className="h-2 w-16 bg-muted mt-1.5" />
            </div>
          </div>
          <div className="space-y-1.5">
            {["Объекты на Карла Маркса", "Склад в Ангарске", "ТЦ Иркутск-1"].map((t) => (
              <div key={t} className="flex items-center gap-2 py-1.5">
                <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-xs text-foreground">{t}</span>
                <ArrowRight className="w-3 h-3 text-muted-foreground ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    "2": (
      <div className="p-6 w-full max-w-[260px] space-y-3">
        <div className="bg-card border border-border p-3 flex gap-3 items-center">
          <Camera className="w-8 h-8 text-primary" />
          <div>
            <div className="text-xs font-semibold text-foreground">Фотосъёмка</div>
            <div className="text-[11px] text-muted-foreground">Профессиональный фотограф</div>
          </div>
        </div>
        <div className="bg-card border border-border p-3 flex gap-3 items-center">
          <TrendingUp className="w-8 h-8 text-primary" />
          <div>
            <div className="text-xs font-semibold text-foreground">Оценка рынка</div>
            <div className="text-[11px] text-muted-foreground">44 500 ₽ / мес</div>
          </div>
        </div>
        <div className="bg-card border border-border p-3 flex gap-3 items-center">
          <FileText className="w-8 h-8 text-primary" />
          <div>
            <div className="text-xs font-semibold text-foreground">Описание</div>
            <div className="text-[11px] text-muted-foreground">Готово к публикации</div>
          </div>
        </div>
      </div>
    ),
    "3": (
      <div className="p-6 w-full max-w-[260px]">
        <div className="bg-card border border-border p-4 space-y-2">
          <div className="text-[11px] font-semibold text-foreground mb-3">Охват объявления</div>
          {[
            { label: "Каталог АрендаСити", w: "w-full", v: "1 840" },
            { label: "SEO-страницы", w: "w-4/5", v: "920" },
            { label: "Партнёрские сайты", w: "w-3/5", v: "430" },
          ].map((r) => (
            <div key={r.label}>
              <div className="flex justify-between text-[10px] text-muted-foreground mb-1">
                <span>{r.label}</span><span>{r.v}</span>
              </div>
              <div className="h-1.5 bg-muted">
                <div className={`h-full bg-primary ${r.w}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    "4": (
      <div className="p-6 w-full max-w-[260px] space-y-2">
        {[
          { from: "Менеджер", text: "Показ завтра в 11:00 — подходит?", mine: false },
          { from: "Арендатор", text: "Да, подтверждаю", mine: true },
          { from: "Менеджер", text: "Отлично! Договор готов к подписанию", mine: false },
        ].map((m, i) => (
          <div key={i} className={`flex ${m.mine ? "justify-end" : ""}`}>
            <div className={`max-w-[80%] px-3 py-2 text-[11px] leading-snug ${
              m.mine ? "bg-primary text-primary-foreground" : "bg-card border border-border text-foreground"
            }`}>
              {!m.mine && <div className="text-[9px] text-muted-foreground mb-0.5">{m.from}</div>}
              {m.text}
            </div>
          </div>
        ))}
      </div>
    ),
  };

  return (
    <div className="flex items-center justify-center w-full h-full min-h-[220px]">
      {visuals[n] ?? null}
    </div>
  );
}
