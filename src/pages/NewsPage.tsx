import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { useNewsPosts, type NewsPost } from "@/hooks/useNews";

const CATEGORIES = ["Все", "Рынок", "Советы", "Новости компании", "Законы"];

const CATEGORY_COLORS: Record<string, string> = {
  "Рынок": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "Советы": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "Новости компании": "bg-primary/10 text-primary",
  "Законы": "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

const DEMO_POSTS: NewsPost[] = [
  {
    id: "1", created_at: "2026-05-14T07:01:00Z", updated_at: "2026-05-14T07:01:00Z",
    published_at: "2026-05-14T07:01:00Z",
    title: "ГК «А101» вывела на рынок коммерческие площади в «Прокшино»",
    slug: "gk-a101-prokshino-kommercheskiye-ploshchadi",
    excerpt: "Девелопер представил 51 помещение общей площадью почти 5,8 тыс. кв. м — от магазинов до кафе — в новом доме жилого района в ТиНАО.",
    content: "ГК «А101» объявила о выводе на рынок 51 коммерческого помещения в доме 10.3 жилого района «Прокшино» в ТиНАО. Общая площадь лотов составляет почти **5 800 кв. м**.\n\nДевелопер представил помещения площадью от 29,4 до 454,6 кв. м. В числе крупнейших лотов — помещение под супермаркет площадью 454,6 кв. м. Также в проекте предусмотрены **15 помещений**, подходящих для размещения кафе и ресторанов.\n\nКоммерческие помещения разместятся в шести корпусах нового дома, строящегося на пересечении Прокшинского проспекта и проспекта Магеллана.\n\nПо данным девелопера, в районе «Прокшино» проживает около **38 тыс. человек**, ещё порядка 24 тыс. — в соседних «Испанских кварталах».\n\n*Источник: [CRE.ru](https://cre.ru/news/101579)*",
    cover_url: "https://cre.ru/media/files/20260514_065548_195.jpeg",
    category: "Рынок", tags: ["торговля", "девелопмент", "ТиНАО"], status: "published",
    author_name: "Редакция CRE", views: 142,
  },
  {
    id: "2", created_at: "2026-05-14T06:38:00Z", updated_at: "2026-05-14T06:38:00Z",
    published_at: "2026-05-14T06:38:00Z",
    title: "БЦ «Вернадский» получил разрешение на строительство",
    slug: "bts-vernadskiy-razreshenie-na-stroitelstvo",
    excerpt: "Группа «Абсолют» получила РНС на деловой центр класса А у метро «Университет» — 45,5 тыс. кв. м и 10 млрд рублей инвестиций.",
    content: "Инвестиционная Группа «Абсолют» получила разрешение на строительство многофункционального делового центра возле метро «Университет» на проспекте Вернадского. Девелопер инвестирует в проект **10 млрд рублей**.\n\nДеловой центр класса А имеет общую площадь **45 500 кв. м**. Проект представляет архитектурный ансамбль из трёх шестиэтажных корпусов, связанных между собой торговой галереей. Характерной особенностью станут **озеленённые крыши** с зонами отдыха.\n\nОфисные пространства займут 24 тыс. кв. м. **Ввод в эксплуатацию** запланирован на 2028 год. Архитектурное бюро — UNK.\n\n*Источник: [CRE.ru](https://cre.ru/news/101578)*",
    cover_url: "https://cre.ru/media/files/20260514_034452_617.jpeg",
    category: "Рынок", tags: ["офисы", "класс-А", "Москва"], status: "published",
    author_name: "Редакция CRE", views: 98,
  },
  {
    id: "3", created_at: "2026-05-14T07:52:00Z", updated_at: "2026-05-14T07:52:00Z",
    published_at: "2026-05-14T07:52:00Z",
    title: "Wildberries ведёт переговоры об офисе у Павелецкого вокзала",
    slug: "wildberries-office-paveletsky",
    excerpt: "RWB рассматривает покупку или аренду бывшего офиса банка «Открытие» в Vivaldi Plaza площадью 24,4 тыс. кв. м.",
    content: "Объединённая компания Wildberries & Russ (RWB) ведёт переговоры с ВТБ о покупке или аренде бывшего офиса банка «Открытие» на Летниковской улице рядом с Павелецким вокзалом.\n\nРечь идёт о здании в составе бизнес-центра **Vivaldi Plaza** площадью около **24 400 кв. м**. Стороны рассматривают как покупку актива, так и долгосрочную аренду.\n\nСтартовая стоимость актива оценивается примерно в **7,7 млрд рублей**.\n\n*Источник: [CRE.ru](https://cre.ru/news/101580)*",
    cover_url: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
    category: "Рынок", tags: ["офисы", "Wildberries", "сделки"], status: "published",
    author_name: "Редакция CRE", views: 215,
  },
  {
    id: "4", created_at: "2026-05-14T08:05:00Z", updated_at: "2026-05-14T08:05:00Z",
    published_at: "2026-05-14T08:05:00Z",
    title: "«Атол» перенёс серверные мощности в дата-центр MOS5",
    slug: "atol-datacenter-mos5-ixcellerate",
    excerpt: "Компания арендовала стойки с энергопотреблением 13 кВт у IXcellerate и зарезервировала ёмкость под дальнейшее развитие.",
    content: "«Атол» арендовал стойки с плотностью энергопотребления **13 кВт** в дата-центре MOS5 оператора IXcellerate и зарезервировал дополнительную ёмкость под развитие инфраструктуры.\n\nПереезд обусловлен быстрым ростом компании и расширением продуктового портфеля. Запатентованная технология низкоскоростной вентиляции по принципу «холодная стена» стала решающим фактором при выборе MOS5.\n\nПроект соответствует стандарту надёжности **Tier III**.\n\n*Источник: [CRE.ru](https://cre.ru/news/101581)*",
    cover_url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80",
    category: "Новости компании", tags: ["IT", "дата-центр", "инфраструктура"], status: "published",
    author_name: "Редакция CRE", views: 67,
  },
  {
    id: "5", created_at: "2026-05-13T12:26:00Z", updated_at: "2026-05-13T12:26:00Z",
    published_at: "2026-05-13T12:26:00Z",
    title: "«Северные Врата»: два склада выходят на финальный этап",
    slug: "severnye-vrata-finalnyy-etap-stroitelstva",
    excerpt: "Строительная готовность первых двух блоков индустриального парка достигла 80% — в мае начнётся заливка 7 тыс. кубометров промышленных полов.",
    content: "Строительство первой фазы индустриального парка **«Северные Врата»** вышло на финальный этап: готовность двух первых блоков составляет порядка **80%**. Корпуса площадью 16 000 и 18 000 кв. м.\n\nВ объектах завершён монтаж LED-освещения Philips, пожарной сигнализации и спринклерного пожаротушения. Решения соответствуют стандартам экосертификации **«Клевер»**.\n\nВ мае планируется заливка **7 000 кубометров** промышленных полов стандарта **FM-2 special** — несущая способность до 8 тонн/м².\n\n*Источник: [CRE.ru](https://cre.ru/news/101575)*",
    cover_url: "https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80",
    category: "Рынок", tags: ["склады", "индустриальный парк", "строительство"], status: "published",
    author_name: "Редакция CRE", views: 89,
  },
  {
    id: "6", created_at: "2026-05-12T09:00:00Z", updated_at: "2026-05-12T09:00:00Z",
    published_at: "2026-05-12T09:00:00Z",
    title: "Как выбрать склад для e-commerce: 7 ключевых параметров",
    slug: "kak-vybrat-sklad-dlya-ecommerce-7-parametrov",
    excerpt: "На что обратить внимание при аренде складского помещения: высота потолков, пандусы, температурный режим и сертификация.",
    content: "При выборе склада для интернет-торговли важно учитывать несколько ключевых параметров.\n\n## 1. Высота потолков\nДля современного e-commerce оптимальная высота — **от 10 метров**. Это позволяет использовать многоярусное хранение.\n\n## 2. Пол и нагрузки\nПромышленный пол стандарта FM-2 выдерживает **от 5 тонн/м²**. Антипылевое покрытие обязательно.\n\n## 3. Пандусы и ворота\nМинимум **1 ворота на 1 000 кв. м**. Наличие доковых левеллеров сокращает время погрузки.\n\n## 4. Температурный режим\nДля фармацевтики и продуктов питания нужен **+2...+8°C**, для стандартных товаров — отапливаемый склад от +10°C.\n\n## 5. Пожарная безопасность\nСпринклерная система и категория **В2** обязательны для большинства видов товаров.\n\n## 6. Локация и транспорт\nРасстояние до КАД/МКАД, удобство подъезда для фур, наличие парковки.\n\n## 7. Юридический статус\nПроверьте класс здания (A/B), собственника и отсутствие обременений.\n\n*Материал подготовлен АрендаСити*",
    cover_url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80",
    category: "Советы", tags: ["склад", "e-commerce", "аренда"], status: "published",
    author_name: "Анастасия Романова", views: 324,
  },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

function CategoryBadge({ category }: { category: string }) {
  const cls = CATEGORY_COLORS[category] ?? "bg-muted text-muted-foreground";
  return <span className={`inline-block text-[11px] font-medium px-2 py-0.5 ${cls}`}>{category}</span>;
}

function SkeletonCard() {
  return (
    <div className="border border-border bg-card animate-pulse">
      <div className="h-48 bg-muted" />
      <div className="p-4 space-y-2">
        <div className="h-3 w-20 bg-muted rounded" />
        <div className="h-5 w-full bg-muted rounded" />
        <div className="h-4 w-3/4 bg-muted rounded" />
      </div>
    </div>
  );
}

function FeaturedCard({ post }: { post: NewsPost }) {
  return (
    <Link to={`/news/${post.slug}`} className="group block border border-border bg-card hover:-translate-y-0.5 transition-all col-span-full lg:col-span-2">
      <div className="h-64 bg-muted flex items-center justify-center overflow-hidden">
        {post.cover_url
          ? <img src={post.cover_url} alt={post.title} className="w-full h-full object-cover" />
          : <span className="text-muted-foreground/30 text-6xl font-bold select-none">{post.category[0]}</span>
        }
      </div>
      <div className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          <CategoryBadge category={post.category} />
          <span className="text-xs text-muted-foreground">{formatDate(post.published_at || post.created_at)}</span>
        </div>
        <h2 className="font-display text-xl font-bold leading-snug group-hover:text-primary transition-colors">{post.title}</h2>
        {post.excerpt && <p className="text-sm text-muted-foreground line-clamp-3">{post.excerpt}</p>}
        <span className="text-sm font-medium text-primary">Читать &rarr;</span>
      </div>
    </Link>
  );
}

function CompactCard({ post }: { post: NewsPost }) {
  return (
    <Link to={`/news/${post.slug}`} className="group flex gap-3 border border-border bg-card hover:-translate-y-0.5 transition-all p-4">
      <div className="shrink-0 w-20 h-20 bg-muted flex items-center justify-center overflow-hidden">
        {post.cover_url
          ? <img src={post.cover_url} alt={post.title} className="w-full h-full object-cover" />
          : <span className="text-muted-foreground/30 text-2xl font-bold select-none">{post.category[0]}</span>
        }
      </div>
      <div className="min-w-0 flex-1 space-y-1.5">
        <CategoryBadge category={post.category} />
        <p className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2">{post.title}</p>
        <span className="text-xs text-muted-foreground">{formatDate(post.published_at || post.created_at)}</span>
      </div>
    </Link>
  );
}

export default function NewsPage() {
  const [category, setCategory] = useState("Все");
  const [scrollPct, setScrollPct] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      setScrollPct(docH > 0 ? Math.min(100, (window.scrollY / docH) * 100) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const { data, isLoading } = useNewsPosts(category);
  const posts = (data && data.length > 0) ? data : (category === "Все" ? DEMO_POSTS : DEMO_POSTS.filter(p => p.category === category));

  const [featured, ...rest] = posts;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <div className="sticky top-[98px] z-30 mt-[98px] bg-card/90 backdrop-blur-xl shadow-[0_1px_0_0_hsl(var(--border)/0.5)]">
        <div className="container mx-auto px-3 lg:px-8 h-10 lg:h-11 flex items-center gap-3">
          <nav className="flex-1 min-w-0 flex items-center gap-1.5 text-[11px] lg:text-xs text-muted-foreground whitespace-nowrap overflow-hidden">
            <Link to="/" className="hover:text-foreground transition-colors shrink-0">Главная</Link>
            <span className="shrink-0 opacity-50">/</span>
            <span className="text-foreground truncate min-w-0">Новости</span>
          </nav>
        </div>
        <div className="h-px bg-border/30">
          <div className="h-full bg-foreground/20 transition-[width] duration-100" style={{ width: `${scrollPct}%` }} />
        </div>
      </div>

      <main className="flex-1">
        <section className="bg-background border-b border-border py-12">
          <div className="container mx-auto px-3 lg:px-8">
            <h1 className="font-display text-3xl lg:text-4xl font-bold mb-2">Новости и статьи</h1>
            <p className="text-muted-foreground mb-6">Аналитика, советы и актуальные события рынка коммерческой недвижимости Иркутска</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`px-4 py-1.5 text-sm font-medium border transition-colors ${category === cat ? "bg-foreground text-background border-foreground" : "bg-background text-foreground border-border hover:border-foreground"}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto px-3 lg:px-8 py-10">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 text-muted-foreground">
              <p className="text-lg font-medium mb-1">Нет публикаций</p>
              <p className="text-sm">По выбранной категории пока нет статей</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featured && <FeaturedCard post={featured} />}
              {rest.map(post => (
                <CompactCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
