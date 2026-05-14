import { Link } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import CategoryPropertySlider from "@/components/CategoryPropertySlider";
import CategoryContactForm from "@/components/CategoryContactForm";
import NewsSidebar from "@/components/NewsSidebar";
import PropertyAIChat from "@/components/PropertyAIChat";
import heroImg from "@/assets/hero-retail.jpg";
import { Store, MapPin, TrendingUp, Users, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const benefits = [
  { icon: MapPin, title: "Высокий трафик", desc: "Помещения на первых линиях с потоком от 5 000 человек в день" },
  { icon: Store, title: "Готовые решения", desc: "Помещения с ремонтом, витринами и всеми коммуникациями" },
  { icon: TrendingUp, title: "Аналитика локации", desc: "Предоставляем данные о проходимости и конкурентном окружении" },
  { icon: Users, title: "Полное сопровождение", desc: "Помогаем с согласованиями, вывесками и подключением услуг" },
];

const features = [
  "Торговые центры и стрит-ритейл",
  "Площади от 20 до 10 000 м²",
  "Первые линии центральных улиц",
  "Отдельный вход и витрины",
  "Зоны фуд-корта и общепита",
  "Парковка для клиентов",
];

export default function RetailPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative pt-16">
        <div className="relative h-[480px] sm:h-[540px] overflow-hidden">
          <img src={heroImg} alt="Торговые площади в Иркутске" width={1920} height={1080} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/50 to-transparent" />
          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-4">
              <div className="max-w-2xl space-y-6">
                <span className="inline-block px-3 py-1 rounded-full bg-primary/90 text-primary-foreground text-sm font-medium">
                  Торговая недвижимость
                </span>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white leading-tight">
                  Аренда торговых площадей в&nbsp;Иркутске
                </h1>
                <p className="text-lg text-white/80 leading-relaxed">
                  Торговые помещения в крупнейших ТЦ и на центральных улицах Иркутска. 
                  Стрит-ритейл, островки в моллах и отдельно стоящие объекты — от&nbsp;20&nbsp;м².
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link to="/catalog?type=Торговое">
                    <Button size="lg" className="gap-2">
                      Смотреть площади <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <a href="#contact-form">
                    <Button size="lg" variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20">
                      Оставить заявку
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground text-center mb-12">
            Преимущества аренды через АрендаСити
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((b) => (
              <div key={b.title} className="p-6 rounded-xl border border-border bg-card hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <b.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{b.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main + Sidebar */}
      <section className="py-12 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            <div className="flex-1 min-w-0 space-y-10">
              <div className="space-y-6">
                <h2 className="text-2xl font-display font-bold text-foreground">
                  Торговые помещения в аренду в Иркутске — обзор рынка
                </h2>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>Иркутск — крупнейший торговый центр Восточной Сибири с населением более 620 тысяч человек. Город располагает развитой розничной инфраструктурой: «Комсомолл», «Сильвер Молл», «Jam Молл», а также активный стрит-ритейл на улицах Карла Маркса, Ленина и Дзержинского.</p>
                  <p>Средняя ставка аренды торговых площадей варьируется от 800 до 3 000 ₽/м² в месяц. Для общепита и сферы услуг доступны помещения с вытяжкой, водоснабжением и отдельным входом.</p>
                  <p>АрендаСити предоставляет полный анализ локации: пешеходный трафик, конкурентное окружение, потенциальную выручку.</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  {features.map((f) => (
                    <div key={f} className="flex items-start gap-2.5">
                      <CheckCircle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-sm text-foreground">{f}</span>
                    </div>
                  ))}
                </div>
              </div>
              <CategoryPropertySlider type="Торговое" title="Торговые помещения в каталоге" />
              <div id="contact-form">
                <CategoryContactForm category="торговое помещение" />
              </div>
            </div>
            <NewsSidebar />
          </div>
        </div>
      </section>

      <SiteFooter />
      <PropertyAIChat />
    </div>
  );
}
