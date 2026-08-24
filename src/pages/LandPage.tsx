import {
  ArrowRight,
  CheckCircle,
  Landmark,
  MapPinned,
  TreePine,
  UtilityPole,
} from "lucide-react";
import { Link } from "react-router-dom";
import landImg from "@/assets/property-land.jpg";
import CategoryContactForm from "@/components/CategoryContactForm";
import CategoryPropertySlider from "@/components/CategoryPropertySlider";
import NewsSidebar from "@/components/NewsSidebar";
import PropertyAIChat from "@/components/PropertyAIChat";
import SeoHead from "@/components/SeoHead";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { absoluteUrl } from "@/config/site";
import { buildCatalogUrl } from "@/lib/catalogLinks";

const benefits = [
  {
    icon: MapPinned,
    title: "Локация под задачу",
    desc: "Подбираем участки под торговлю, склады, базу, производство и девелопмент.",
  },
  {
    icon: Landmark,
    title: "Проверка документов",
    desc: "Смотрим ВРИ, кадастр, подъездные пути и ограничения до показа.",
  },
  {
    icon: UtilityPole,
    title: "Коммуникации рядом",
    desc: "Отмечаем участки с электричеством, водой, газом и возможностью подключения.",
  },
  {
    icon: TreePine,
    title: "Коммерческий потенциал",
    desc: "Оцениваем первую линию, транспортный поток и перспективу застройки.",
  },
];

const features = [
  "Земля под коммерцию, складскую базу и производство",
  "Участки в Иркутске, Ангарске, Шелехове и вдоль трасс",
  "Площади от небольших пятен под павильон до крупных массивов",
  "Проверка категории земли и вида разрешённого использования",
  "Подбор участков с подъездом для грузового транспорта",
  "Сопровождение сделки от запроса до регистрации",
];

export default function LandPage() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SeoHead
        title="Продажа и аренда земельных участков в Иркутске"
        description="Земельные участки под коммерцию, склады, базу и девелопмент в Иркутске и области. Подбор, проверка ВРИ и сопровождение сделки."
        url={absoluteUrl("/land")}
      />
      <SiteHeader />

      <section className="relative pt-14 md:pt-[98px]">
        <div className="relative h-[500px] sm:h-[560px] overflow-hidden">
          <img
            src={landImg}
            alt="Земельные участки в Иркутске и области"
            width={1920}
            height={1080}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/85 via-foreground/55 to-transparent" />
          <div className="absolute inset-0 flex items-center">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl space-y-6">
                <span className="inline-block rounded-full bg-primary/90 px-3 py-1 text-sm font-medium text-primary-foreground">
                  Земельные участки
                </span>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white leading-tight">
                  Земля под бизнес, склад или строительство в Иркутске и области
                </h1>
                <p className="text-lg leading-relaxed text-white/80">
                  Подбираем земельные участки под коммерческое использование,
                  складские базы, автосервисы, торговые объекты и будущую
                  застройку. Проверяем ВРИ, подъезд, кадастр и инфраструктуру до
                  переговоров.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Link to={buildCatalogUrl({ types: "Земля" })}>
                    <Button size="lg" className="gap-2">
                      Смотреть участки <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Link to="/list-property?mode=rent&type=Земля">
                    <Button
                      size="lg"
                      variant="outline"
                      className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                    >
                      Разместить свою землю за 0 ₽
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background py-16">
        <div className="container mx-auto px-4">
          <h2 className="mb-12 text-center text-2xl font-display font-bold text-foreground sm:text-3xl">
            Почему землю подбирают через АрендаСити
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map((benefit) => (
              <div
                key={benefit.title}
                className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold text-foreground">
                  {benefit.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {benefit.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-muted/20 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-8 lg:flex-row">
            <div className="min-w-0 flex-1 space-y-10">
              <div className="space-y-6">
                <h2 className="text-2xl font-display font-bold text-foreground">
                  Земельные участки в Иркутске и области: где искать площадку
                  под бизнес
                </h2>
                <div className="space-y-4 text-sm leading-relaxed text-muted-foreground">
                  <p>
                    Земля под коммерческую недвижимость в Иркутской области
                    востребована у логистических компаний, застройщиков,
                    автосервисов, ритейла и производственных площадок.
                    Наибольший спрос приходится на участки в черте Иркутска,
                    вдоль федеральных трасс, рядом с промышленными зонами
                    Ангарска и выездами на Шелехов.
                  </p>
                  <p>
                    При выборе участка важно учитывать не только цену за сотку,
                    но и вид разрешённого использования, подъезд для грузового
                    транспорта, возможность подключения электричества, воды и
                    канализации. Ошибка на этом этапе увеличивает сроки запуска
                    объекта и бюджет на подготовку площадки.
                  </p>
                  <p>
                    АрендаСити помогает быстро сравнить земельные участки по
                    целевому сценарию: под торговый павильон, складскую базу,
                    производственную площадку, автокомплекс или дальнейшую
                    застройку. Мы отсекаем слабые варианты ещё до показа, чтобы
                    вы не тратили время на неподходящие объекты.
                  </p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {features.map((feature) => (
                    <div key={feature} className="flex items-start gap-2.5">
                      <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span className="text-sm text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <CategoryPropertySlider
                type="Земля"
                title="Земельные участки в каталоге"
              />

              <section className="rounded-2xl border border-primary/20 bg-primary/5 p-6 sm:p-8">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                  <div className="max-w-2xl space-y-2">
                    <h2 className="text-2xl font-display font-bold text-foreground">
                      Хотите разместить свой участок бесплатно?
                    </h2>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      Разместим землю за 0 ₽, подготовим карточку объекта и
                      поможем получить первые обращения от арендаторов или
                      покупателей без долгой ручной переписки.
                    </p>
                  </div>
                  <Link to="/list-property?mode=rent&type=Земля">
                    <Button size="lg" className="gap-2 whitespace-nowrap">
                      Разместить свою землю за 0 ₽
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </section>

              <div id="contact-form">
                <CategoryContactForm category="земельный участок" />
              </div>
            </div>

            <div className="hidden shrink-0 self-start lg:block lg:w-[280px] xl:w-[300px] sticky top-[110px]">
              <NewsSidebar />
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
      <PropertyAIChat />
    </div>
  );
}
