import { useState } from "react";
import { Link } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import {
  Phone, Mail, MapPin, Clock, Send, ChevronRight,
  Building2, Warehouse, Megaphone, Settings, CheckCircle2,
} from "lucide-react";

const departments = [
  {
    icon: Building2,
    name: "Аренда офисов и торговых площадей",
    desc: "Подбор офисных и торговых помещений, консультации по рынку",
    phone: "+7 (3952) 55-12-34",
    email: "office@arendacity.ru",
    hours: "Пн–Пт: 9:00–19:00",
  },
  {
    icon: Warehouse,
    name: "Склады и производство",
    desc: "Аренда складских и производственных помещений",
    phone: "+7 (3952) 55-12-35",
    email: "warehouse@arendacity.ru",
    hours: "Пн–Пт: 9:00–18:00",
  },
  {
    icon: Settings,
    name: "Управление недвижимостью",
    desc: "Передача объекта в доверительное управление",
    phone: "+7 (3952) 55-12-36",
    email: "management@arendacity.ru",
    hours: "Пн–Пт: 9:00–18:00",
  },
  {
    icon: Megaphone,
    name: "Реклама и размещение",
    desc: "Рекламные конструкции, баннеры, вывески",
    phone: "+7 (3952) 55-12-37",
    email: "ads@arendacity.ru",
    hours: "Пн–Пт: 9:00–18:00",
  },
];

