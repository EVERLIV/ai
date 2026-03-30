import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import CategoryPropertySlider from "@/components/CategoryPropertySlider";
import CategoryContactForm from "@/components/CategoryContactForm";
import heroImg from "@/assets/hero-offices.jpg";
import { Building2, MapPin, Shield, Clock, Users, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const benefits = [
  { icon: MapPin, title: "Центральные районы", desc: "Офисы в деловых центрах Кировского, Октябрьского и Свердловского районов" },
  { icon: Shield, title: "Юридическая чистота", desc: "Проверяем документы, помогаем с оформлением договора аренды" },
  { icon: Clock, title: "Быстрый подбор", desc: "Покажем подходящие варианты в течение 24 часов после обращения" },
  { icon: Users, title: "Персональный менеджер", desc: "Ведём сделку от подбора до заключения договора" },
];

const features = [
  "Классы А, B+, B, С — под любой бюджет",
  "Площади от 15 до 5 000 м²",
  "Мебелированные и пустые помещения",
  "Парковка, охрана, пропускная система",
  "Высокоскоростной интернет и телефония",
  "Кондиционирование и вентиляция",
];

export default function OfficesPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative pt-16">
        <div className="relative h-[480px] sm:h-[540px] overflow-hidden">
          <img src={heroImg} alt="Офисные помещения в Иркутске" width={1920} height={1080} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/50 to-transparent" />
          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-4">
              <div className="max-w-2xl space-y-6">
                <span className="inline-block px-3 py-1 rounded-full bg-primary/90 text-primary-foreground text-sm font-medium">
                  Офисная недвижимость
                </span>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white leading-tight">
                  Аренда и продажа офисов в&nbsp;Иркутске
                </h1>
                <p className="text-lg text-white/80 leading-relaxed">
                  Более 150 офисных помещений в бизнес-центрах Иркутска и Иркутской области.
                  Класс&nbsp;А, B+ и B — от&nbsp;15&nbsp;м² для стартапов до 5&nbsp;000&nbsp;м² для крупных компаний.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link to="/catalog?type=Офис">
                    <Button size="lg" className="gap-2">
                      Смотреть офисы <ArrowRight className="w-4 h-4" />
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
            Почему арендуют офисы через нас
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

      {/* SEO Text */}
      <section className="py-16 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-8">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-foreground">
              Офисные помещения в аренду в Иркутске — полный обзор рынка
            </h2>
            <div className="prose prose-lg text-muted-foreground max-w-none space-y-4">
              <p>
                Рынок офисной недвижимости Иркутска — один из наиболее динамичных в Восточной Сибири. Город располагает 
                современными бизнес-центрами классов A и B+, сосредоточенными преимущественно в Кировском и Октябрьском 
                районах. Средняя ставка аренды офисных помещений составляет от 600 до 1 500 ₽/м² в месяц в зависимости 
                от класса здания и расположения.
              </p>
              <p>
                Бизнес-центры Иркутска предлагают полную инфраструктуру: круглосуточную охрану, систему кондиционирования, 
                скоростной интернет, конференц-залы и зоны отдыха. Многие объекты расположены вблизи ключевых транспортных 
                развязок, что обеспечивает удобный доступ для сотрудников и клиентов.
              </p>
              <p>
                Для малого бизнеса и стартапов доступны компактные офисы от 15 м² в коворкинг-пространствах и бизнес-центрах 
                класса C. Крупные компании могут арендовать целые этажи площадью до 5 000 м² с индивидуальной планировкой 
                и отдельным входом.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {features.map((f) => (
                <div key={f} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <span className="text-foreground">{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Property Slider */}
      <CategoryPropertySlider type="Офис" title="Офисные помещения в каталоге" />

      {/* Contact Form */}
      <div id="contact-form">
        <CategoryContactForm category="офис" />
      </div>

      <SiteFooter />
    </div>
  );
}
