import { useState } from "react";
import { Link } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import {
  Phone, Mail, MapPin, Clock, Send, ChevronRight, CheckCircle2,
  Building2, Warehouse, Megaphone, Settings, MessageCircle, AlertCircle,
} from "lucide-react";
import { COMPANY, CONTACTS } from "@/config/company";
import { submitLead } from "@/lib/submitLead";
import SeoHead from "@/components/SeoHead";
import { absoluteUrl } from "@/config/site";

/** Направления работы — без вымышленных контактов отделов. */
const services = [
  {
    icon: Building2,
    name: "Офисы и торговые площади",
    desc: "Подбор помещений, консультации по ставкам и условиям рынка",
  },
  {
    icon: Warehouse,
    name: "Склады и производство",
    desc: "Складские и производственные помещения от 100 м²",
  },
  {
    icon: Settings,
    name: "Управление недвижимостью",
    desc: "Поиск арендаторов, договоры, контроль платежей",
  },
  {
    icon: Megaphone,
    name: "Реклама и размещение",
    desc: "Рекламные конструкции, баннеры и вывески",
  },
];

const SUBJECTS = [
  "Аренда офисного помещения",
  "Аренда торговой площади",
  "Аренда склада",
  "Передача в управление",
  "Размещение рекламы",
  "Другое",
];

/** Координаты офиса: Ангарск, 17 микрорайон, 4а — [долгота, широта]. */
const OFFICE_COORDS: [number, number] = [103.8508, 52.50148];

const OFFICE_MAP_SRC = `https://yandex.ru/map-widget/v1/?${new URLSearchParams({
  ll: OFFICE_COORDS.join(","),
  z: "16",
  pt: `${OFFICE_COORDS.join(",")},pm2rdm`,
}).toString()}`;

