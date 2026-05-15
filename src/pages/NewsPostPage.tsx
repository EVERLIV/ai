import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Newspaper, Eye, Calendar, User, ArrowLeft } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import NewsSidebar from "@/components/NewsSidebar";
import PropertyAIChat from "@/components/PropertyAIChat";
import { useNewsPost, useNewsPosts, type NewsPost } from "@/hooks/useNews";
import { supabase } from "@/integrations/supabase/client";

const CATEGORY_COLORS: Record<string, string> = {
  "Рынок": "bg-blue-100 text-blue-700",
  "Советы": "bg-emerald-100 text-emerald-700",
  "Новости компании": "bg-primary/10 text-primary",
  "Законы": "bg-amber-100 text-amber-700",
};

// Local fallback posts — shown when Supabase table doesn't exist yet
const LOCAL_POSTS: NewsPost[] = [
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
    content: "Объединённая компания Wildberries & Russ (RWB) ведёт переговоры с ВТБ о покупке или аренде бывшего офиса банка «Открытие» на Летниковской улице рядом с Павелецким вокзалом.\n\nРечь идёт о здании в составе бизнес-центра **Vivaldi Plaza** площадью около **24 400 кв. м**. Стартовая стоимость актива — **7,7 млрд рублей**.\n\n*Источник: [CRE.ru](https://cre.ru/news/101580)*",
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
    content: "«Атол» арендовал стойки с плотностью энергопотребления **13 кВт** в дата-центре MOS5 оператора IXcellerate.\n\nПроект соответствует стандарту надёжности **Tier III**.\n\n*Источник: [CRE.ru](https://cre.ru/news/101581)*",
    cover_url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&q=80",
    category: "Новости компании", tags: ["IT", "дата-центр"], status: "published",
    author_name: "Редакция CRE", views: 67,
  },
  {
    id: "5", created_at: "2026-05-13T12:26:00Z", updated_at: "2026-05-13T12:26:00Z",
    published_at: "2026-05-13T12:26:00Z",
    title: "«Северные Врата»: два склада выходят на финальный этап",
    slug: "severnye-vrata-finalnyy-etap-stroitelstva",
    excerpt: "Строительная готовность первых двух блоков индустриального парка достигла 80%.",
    content: "Строительство первой фазы индустриального парка **«Северные Врата»** вышло на финальный этап: готовность двух первых блоков составляет порядка **80%**.\n\nВ мае планируется заливка **7 000 кубометров** промышленных полов стандарта **FM-2 special** — несущая способность до 8 тонн/м².\n\n*Источник: [CRE.ru](https://cre.ru/news/101575)*",
    cover_url: "https://images.unsplash.com/photo-1553413077-190dd305871c?w=800&q=80",
    category: "Рынок", tags: ["склады", "строительство"], status: "published",
    author_name: "Редакция CRE", views: 89,
  },
  {
    id: "6", created_at: "2026-05-12T09:00:00Z", updated_at: "2026-05-12T09:00:00Z",
    published_at: "2026-05-12T09:00:00Z",
    title: "Как выбрать склад для e-commerce: 7 ключевых параметров",
    slug: "kak-vybrat-sklad-dlya-ecommerce-7-parametrov",
    excerpt: "На что обратить внимание при аренде складского помещения: высота потолков, пандусы, температурный режим и сертификация.",
    content: "При выборе склада для интернет-торговли важно учитывать несколько ключевых параметров.\n\n## 1. Высота потолков\nДля современного e-commerce оптимальная высота — **от 10 метров**.\n\n## 2. Пол и нагрузки\nПромышленный пол стандарта FM-2 выдерживает **от 5 тонн/м²**.\n\n## 3. Пандусы и ворота\nМинимум **1 ворота на 1 000 кв. м**.\n\n## 4. Температурный режим\nДля стандартных товаров — отапливаемый склад от +10°C.\n\n## 5. Пожарная безопасность\nСпринклерная система и категория **В2** обязательны.\n\n## 6. Локация и транспорт\nРасстояние до КАД/МКАД, удобство подъезда для фур.\n\n## 7. Юридический статус\nПроверьте класс здания и отсутствие обременений.\n\n*Материал подготовлен АрендаСити*",
    cover_url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&q=80",
    category: "Советы", tags: ["склад", "e-commerce", "аренда"], status: "published",
    author_name: "Анастасия Романова", views: 324,
  },
];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" });
}

