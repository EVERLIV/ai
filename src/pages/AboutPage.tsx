import {
  ArrowRight,
  Award,
  BadgeCheck,
  Ban,
  Building2,
  Clock,
  Handshake,
  Mail,
  MapPin,
  MapPinned,
  Phone,
  Quote,
  ShieldCheck,
  Star,
  Unlock,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";
import consultantAvatar from "@/assets/consultant-anastasia.jpg";
import heroImg from "@/assets/hero-commercial.jpg";
import managerPhoto from "@/assets/manager-arenda-city.jpg";
import NewsSidebar from "@/components/NewsSidebar";
import SeoHead from "@/components/SeoHead";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { COMPANY, CONTACTS } from "@/config/company";
import { absoluteUrl } from "@/config/site";

const stats = [
  { icon: ShieldCheck, value: "2013", label: "год основания агентства" },
  { icon: MapPinned, value: "3+", label: "города региона" },
  { icon: Users, value: "0 ₽", label: "за доступ к каталогу" },
  { icon: Award, value: "24/7", label: "просмотр объявлений" },
];

const values = [
  {
    icon: Unlock,
    title: "Бесплатно для жителей",
    desc: "Каталог, поиск и связь с менеджером открыты всем. Не берём плату за просмотр и размещение от собственников.",
  },
  {
    icon: Ban,
    title: "Без переплат на агрегаторах",
    desc: "Объекты публикуем на своём портале. Вам не нужно переплачивать за чужие витрины и «премиум»-позиции.",
  },
  {
    icon: Handshake,
    title: "Без лишних комиссий",
    desc: "Условия сделки обсуждаете напрямую. Не тащим посредников и не прячем сборы в мелком шрифте.",
  },
  {
    icon: MapPinned,
    title: "Доступность всему региону",
    desc: "Иркутск, Ангарск, Шелехов и область — коммерция и жильё в одном месте, с телефона и компьютера.",
  },
];

const team = [
  {
    name: "Анастасия Зорина",
    role: "Менеджер по аренде",
    desc: "Офисы и торговые объекты. Помогает с показом и сопровождением сделки, если нужна поддержка агентства.",
    img: managerPhoto,
    rating: 4.9,
  },
  {
    name: "Анастасия Романова",
    role: "Менеджер по аренде",
    desc: "Склады, производство и жилой сегмент. Ведёт объекты от публикации до договора.",
    img: consultantAvatar,
    rating: 4.9,
  },
];

const timeline = [
  { year: "2013", text: "Открытие агентства. Первые объекты в Иркутске." },
  {
    year: "2016",
    text: "Работа в Ангарске и Шелехове. Рост портфеля коммерции.",
  },
  {
    year: "2019",
    text: "Полный цикл: подбор, договоры, управление для собственников.",
  },
  { year: "2022", text: "Направление рекламных конструкций и вывесок." },
  {
    year: "2025",
    text: "Запуск портала АрендаСити: бесплатный каталог для жителей региона.",
  },
];

const services = [
  "Бесплатный каталог коммерции и жилья",
  "Размещение объектов собственниками",
  "Подбор офисов, торговли и складов",
  "Аренда и продажа квартир, домов, комнат",
  "Юридическое сопровождение сделки",
  "Управление недвижимостью для собственников",
  "Размещение наружной рекламы",
  "Партнёрства с застройщиками и агентствами",
];

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background overflow-x-hidden">
      <SeoHead
        title="О компании АрендаСити"
        description="АрендаСити — портал аренды и недвижимости, созданный агентством в Иркутске и области. Бесплатный доступ без переплат на агрегаторах и лишних комиссий."
        url={absoluteUrl("/about")}
      />
      <SiteHeader />

      <div className="sticky top-[56px] lg:top-[104px] z-30 mt-[56px] lg:mt-[104px] bg-card/90 backdrop-blur-xl shadow-[0_1px_0_0_hsl(var(--border)/0.5)]">
        <div className="container mx-auto px-4 lg:px-8 h-10 lg:h-11 flex items-center gap-1.5 text-[11px] lg:text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition-colors">
            Главная
          </Link>
          <span className="opacity-50">/</span>
          <span className="text-foreground">О компании</span>
        </div>
      </div>

      <main className="flex-1">
        <section className="relative overflow-hidden">
          <div className="relative h-[340px] overflow-hidden">
            <img
              src={heroImg}
              alt="АрендаСити"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-foreground/65" />
            <div className="absolute inset-0 flex items-center">
              <div className="container mx-auto px-4 lg:px-8">
                <p className="text-primary text-xs font-semibold uppercase tracking-widest mb-3">
                  О компании
                </p>
                <h1 className="font-display text-4xl lg:text-5xl font-bold text-background leading-tight mb-4">
                  АРЕНДА<span className="text-primary">СИТИ</span>
                </h1>
                <p className="text-background/80 text-base max-w-2xl leading-relaxed">
                  Портал аренды и недвижимости, созданный агентством в Иркутске
                  и области — чтобы жители региона находили объекты бесплатно,
                  без переплат на агрегаторах и без лишних комиссий.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container mx-auto px-4 lg:px-8">
            <div className="flex flex-col lg:flex-row gap-8">
              <div className="flex-1 min-w-0 space-y-12">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {stats.map((s) => {
                    const Icon = s.icon;
                    return (
                      <div
                        key={s.label}
                        className="bg-muted/40 p-5 text-center"
                      >
                        <Icon className="w-5 h-5 text-primary mx-auto mb-2" />
                        <div className="font-display text-3xl font-bold text-foreground">
                          {s.value}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {s.label}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-4">
                  <h2 className="font-display text-2xl font-bold text-foreground">
                    Кто мы
                  </h2>
                  <div className="space-y-3 text-sm text-muted-foreground leading-relaxed max-w-3xl">
                    <p>
                      <span className="text-foreground font-medium">
                        АрендаСити
                      </span>{" "}
                      — это онлайн-портал. Его запустило агентство недвижимости,
                      которое знает рынок Иркутска и области изнутри: ставки,
                      районы, документы, типичные риски сделок.
                    </p>
                    <p>
                      Мы сделали каталог открытым: смотрите объявления,
                      сравнивайте варианты, пишите менеджеру или публикуйте свой
                      объект. Платить за «вход» на площадку не нужно — ни
                      арендатору, ни собственнику.
                    </p>
                    <p>
                      Если нужна помощь со сделкой, остаётесь с тем же
                      агентством: показ, договор, сопровождение. Если хотите
                      разобраться сами — портал для этого и создан.
                    </p>
                  </div>
                </div>

                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-6">
                    Почему так
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {values.map((v) => {
                      const Icon = v.icon;
                      return (
                        <div key={v.title} className="bg-muted/40 p-5">
                          <Icon className="w-5 h-5 text-primary mb-3" />
                          <h3 className="text-sm font-semibold text-foreground mb-1.5">
                            {v.title}
                          </h3>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {v.desc}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-0 bg-foreground overflow-hidden">
                  <div className="lg:w-1/2 shrink-0">
                    <img
                      src={managerPhoto}
                      alt="Команда АрендаСити"
                      className="w-full h-72 lg:h-full object-cover object-top"
                    />
                  </div>
                  <div className="lg:w-1/2 flex flex-col justify-between p-8 lg:p-12 text-background">
                    <div className="mb-8">
                      <Quote className="w-8 h-8 text-primary mb-4 -ml-1" />
                      <blockquote className="font-display text-lg lg:text-xl leading-snug font-medium mb-5">
                        «Рынку региона нужен свой открытый каталог. Мы сделали
                        портал, где объекты доступны всем — а агентство рядом,
                        если нужна помощь со сделкой.»
                      </blockquote>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-px bg-primary" />
                        <div>
                          <div className="text-sm font-semibold">
                            Команда АрендаСити
                          </div>
                          <div className="text-xs text-background/50">
                            Иркутск и область
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h2 className="text-[10px] font-bold uppercase tracking-widest text-background/40 mb-5">
                        История
                      </h2>
                      <div className="space-y-0">
                        {timeline.map((item, i) => (
                          <div
                            key={item.year}
                            className="flex gap-4 pb-5 last:pb-0"
                          >
                            <div className="flex flex-col items-center shrink-0">
                              <div
                                className={`w-8 h-8 flex items-center justify-center text-[11px] font-bold shrink-0 ${i === timeline.length - 1 ? "bg-primary text-primary-foreground" : "bg-background/10 text-background"}`}
                              >
                                {item.year.slice(2)}
                              </div>
                              {i < timeline.length - 1 && (
                                <div className="w-px flex-1 bg-background/10 mt-1" />
                              )}
                            </div>
                            <div className="pt-1 pb-1">
                              <div className="text-[11px] font-bold text-primary mb-0.5">
                                {item.year}
                              </div>
                              <p className="text-xs text-background/60 leading-relaxed">
                                {item.text}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-6">
                    Команда
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-5">
                    {team.map((m) => (
                      <div
                        key={m.name}
                        className="bg-muted/40 p-5 flex gap-4 items-start"
                      >
                        <div className="w-24 h-24 shrink-0 overflow-hidden">
                          <img
                            src={m.img}
                            alt={m.name}
                            className="w-full h-full object-cover object-top"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="font-semibold text-sm text-foreground">
                              {m.name}
                            </span>
                            <BadgeCheck className="w-3.5 h-3.5 text-primary shrink-0" />
                          </div>
                          <div className="text-[11px] text-muted-foreground mb-2">
                            {m.role}
                          </div>
                          <div className="inline-flex items-center gap-1 text-[11px] text-muted-foreground mb-2">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span className="font-semibold text-foreground">
                              {m.rating}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {m.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="font-display text-2xl font-bold text-foreground mb-6">
                    Что есть на портале
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-2.5">
                    {services.map((s) => (
                      <div key={s} className="flex items-center gap-2.5 py-2.5">
                        <Building2 className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-sm text-foreground">{s}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div id="contacts" className="bg-muted/40 p-8">
                  <h2 className="font-display text-2xl font-bold text-foreground mb-6">
                    Контакты
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      {[
                        {
                          icon: Phone,
                          label: "Телефон",
                          value: CONTACTS.phone,
                          href: `tel:${CONTACTS.phoneTel}`,
                        },
                        {
                          icon: Mail,
                          label: "Email",
                          value: CONTACTS.email,
                          href: `mailto:${CONTACTS.email}`,
                        },
                        {
                          icon: MapPin,
                          label: "Адрес",
                          value: COMPANY.officeAddress,
                          href: "#",
                        },
                        {
                          icon: Clock,
                          label: "Режим работы",
                          value: CONTACTS.hours,
                          href: "#",
                        },
                      ].map(({ icon: Icon, label, value, href }) => (
                        <div key={label} className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-primary/10 flex items-center justify-center shrink-0">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <div className="text-[11px] text-muted-foreground">
                              {label}
                            </div>
                            {href !== "#" ? (
                              <a
                                href={href}
                                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                              >
                                {value}
                              </a>
                            ) : (
                              <span className="text-sm font-medium text-foreground">
                                {value}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3">
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Вопросы по сотрудничеству, размещению объектов и работе
                        с застройщиками — на странице контактов или по телефону.
                      </p>
                      <a
                        href={`tel:${CONTACTS.phoneTel}`}
                        className="inline-flex items-center gap-2 h-10 px-5 bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity"
                      >
                        <Phone className="w-4 h-4" /> Позвонить нам
                      </a>
                      <div className="pt-1 flex flex-wrap gap-x-4 gap-y-2">
                        <Link
                          to="/contacts"
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          Все контакты <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          to="/list-property?mode=rent"
                          className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                          Разместить объект{" "}
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="hidden lg:block lg:w-[280px] xl:w-[300px] shrink-0 sticky top-[110px] self-start">
                <NewsSidebar />
              </div>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
