import { Link } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import CategoryPropertySlider from "@/components/CategoryPropertySlider";
import CategoryContactForm from "@/components/CategoryContactForm";
import NewsSidebar from "@/components/NewsSidebar";
import PropertyAIChat from "@/components/PropertyAIChat";
import heroImg from "@/assets/hero-warehouses.jpg";
import { Warehouse, Truck, Shield, Ruler, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const benefits = [
  { icon: Truck, title: "Логистика", desc: "Объекты рядом с федеральными трассами и ж/д узлами" },
  { icon: Warehouse, title: "Любой формат", desc: "Отапливаемые, холодные, морозильные склады и ангары" },
  { icon: Ruler, title: "Гибкая площадь", desc: "От 50 м² для малого бизнеса до 50 000 м² логистических комплексов" },
  { icon: Shield, title: "Безопасность", desc: "Охрана, видеонаблюдение, контроль доступа на всех объектах" },
];

const features = [
  "Отапливаемые и холодные склады",
  "Площади от 50 до 50 000 м²",
  "Рампы, доки, пандусы",
  "Грузоподъёмное оборудование",
  "Круглосуточный доступ",
  "Близость к транспортным узлам",
];

export default function WarehousesPage() {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      {/* Hero */}
      <section className="relative pt-16">
        <div className="relative h-[480px] sm:h-[540px] overflow-hidden">
          <img src={heroImg} alt="Складские помещения в Иркутске" width={1920} height={1080} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/50 to-transparent" />
          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-4">
              <div className="max-w-2xl space-y-6">
                <span className="inline-block px-3 py-1 rounded-full bg-primary/90 text-primary-foreground text-sm font-medium">
                  Складская недвижимость
                </span>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white leading-tight">
                  Аренда складов и производственных помещений в&nbsp;Иркутске
                </h1>
                <p className="text-lg text-white/80 leading-relaxed">
                  Складские комплексы, производственные базы и ангары в Иркутске, Ангарске и Шелехове. 
                  Отапливаемые и холодные — от&nbsp;50&nbsp;м² до&nbsp;50&nbsp;000&nbsp;м².
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link to="/catalog?type=Склад">
                    <Button size="lg" className="gap-2">
                      Смотреть склады <ArrowRight className="w-4 h-4" />
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
            Почему выбирают наши склады
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
                  Складские помещения в Иркутске — аренда и продажа
                </h2>
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <p>Иркутск занимает стратегическое положение на пересечении Транссибирской магистрали и федеральных автодорог, что делает город важным логистическим хабом Восточной Сибири. Складской рынок предлагает объекты от современных логистических комплексов класса A до производственных баз и ангаров.</p>
                  <p>Основные складские зоны расположены в промышленных районах Иркутска, Ангарска и Шелехова. Ставки аренды варьируются от 200 до 800 ₽/м² в месяц в зависимости от класса и температурного режима.</p>
                  <p>АрендаСити специализируется на подборе складских помещений с учётом требований к температурному режиму, грузоподъёмности полов, высоте потолков и транспортной доступности.</p>
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
              <CategoryPropertySlider type="Склад" title="Складские помещения в каталоге" />
              <div id="contact-form">
                <CategoryContactForm category="склад" />
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