export default function NewsPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [scrollPct, setScrollPct] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      setScrollPct(docH > 0 ? Math.min(100, (window.scrollY / docH) * 100) : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const { data: dbPost, isLoading } = useNewsPost(slug ?? "");
  const { data: dbAllPosts } = useNewsPosts();

  const localPost = LOCAL_POSTS.find(p => p.slug === slug);
  // dbPost is null when Supabase returned error (no table yet), undefined while loading
  const post = (dbPost ?? undefined) || (!isLoading ? localPost : undefined);
  const allPosts = (dbAllPosts && dbAllPosts.length > 0) ? dbAllPosts : LOCAL_POSTS;

  useEffect(() => {
    if (dbPost?.id) {
      supabase.from("news_posts").update({ views: (dbPost.views ?? 0) + 1 }).eq("id", dbPost.id).then(() => {});
    }
  }, [dbPost?.id]);

  const related = allPosts.filter(p => p.slug !== slug).slice(0, 3);
  const catColor = post ? (CATEGORY_COLORS[post.category] ?? "bg-muted text-muted-foreground") : "";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />

      <div className="sticky top-[98px] z-30 mt-[98px] bg-card/90 backdrop-blur-xl shadow-[0_1px_0_0_hsl(var(--border)/0.5)]">
        <div className="container mx-auto px-3 lg:px-8 h-10 lg:h-11 flex items-center gap-3">
          <nav className="flex-1 min-w-0 flex items-center gap-1.5 text-[11px] lg:text-xs text-muted-foreground whitespace-nowrap overflow-hidden">
            <Link to="/" className="hover:text-foreground transition-colors shrink-0">Главная</Link>
            <span className="shrink-0 opacity-50">/</span>
            <Link to="/news" className="hover:text-foreground transition-colors shrink-0">Новости</Link>
            <span className="shrink-0 opacity-50">/</span>
            <span className="text-foreground truncate min-w-0">{post?.title ?? "..."}</span>
          </nav>
        </div>
        <div className="h-px bg-border/30">
          <div className="h-full bg-foreground/20 transition-[width] duration-100" style={{ width: `${scrollPct}%` }} />
        </div>
      </div>

      <main className="flex-1">
        {isLoading && !localPost ? (
          <div className="container mx-auto px-3 lg:px-8 py-16 max-w-3xl">
            <div className="animate-pulse space-y-4">
              <div className="h-64 bg-muted" />
              <div className="h-8 w-2/3 bg-muted rounded" />
              <div className="h-4 w-full bg-muted rounded" />
              <div className="h-4 w-5/6 bg-muted rounded" />
            </div>
          </div>
        ) : !post ? (
          <div className="container mx-auto px-3 lg:px-8 py-20 text-center text-muted-foreground">
            <p className="text-lg font-medium mb-2">Статья не найдена</p>
            <Link to="/news" className="text-primary text-sm hover:underline">Вернуться к новостям</Link>
          </div>
        ) : (
          <div className="container mx-auto px-3 lg:px-8 py-10">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Article */}
              <article className="flex-1 min-w-0">
                <div className="h-64 bg-muted flex items-center justify-center mb-8 overflow-hidden">
                  {post.cover_url
                    ? <img src={post.cover_url} alt={post.title} className="w-full h-full object-cover" />
                    : <Newspaper className="w-16 h-16 text-muted-foreground/30" />
                  }
                </div>

                <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-muted-foreground">
                  <span className={`inline-block text-[11px] font-medium px-2 py-0.5 ${catColor}`}>{post.category}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(post.published_at || post.created_at)}</span>
                  <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{post.author_name}</span>
                  <span className="flex items-center gap-1 ml-auto"><Eye className="w-3.5 h-3.5" />{post.views}</span>
                </div>

                <h1 className="font-display text-3xl font-bold leading-snug mb-4">{post.title}</h1>

                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-6">
                    {post.tags.map(tag => (
                      <span key={tag} className="text-xs px-2 py-0.5 bg-muted text-muted-foreground">#{tag}</span>
                    ))}
                  </div>
                )}

                {post.excerpt && !post.content && (
                  <p className="text-muted-foreground text-lg leading-relaxed">{post.excerpt}</p>
                )}

                {post.content && (
                  <div className="prose prose-sm max-w-none prose-headings:font-display prose-headings:font-bold prose-a:text-primary">
                    <ReactMarkdown>{post.content}</ReactMarkdown>
                  </div>
                )}

                {/* Related */}
                {related.length > 0 && (
                  <div className="mt-10 pt-8 border-t border-border">
                    <h2 className="font-display text-lg font-bold mb-4">Читать также</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {related.map(p => (
                        <Link key={p.id} to={`/news/${p.slug}`} className="group block border border-border bg-card hover:-translate-y-0.5 transition-all p-4">
                          <span className={`inline-block text-[11px] font-medium px-2 py-0.5 mb-2 ${CATEGORY_COLORS[p.category] ?? "bg-muted text-muted-foreground"}`}>{p.category}</span>
                          <p className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-3">{p.title}</p>
                          <span className="text-xs text-muted-foreground mt-1 block">{formatDate(p.published_at || p.created_at)}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </article>

              {/* Sidebar */}
              <div className="hidden lg:block lg:w-[280px] xl:w-[300px] shrink-0 sticky top-[110px] self-start"><NewsSidebar /></div>
            </div>
          </div>
        )}
      </main>

      <SiteFooter />
      <PropertyAIChat />
    </div>
  );
}