const offices = [
  {
    city: "Иркутск",
    address: "ул. Карла Маркса, 37, офис 201",
    phone: "+7 (3952) 55-12-34",
    hours: "Пн–Пт: 9:00–19:00, Сб: 10:00–15:00",
    main: true,
  },
  {
    city: "Ангарск",
    address: "ул. Ленина, 15, офис 4",
    phone: "+7 (3955) 22-33-44",
    hours: "Пн–Пт: 9:00–18:00",
    main: false,
  },
  {
    city: "Шелехов",
    address: "ул. Привокзальная, 8",
    phone: "+7 (39551) 3-45-67",
    hours: "Пн–Пт: 10:00–17:00",
    main: false,
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

export default function ContactsPage() {
  const [form, setForm] = useState({ name: "", phone: "", email: "", subject: SUBJECTS[0], message: "" });
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => { setLoading(false); setSent(true); }, 1200);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
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

        {/* Hero */}
        <section className="border-b border-border">
          <div className="container mx-auto px-4 lg:px-8 py-14 lg:py-20">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-3">Контакты</p>
              <h1 className="font-display text-4xl lg:text-5xl font-bold text-foreground leading-tight mb-4">
                Свяжитесь с нами
              </h1>
              <p className="text-muted-foreground text-base leading-relaxed max-w-lg">
                Мы работаем в Иркутске, Ангарске и Шелехове с 2013 года. Выберите нужный отдел или оставьте заявку — ответим в течение часа.
              </p>
            </div>
          </div>
        </section>

        {/* Main info */}
        <section className="border-b border-border">
          <div className="container mx-auto px-4 lg:px-8 py-12">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 border border-border">
              <div className="p-4 sm:border-r border-border border-b sm:border-b-0">
                <Phone className="w-5 h-5 text-primary mb-3" />
                <div className="text-[11px] text-muted-foreground uppercase tracking-widest mb-1">Телефон</div>
                <a href="tel:+73952551234" className="text-lg font-bold text-foreground hover:text-primary transition-colors">
                  +7 (3952) 55-12-34
                </a>
                <div className="text-xs text-muted-foreground mt-1">Единый номер</div>
              </div>
              <div className="p-4 sm:border-r border-border border-b sm:border-b-0">
                <Mail className="w-5 h-5 text-primary mb-3" />
                <div className="text-[11px] text-muted-foreground uppercase tracking-widest mb-1">Email</div>
                <a href="mailto:info@arendacity.ru" className="text-lg font-bold text-foreground hover:text-primary transition-colors break-all">
                  info@arendacity.ru
                </a>
                <div className="text-xs text-muted-foreground mt-1">Общие вопросы</div>
              </div>
              <div className="p-4">
                <Clock className="w-5 h-5 text-primary mb-3" />
                <div className="text-[11px] text-muted-foreground uppercase tracking-widest mb-1">Режим работы</div>
                <div className="text-lg font-bold text-foreground">Пн–Пт: 9–19</div>
                <div className="text-xs text-muted-foreground mt-1">Сб: 10:00–15:00</div>
              </div>
            </div>
          </div>
        </section>

        {/* Departments + Form */}
        <section className="border-b border-border">
          <div className="container mx-auto px-4 lg:px-8 py-12">
            <div className="flex flex-col lg:flex-row gap-12">

              {/* Left: departments */}
              <div className="flex-1 min-w-0">
                <h2 className="font-display text-2xl font-bold text-foreground mb-6">Отделы</h2>
                <div className="space-y-0 border border-border">
                  {departments.map((d, i) => {
                    const Icon = d.icon;
                    return (
                      <div key={i} className="flex gap-4 p-4 border-b border-border last:border-0 group hover:bg-muted/30 transition-colors">
                        <div className="w-9 h-9 bg-primary/8 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-foreground mb-0.5">{d.name}</div>
                          <div className="text-xs text-muted-foreground mb-2 leading-relaxed">{d.desc}</div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1">
                            <a href={`tel:${d.phone.replace(/\D/g, "")}`}
                              className="flex items-center gap-1.5 text-xs text-foreground hover:text-primary transition-colors">
                              <Phone className="w-3 h-3 text-muted-foreground" />
                              {d.phone}
                            </a>
                            <a href={`mailto:${d.email}`}
                              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                              <Mail className="w-3 h-3" />
                              {d.email}
                            </a>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60 mt-1.5">
                            <Clock className="w-3 h-3" />
                            {d.hours}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right: form */}
              <div className="lg:w-[420px] shrink-0">
                <h2 className="font-display text-2xl font-bold text-foreground mb-6">Оставить заявку</h2>
                {sent ? (
                  <div className="border border-border p-8 text-center">
                    <CheckCircle2 className="w-10 h-10 text-primary mx-auto mb-4" />
                    <div className="text-base font-semibold text-foreground mb-2">Заявка отправлена</div>
                    <p className="text-sm text-muted-foreground mb-5">
                      Мы свяжемся с вами в течение часа в рабочее время.
                    </p>
                    <button onClick={() => { setSent(false); setForm({ name: "", phone: "", email: "", subject: SUBJECTS[0], message: "" }); }}
                      className="text-xs text-primary hover:underline">
                      Отправить ещё одну заявку
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="border border-border p-5 space-y-3.5">
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Имя *</label>
                      <input required value={form.name} onChange={(e) => set("name", e.target.value)}
                        placeholder="Иван Иванов"
                        className="w-full h-10 px-3 bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Телефон *</label>
                        <input required type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)}
                          placeholder="+7 (999) 000-00-00"
                          className="w-full h-10 px-3 bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors" />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Email</label>
                        <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)}
                          placeholder="your@email.com"
                          className="w-full h-10 px-3 bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Тема</label>
                      <div className="relative">
                        <select value={form.subject} onChange={(e) => set("subject", e.target.value)}
                          className="w-full h-10 pl-3 pr-8 bg-background border border-border text-sm text-foreground focus:outline-none focus:border-primary transition-colors appearance-none cursor-pointer">
                          {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
                        </select>
                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none rotate-90" />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block mb-1.5">Сообщение</label>
                      <textarea value={form.message} onChange={(e) => set("message", e.target.value)}
                        placeholder="Опишите ваш запрос..."
                        rows={4}
                        className="w-full px-3 py-2.5 bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary transition-colors resize-none" />
                    </div>
                    <button type="submit" disabled={loading}
                      className="w-full h-11 flex items-center justify-center gap-2 bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60">
                      {loading ? (
                        <span className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-primary-foreground animate-bounce" />
                          <span className="w-1.5 h-1.5 bg-primary-foreground animate-bounce [animation-delay:150ms]" />
                          <span className="w-1.5 h-1.5 bg-primary-foreground animate-bounce [animation-delay:300ms]" />
                        </span>
                      ) : (
                        <><Send className="w-4 h-4" /> Отправить заявку</>
                      )}
                    </button>
                    <p className="text-[11px] text-muted-foreground/60 text-center">
                      Нажимая кнопку, вы принимаете{" "}
                      <a href="#" className="hover:text-muted-foreground transition-colors underline underline-offset-2">политику конфиденциальности</a>
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Offices */}
        <section>
          <div className="container mx-auto px-4 lg:px-8 py-12">
            <h2 className="font-display text-2xl font-bold text-foreground mb-6">Офисы</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-0 border border-border">
              {offices.map((o, i) => (
                <div key={i} className={`p-6 ${i < offices.length - 1 ? "border-b sm:border-b-0 sm:border-r border-border" : ""}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-semibold text-foreground">{o.city}</span>
                    {o.main && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary font-semibold uppercase tracking-wide">Главный</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{o.address}</p>
                  <a href={`tel:${o.phone.replace(/\D/g, "")}`}
                    className="flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary transition-colors mb-2">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    {o.phone}
                  </a>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    {o.hours}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </main>

      <SiteFooter />
    </div>
  );
}