export default function ContactsPage() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", subject: SUBJECTS[0], message: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = form.name.trim();
    const phone = form.phone.trim();
    if (name.length < 2 || phone.length < 6) {
      setError("Укажите имя и телефон для связи.");
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await submitLead({
        name,
        phone,
        email: form.email.trim() || null,
        message: `Тема: ${form.subject}${form.message.trim() ? `\n${form.message.trim()}` : ""}`,
        source: "contacts_page",
        business_category: form.subject,
      });
      setSent(true);
    } catch {
      setError("Не удалось отправить заявку. Попробуйте ещё раз или позвоните нам.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass =
    "w-full h-11 px-3 bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors";

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      <SeoHead
        title="Контакты АрендаСити"
        description="Телефон, адрес офиса и форма заявки. Агентство коммерческой недвижимости в Иркутске."
        url={absoluteUrl("/contacts")}
      />
      <SiteHeader />

      {/* Breadcrumbs */}
      <div className="sticky top-[56px] md:top-[98px] z-30 mt-[56px] md:mt-[98px] bg-card/90 backdrop-blur-xl shadow-[0_1px_0_0_hsl(var(--border)/0.5)]">
        <div className="container mx-auto px-4 lg:px-8 h-10 flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Главная</Link>
          <span className="opacity-50">/</span>
          <span className="text-foreground">Контакты</span>
        </div>
      </div>

      <main className="flex-1">

        {/* ── HERO: телефон как главный элемент ───────────── */}
        <section className="border-b border-border bg-muted/30">
          <div className="container mx-auto px-4 lg:px-8 py-8 lg:py-14">
            <div className="grid lg:grid-cols-[1.1fr_1fr] gap-8 lg:gap-16 items-start">

              <div className="min-w-0">
                <p className="text-primary text-[11px] font-semibold uppercase tracking-widest mb-2.5">
                  Свяжитесь с нами
                </p>
                <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold leading-[1.05] text-foreground mb-4 text-balance">
                  Ответим на вопросы<br className="hidden sm:block" /> по любому объекту
                </h1>
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-lg">
                  Коммерческая недвижимость в Ангарске, Иркутске и области.
                  Звоните — подберём помещение или организуем показ.
                </p>

                {/* Телефон — фокус страницы */}
                <a
                  href={`tel:${CONTACTS.phoneTel}`}
                  className="group mt-7 inline-flex items-baseline gap-3 font-display text-3xl sm:text-4xl lg:text-[2.75rem] font-bold tracking-tight text-foreground hover:text-primary transition-colors tabular-nums"
                >
                  <Phone className="w-6 h-6 lg:w-7 lg:h-7 text-primary shrink-0 self-center" strokeWidth={2.4} />
                  {CONTACTS.phone}
                </a>
                <p className="text-xs text-muted-foreground mt-2">
                  {CONTACTS.hours} · {CONTACTS.hoursWeekend}
                </p>

                {/* Быстрые действия — на мобильном в первую очередь */}
                <div className="flex flex-wrap gap-2.5 mt-6">
                  <a
                    href={`tel:${CONTACTS.phoneTel}`}
                    className="inline-flex items-center justify-center gap-2 h-11 px-5 bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all"
                  >
                    <Phone className="w-4 h-4" /> Позвонить
                  </a>
                  <a
                    href={`https://wa.me/${CONTACTS.phoneDigits}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 h-11 px-5 border border-border bg-background text-sm font-semibold text-foreground hover:border-foreground/40 active:scale-[0.98] transition-all"
                  >
                    <MessageCircle className="w-4 h-4 text-primary" /> WhatsApp
                  </a>
                  <a
                    href="#form"
                    className="inline-flex items-center justify-center gap-2 h-11 px-5 border border-border bg-background text-sm font-semibold text-foreground hover:border-foreground/40 active:scale-[0.98] transition-all"
                  >
                    <Send className="w-4 h-4 text-primary" /> Написать
                  </a>
                </div>
              </div>

              {/* Реквизиты-ведомость */}
              <dl className="w-full border-y border-border divide-y divide-border lg:border lg:divide-y">
                <ContactRow icon={Phone} label="Телефон">
                  <a href={`tel:${CONTACTS.phoneTel}`} className="font-semibold text-foreground hover:text-primary transition-colors tabular-nums">
                    {CONTACTS.phone}
                  </a>
                </ContactRow>
                <ContactRow icon={Mail} label="Email">
                  <a href={`mailto:${CONTACTS.email}`} className="font-semibold text-foreground hover:text-primary transition-colors break-all">
                    {CONTACTS.email}
                  </a>
                </ContactRow>
                <ContactRow icon={MapPin} label="Адрес">
                  <span className="font-semibold text-foreground">{COMPANY.officeAddress}</span>
                </ContactRow>
                <ContactRow icon={Clock} label="Режим работы">
                  <span className="font-semibold text-foreground">{CONTACTS.hours}</span>
                  <span className="block text-xs text-muted-foreground mt-0.5">{CONTACTS.hoursWeekend}</span>
                </ContactRow>
              </dl>
            </div>
          </div>
        </section>

        {/* ── НАПРАВЛЕНИЯ ─────────────────────────────────── */}
        <section className="border-b border-border">
          <div className="container mx-auto px-4 lg:px-8 py-10 lg:py-14">
            <h2 className="font-display text-xl lg:text-2xl font-bold text-foreground mb-1.5">
              Чем занимаемся
            </h2>
            <p className="text-sm text-muted-foreground mb-7">
              По всем направлениям — один номер и один менеджер
            </p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 border-t border-l border-border">
              {services.map(({ icon: Icon, name, desc }) => (
                <div
                  key={name}
                  className="border-r border-b border-border p-5 lg:p-6 hover:bg-muted/40 transition-colors"
                >
                  <Icon className="w-5 h-5 text-primary mb-3.5" strokeWidth={1.8} />
                  <h3 className="text-sm font-semibold text-foreground mb-1.5 text-balance">{name}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed text-pretty">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── ОФИС + ФОРМА ────────────────────────────────── */}
        <section id="form" className="scroll-mt-24">
          <div className="container mx-auto px-4 lg:px-8 py-10 lg:py-14">
            <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">

              {/* Офис */}
              <div className="min-w-0">
                <h2 className="font-display text-xl lg:text-2xl font-bold text-foreground mb-1.5">Офис</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Приезжайте — покажем объекты и обсудим условия
                </p>

                <div className="border border-border">
                  <div className="relative aspect-[16/10] sm:aspect-[16/9] bg-muted">
                    <iframe
                      title={`Офис ${COMPANY.shortName} на карте`}
                      src={OFFICE_MAP_SRC}
                      className="absolute inset-0 h-full w-full border-0"
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      allowFullScreen
                    />
                  </div>

                  <div className="p-5 border-t border-border">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-foreground">{COMPANY.city}</span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary font-semibold uppercase tracking-wide">
                            Единственный офис
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">{COMPANY.officeAddress}</p>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 mt-5">
                      <a
                        href={`tel:${CONTACTS.phoneTel}`}
                        className="inline-flex items-center justify-center gap-2 h-11 border border-border text-sm font-semibold text-foreground hover:border-foreground/40 active:scale-[0.98] transition-all"
                      >
                        <Phone className="w-4 h-4 text-primary" /> Позвонить
                      </a>
                      <a
                        href={`https://yandex.ru/maps/?text=${encodeURIComponent(COMPANY.officeAddress)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-center gap-2 h-11 border border-border text-sm font-semibold text-foreground hover:border-foreground/40 active:scale-[0.98] transition-all"
                      >
                        <MapPin className="w-4 h-4 text-primary" /> Маршрут
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {/* Форма */}
              <div className="min-w-0">
                <h2 className="font-display text-xl lg:text-2xl font-bold text-foreground mb-1.5">
                  Оставить заявку
                </h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Ответим в течение рабочего дня
                </p>

                {sent ? (
                  <div className="border border-border bg-muted/30 px-6 py-12 text-center">
                    <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-4" />
                    <div className="text-base font-semibold text-foreground mb-2">Заявка отправлена</div>
                    <p className="text-sm text-muted-foreground mb-6 max-w-xs mx-auto text-pretty">
                      Свяжемся с вами в рабочее время. Если вопрос срочный — позвоните нам.
                    </p>
                    <button
                      onClick={() => {
                        setSent(false);
                        setForm({ name: "", phone: "", email: "", subject: SUBJECTS[0], message: "" });
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      Отправить ещё одну заявку
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-3.5">
                    <Field label="Имя" required>
                      <input
                        required
                        value={form.name}
                        onChange={(e) => set("name", e.target.value)}
                        placeholder="Иван Иванов"
                        autoComplete="name"
                        className={inputClass}
                      />
                    </Field>

                    <div className="grid sm:grid-cols-2 gap-3">
                      <Field label="Телефон" required>
                        <input
                          required
                          type="tel"
                          inputMode="tel"
                          value={form.phone}
                          onChange={(e) => set("phone", e.target.value)}
                          placeholder="+7 (999) 000-00-00"
                          autoComplete="tel"
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Email">
                        <input
                          type="email"
                          inputMode="email"
                          value={form.email}
                          onChange={(e) => set("email", e.target.value)}
                          placeholder="your@email.com"
                          autoComplete="email"
                          className={inputClass}
                        />
                      </Field>
                    </div>

                    <Field label="Тема">
                      <div className="relative">
                        <select
                          value={form.subject}
                          onChange={(e) => set("subject", e.target.value)}
                          className={`${inputClass} pr-9 appearance-none cursor-pointer`}
                        >
                          {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                        </select>
                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none rotate-90" />
                      </div>
                    </Field>

                    <Field label="Сообщение">
                      <textarea
                        value={form.message}
                        onChange={(e) => set("message", e.target.value)}
                        placeholder="Опишите ваш запрос…"
                        rows={4}
                        className="w-full px-3 py-2.5 bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors resize-none"
                      />
                    </Field>

                    {error && (
                      <p className="flex items-start gap-2 text-xs text-destructive">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        {error}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full h-12 flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-60 disabled:active:scale-100"
                    >
                      {loading ? (
                        <span className="flex gap-1" aria-label="Отправка">
                          <span className="w-1.5 h-1.5 bg-primary-foreground animate-bounce" />
                          <span className="w-1.5 h-1.5 bg-primary-foreground animate-bounce [animation-delay:150ms]" />
                          <span className="w-1.5 h-1.5 bg-primary-foreground animate-bounce [animation-delay:300ms]" />
                        </span>
                      ) : (
                        <><Send className="w-4 h-4" /> Отправить заявку</>
                      )}
                    </button>

                    <p className="text-[11px] text-muted-foreground/70 text-center text-pretty">
                      Нажимая кнопку, вы принимаете{" "}
                      <a href="#" className="hover:text-muted-foreground transition-colors underline underline-offset-2">
                        политику конфиденциальности
                      </a>
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

function ContactRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ElementType;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 px-0 lg:px-5 py-3.5">
      <Icon className="w-4 h-4 text-primary shrink-0 mt-0.5" />
      <div className="min-w-0 flex-1">
        <dt className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">{label}</dt>
        <dd className="text-sm leading-snug">{children}</dd>
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">
        {label}{required && " *"}
      </span>
      {children}
    </label>
  );
}
