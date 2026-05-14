import { Link } from "react-router-dom";
import {
  Quote, ShieldCheck, TrendingUp, Users, Award,
  MapPin, Phone, Mail, ArrowRight, CheckCircle2,
  Building2, Clock, Star, BadgeCheck,
} from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import NewsSidebar from "@/components/NewsSidebar";
import PropertyAIChat from "@/components/PropertyAIChat";
import managerPhoto from "@/assets/manager-arenda-city.jpg";
import consultantAvatar from "@/assets/consultant-anastasia.jpg";
import heroImg from "@/assets/hero-commercial.jpg";

const stats = [
  { icon: TrendingUp, value: "12+", label: "лет на рынке" },
  { icon: Users, value: "850+", label: "арендаторов" },
  { icon: ShieldCheck, value: "320+", label: "объектов в управлении" },
  { icon: Award, value: "98%", label: "повторных сделок" },
];

const values = [
  { title: "Прозрачность", desc: "Никаких скрытых комиссий и двойных агентств. Один договор — все условия на бумаге." },
  { title: "Скорость", desc: "Показываем варианты в течение 24 часов. Средний срок сдачи объекта — 14 дней." },
  { title: "Экспертиза", desc: "Знаем рынок Иркутска, Ангарска и Шелехова изнутри: ставки, тренды, проблемные зоны." },
  { title: "Персональность", desc: "Один менеджер ведёт сделку от первого звонка до подписания договора." },
];

const team = [
  {
    name: "Анастасия Зорина",
    role: "Директор",
    desc: "12 лет в коммерческой недвижимости. Специализируется на офисных и торговых объектах.",
    img: managerPhoto,
    rating: 4.9,
  },
  {
    name: "Анастасия Романова",
    role: "Ведущий консультант",
    desc: "Эксперт по складской и производственной недвижимости. Более 200 сделок.",
    img: consultantAvatar,
    rating: 4.9,
  },
];

const timeline = [
  { year: "2013", text: "Открытие агентства. Первые 10 объектов в Иркутске." },
  { year: "2016", text: "Выход в Ангарск и Шелехов. Портфель превысил 100 объектов." },
  { year: "2019", text: "Запуск полного управления коммерческой недвижимостью." },
  { year: "2022", text: "Открытие направления рекламных конструкций и вывесок." },
  { year: "2025", text: "Цифровизация: ИИ-подбор, онлайн-каталог, личный кабинет." },
];

