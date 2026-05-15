import { ArrowRight, Newspaper, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

const news = [
  {
    id: 1,
    tag: "Рынок",
    date: "14 мая 2026",
    title: "ГК «А101» вывела на рынок коммерческие площади в «Прокшино»",
    excerpt: "Девелопер представил 51 помещение общей площадью почти 5,8 тыс. кв. м — от магазинов до кафе — в новом доме жилого района в ТиНАО.",
    href: "/news/gk-a101-prokshino-kommercheskiye-ploshchadi",
    cover: "https://cre.ru/media/files/20260514_065548_195.jpeg",
  },
  {
    id: 2,
    tag: "Рынок",
    date: "14 мая 2026",
    title: "БЦ «Вернадский» получил разрешение на строительство",
    excerpt: "Группа «Абсолют» получила разрешение на строительство делового центра класса А у метро «Университет». Общая площадь объекта составит 45,5 тыс. кв. м, объём инвестиций — 10 млрд рублей. Ввод в эксплуатацию запланирован на 2027 год.",
    href: "/news/bts-vernadskiy-razreshenie-na-stroitelstvo",
    cover: "https://cre.ru/media/files/20260514_034452_617.jpeg",
  },
  {
    id: 3,
    tag: "Рынок",
    date: "14 мая 2026",
    title: "Wildberries ведёт переговоры об офисе у Павелецкого вокзала",
    excerpt: "RWB рассматривает покупку или долгосрочную аренду бывшего офиса банка «Открытие» в бизнес-центре Vivaldi Plaza площадью 24,4 тыс. кв. м. Сделка может стать одной из крупнейших на рынке офисной недвижимости Москвы в этом году.",
    href: "/news/wildberries-office-paveletsky",
    cover: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
  },
  {
    id: 4,
    tag: "Новости компании",
    date: "14 мая 2026",
    title: "«Атол» перенёс серверные мощности в дата-центр MOS5",
    excerpt: "Компания арендовала стойки с энергопотреблением 13 кВт у IXcellerate и зарезервировала дополнительную ёмкость под дальнейшее расширение инфраструктуры. Переезд позволил сократить операционные расходы на 18%.",
    href: "/news/atol-datacenter-mos5-ixcellerate",
    cover: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80",
  },
  {
    id: 5,
    tag: "Рынок",
    date: "13 мая 2026",
    title: "«Северные Врата»: два склада выходят на финальный этап строительства",
    excerpt: "Строительная готовность первых двух блоков индустриального парка достигла 80% — в мае начнётся заливка 7 тыс. кубометров промышленных полов. Первые арендаторы смогут въехать уже в третьем квартале 2026 года.",
    href: "/news/severnye-vrata-finalnyy-etap-stroitelstva",
    cover: "https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80",
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

        <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
          <div>
            <p className="text-[11px] font-semibold tracking-widest uppercase text-primary mb-1.5 inline-flex items-center gap-1.5">
              <Newspaper className="w-3.5 h-3.5" /> Медиа
            </p>
            <h2 className="font-display text-2xl font-bold text-foreground">Новости рынка</h2>
            <p className="text-sm text-muted-foreground mt-1">Аналитика и события коммерческой недвижимости</p>
          </div>
          <Link to="/news" className="hidden sm:inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            Все новости <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          {/* Featured */}
          <Link
            to={news[0].href}
            className="group flex flex-col bg-background border border-border overflow-hidden hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 lg:row-span-2"
          >
            <div className="relative flex-1 min-h-[180px] bg-muted overflow-hidden">
              {news[0].cover ? (
                <img src={news[0].cover} alt={news[0].title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Newspaper className="w-12 h-12 text-muted-foreground/20" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent" />
            </div>
            <div className="p-5 flex flex-col gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 ${tagColor[news[0].tag] ?? "bg-muted text-muted-foreground"}`}>
                  <span className={`w-1.5 h-1.5 ${tagDot[news[0].tag] ?? "bg-muted-foreground"}`} />
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

          {/* Compact cards */}
          {news.slice(1).map((item) => (
            <Link
              key={item.id}
              to={item.href}
              className="group flex gap-4 bg-background border border-border p-4 hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="shrink-0 w-20 h-20 bg-muted overflow-hidden">
                {item.cover ? (
                  <img src={item.cover} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Newspaper className="w-6 h-6 text-muted-foreground/30" />
                  </div>
                )}
              </div>
              <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 ${tagColor[item.tag] ?? "bg-muted text-muted-foreground"}`}>
                    <span className={`w-1 h-1 ${tagDot[item.tag] ?? "bg-muted-foreground"}`} />
                    {item.tag}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{item.date}</span>
                </div>
                <h3 className="text-sm font-semibold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
                  {item.title}
                </h3>
                <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
                  {item.excerpt}
                </p>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary mt-auto pt-0.5">
                  Читать <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="sm:hidden mt-6 text-center">
          <Link to="/news" className="inline-flex items-center gap-1 text-sm font-medium text-primary">
            Все новости <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
