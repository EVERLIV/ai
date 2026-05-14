import { ArrowRight, Newspaper, Calendar, Tag } from "lucide-react";
import { Link } from "react-router-dom";

const news = [
  {
    id: 1,
    tag: "Рынок",
    date: "12 мая 2025",
    title: "Спрос на офисы в Иркутске вырос на 18% в первом квартале",
    excerpt: "Наибольший прирост показали офисы класса B+ площадью 50–150 м² в центральных районах города.",
    href: "#",
  },
  {
    id: 2,
    tag: "Советы",
    date: "5 мая 2025",
    title: "Как выбрать склад для e-commerce: 7 ключевых параметров",
    excerpt: "На что обратить внимание при аренде складского помещения: высота потолков, пандусы, температурный режим.",
    href: "#",
  },
  {
    id: 3,
    tag: "Новости компании",
    date: "28 апреля 2025",
    title: "АрендаСити запускает управление коммерческой недвижимостью",
    excerpt: "Полный операционный цикл: поиск арендаторов, заключение договоров, контроль платежей.",
    href: "#",
  },
  {
    id: 4,
    tag: "Рынок",
    date: "21 апреля 2025",
    title: "Торговые площади в ТЦ Иркутска: заполняемость достигла 94%",
    excerpt: "После волны закрытий 2022–2023 рынок торговой недвижимости восстанавливается опережающими темпами.",
    href: "#",
  },
  {
    id: 5,
    tag: "Законы",
    date: "14 апреля 2025",
    title: "Изменения в индексации аренды с 2025 года: что нужно знать",
    excerpt: "Новые правила ограничивают рост ставок в долгосрочных договорах — разбираемся в деталях.",
    href: "#",
  },
  {
    id: 6,
    tag: "Советы",
    date: "7 апреля 2025",
    title: "5 ошибок при выборе офиса для IT-компании",
    excerpt: "Плохая вентиляция, нехватка розеток, отсутствие парковки — как не попасться в типичные ловушки.",
    href: "#",
  },
];

const tagColor: Record<string, string> = {
  "Рынок":            "bg-blue-500/10 text-blue-600",
  "Советы":           "bg-emerald-500/10 text-emerald-600",
  "Новости компании": "bg-primary/10 text-primary",
  "Законы":           "bg-amber-500/10 text-amber-600",
};

const tagDot: Record<string, string> = {
  "Рынок":            "bg-blue-500",
  "Советы":           "bg-emerald-500",
  "Новости компании": "bg-primary",
  "Законы":           "bg-amber-500",
};

export default function NewsSection() {
  return (
    <section className="py-14 bg-card border-b border-border">
      <div className="container mx-auto px-4 lg:px-8">

        {/* Section header */}
        <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
          <div>
            <p className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-1.5 inline-flex items-center gap-1.5">
              <Newspaper className="w-3.5 h-3.5" /> Медиа
            </p>
            <h2 className="font-display text-2xl font-bold text-foreground">Новости и статьи</h2>
            <p className="text-sm text-muted-foreground mt-1">Аналитика рынка, советы арендаторам и владельцам</p>
          </div>
          <Link
            to="#"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            Все статьи <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Featured (first) + grid (2-6) */}
        <div className="grid lg:grid-cols-3 gap-5">

          {/* Featured card — spans 1 col, taller */}
          <Link
            to={news[0].href}
            className="group flex flex-col bg-background rounded-2xl border border-border overflow-hidden hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 lg:row-span-2"
          >
            <div className="relative flex-1 min-h-[160px] bg-gradient-to-br from-primary/8 via-muted to-muted flex items-center justify-center overflow-hidden">
              <Newspaper className="w-12 h-12 text-muted-foreground/20" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent" />
            </div>
            <div className="p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full ${tagColor[news[0].tag] ?? "bg-muted text-muted-foreground"}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${tagDot[news[0].tag] ?? "bg-muted-foreground"}`} />
                  {news[0].tag}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Calendar className="w-3 h-3" />{news[0].date}
                </span>
              </div>
              <h3 className="text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                {news[0].title}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                {news[0].excerpt}
              </p>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-primary mt-1">
                Читать <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
          </Link>

          {/* Regular cards 2-6 */}
          {news.slice(1).map((item) => (
            <Link
              key={item.id}
              to={item.href}
              className="group flex items-start gap-4 bg-background rounded-2xl border border-border p-4 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300"
            >
              {/* Tiny thumb */}
              <div className="shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center overflow-hidden">
                <Newspaper className="w-6 h-6 text-muted-foreground/30" />
              </div>

              <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${tagColor[item.tag] ?? "bg-muted text-muted-foreground"}`}>
                    <span className={`w-1 h-1 rounded-full ${tagDot[item.tag] ?? "bg-muted-foreground"}`} />
                    {item.tag}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{item.date}</span>
                </div>
                <h3 className="text-sm font-semibold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                  {item.excerpt}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Mobile "All articles" */}
        <div className="sm:hidden mt-6 text-center">
          <Link to="#" className="inline-flex items-center gap-1 text-sm font-medium text-primary">
            Все статьи <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