const services = [
  "Аренда офисных помещений",
  "Торговые площади и стрит-ритейл",
  "Складская и производственная недвижимость",
  "Передача объекта в управление",
  "Юридическое сопровождение сделок",
  "Размещение наружной рекламы",
  "Оценка и аналитика рынка",
  "Подбор арендаторов для собственников",
];

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      {/* Breadcrumbs */}
      <div className="sticky top-[98px] z-30 mt-[98px] bg-card/90 backdrop-blur-xl shadow-[0_1px_0_0_hsl(var(--border)/0.5)]">
        <div className="container mx-auto px-4 lg:px-8 h-10 lg:h-11 flex items-center gap-1.5 text-[11px] lg:text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">Главная</Link>
          <span className="opacity-50">/</span>
          <span className="text-foreground">О компании</span>
        </div>
      </div>

      <main className="flex-1">

        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="relative h-[340px] overflow-hidden">
            <img src={heroImg} alt="АрендаСити" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-foreground/65" />
            <div className="absolute inset-0 flex items-center">
              <div className="container mx-auto px-4 lg:px-8">
                <p className="text-primary text-xs font-semibold uppercase tracking-widest mb-3">О компании</p>
                <h1 className="font-display text-4xl lg:text-5xl font-bold text-background leading-tight mb-4">
                  АРЕНДА<span className="text-primary">СИТИ</span>
                </h1>
                <p className="text-background/70 text-base max-w-xl">
                  Ведущее агентство коммерческой недвижимости Иркутска с 2013 года.
                  Работаем в Иркутске, Ангарске и Шелехове.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Main content + Sidebar */}
        <section className="py-12">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-8 items-start">

              {/* Left: main content */}
              <div className="flex-1 min-w-0 space-y-12">

                {/* Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {stats.map((s) => {
                    const Icon = s.icon;
                    return (
                      <div key={s.label} className="bg-card border border-border p-5 text-center">
                        <Icon className="w-5 h-5 text-primary mx-auto mb-2" />
                        <div className="font-display text-3xl font-bold text-foreground">{s.value}</div>
                        <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Director quote */}
                <div className="relative overflow-hidden bg-foreground min-h-[360px]">
                  <img
                    src={managerPhoto}
                    alt="Анастасия Зорина"
                    className="absolute inset-0 w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-foreground/90 via-foreground/60 to-transparent" />
                  <div className="relative flex flex-col justify-end h-full p-8 lg:p-12 text-background max-w-2xl">
                    <Quote className="w-10 h-10 text-primary mb-4 -ml-1" />
                    <blockquote className="font-display text-xl lg:text-2xl leading-snug font-medium mb-6">
                      «Мы не сдаём квадратные метры — мы помогаем бизнесу расти.
                      Каждый объект подбираем под задачу клиента, а не наоборот.»
                    </blockquote>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-px bg-primary" />
                      <div>
                        <div className="text-sm font-semibold">Анастасия Зорина</div>
                        <div className="text-xs text-background/60">Директор АрендаСити</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Values */}
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-6">Наши принципы</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {values.map((v) => (
                      <div key={v.title} className="bg-card border border-border p-5">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                          <span className="font-semibold text-foreground text-sm">{v.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{v.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-6">История компании</h2>
                  <div className="space-y-0">
                    {timeline.map((item, i) => (
                      <div key={item.year} className={`flex gap-5 pb-6 ${i < timeline.length - 1 ? "border-l-2 border-border ml-5" : "ml-5"}`}>
                        <div className={`shrink-0 -ml-5 w-10 h-10 bg-card border-2 flex items-center justify-center text-xs font-bold text-foreground ${i === timeline.length - 1 ? "border-primary text-primary" : "border-border"}`}>
                          {item.year.slice(2)}
                        </div>
                        <div className="pt-1.5">
                          <div className="text-xs font-semibold text-primary mb-0.5">{item.year}</div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{item.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Team */}
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-6">Команда</h2>
                  <div className="grid sm:grid-cols-2 gap-5">
                    {team.map((m) => (
                      <div key={m.name} className="bg-card border border-border p-5 flex gap-4">
                        <img src={m.img} alt={m.name} className="w-16 h-16 object-cover shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="font-semibold text-sm text-foreground">{m.name}</span>
                            <BadgeCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                          </div>
                          <div className="text-[11px] text-muted-foreground mb-2">{m.role}</div>
                          <div className="inline-flex items-center gap-1 text-[11px] text-muted-foreground mb-2">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span className="font-semibold text-foreground">{m.rating}</span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{m.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Services */}
                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-6">Наши услуги</h2>
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {services.map((s) => (
                      <div key={s} className="flex items-center gap-2.5 py-2.5 border-b border-border last:border-0 sm:last:border-0">
                        <Building2 className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-sm text-foreground">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contacts */}
                <div id="contacts" className="bg-muted/40 border border-border p-8">
                  <h2 className="font-display text-2xl font-bold text-foreground mb-6">Контакты</h2>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      {[
                        { icon: Phone, label: "Телефон", value: "+7 (3952) 55-12-34", href: "tel:+73952551234" },
                        { icon: Mail, label: "Email", value: "info@arendacity.ru", href: "mailto:info@arendacity.ru" },
                        { icon: MapPin, label: "Адрес", value: "Иркутск, ул. Карла Маркса, 37", href: "#" },
                        { icon: Clock, label: "Режим работы", value: "Пн–Пт: 9:00–19:00", href: "#" },
                      ].map(({ icon: Icon, label, value, href }) => (
                        <div key={label} className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <div className="text-[11px] text-muted-foreground">{label}</div>
                            {href !== "#" ? (
                              <a href={href} className="text-sm font-medium text-foreground hover:text-primary transition-colors">{value}</a>
                            ) : (
                              <span className="text-sm font-medium text-foreground">{value}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Работаем в Иркутске, Ангарске и Шелехове. Выезд на объект — бесплатно.
                      </p>
                      <a
                        href="tel:+73952551234"
                        className="inline-flex items-center gap-2 h-10 px-5 bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity"
                      >
                        <Phone className="w-4 h-4" /> Позвонить нам
                      </a>
                      <div className="pt-1">
                        <Link
                          to="/list-property"
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          Разместить объект <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Sidebar */}
              <NewsSidebar />
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
      <PropertyAIChat />
    </div>
  );
}
