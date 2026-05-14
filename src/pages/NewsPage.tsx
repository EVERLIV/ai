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
    id: "1", created_at: "2025-05-01T10:00:00Z", updated_at: "2025-05-01T10:00:00Z",
    published_at: "2025-05-01T10:00:00Z", title: "Рынок коммерческой недвижимости Иркутска: итоги квартала",
    slug: "rynok-kommercheskoy-nedvizhimosti-irkutska-itogi-kvartala",
    excerpt: "Анализируем ключевые тренды и сделки первого квартала 2025 года на рынке офисной и торговой недвижимости региона.",
    content: null, cover_url: null, category: "Рынок", tags: ["аналитика", "2025"], status: "published",
    author_name: "Анастасия Романова", views: 412,
  },
  {
    id: "2", created_at: "2025-04-20T09:00:00Z", updated_at: "2025-04-20T09:00:00Z",
    published_at: "2025-04-20T09:00:00Z", title: "5 советов при выборе офиса для малого бизнеса",
    slug: "5-sovetov-pri-vybore-ofisa-dlya-malogo-biznesa",
    excerpt: "На что обратить внимание при аренде первого офиса: локация, класс здания, инфраструктура и скрытые затраты.",
    content: null, cover_url: null, category: "Советы", tags: ["офис", "советы"], status: "published",
    author_name: "Анастасия Романова", views: 289,
  },
  {
    id: "3", created_at: "2025-04-10T08:00:00Z", updated_at: "2025-04-10T08:00:00Z",
    published_at: "2025-04-10T08:00:00Z", title: "АрендаСити открывает новое направление: управление активами",
    slug: "arendacity-otkryvaet-novoe-napravlenie-upravlenie-aktivami",
    excerpt: "Мы запускаем полный цикл управления коммерческой недвижимостью — от поиска арендаторов до юридического сопровождения.",
    content: null, cover_url: null, category: "Новости компании", tags: ["компания"], status: "published",
    author_name: "Анастасия Романова", views: 175,
  },
  {
    id: "4", created_at: "2025-03-28T11:00:00Z", updated_at: "2025-03-28T11:00:00Z",
    published_at: "2025-03-28T11:00:00Z", title: "Изменения в законодательстве об аренде 2025",
    slug: "izmeneniya-v-zakonodatelstve-ob-arende-2025",
    excerpt: "Обзор поправок, вступивших в силу с 1 января 2025 года, которые затрагивают коммерческую аренду и права арендаторов.",
    content: null, cover_url: null, category: "Законы", tags: ["законы", "аренда"], status: "published",
    author_name: "Анастасия Романова", views: 601,
  },
  {
    id: "5", created_at: "2025-03-15T10:00:00Z", updated_at: "2025-03-15T10:00:00Z",
    published_at: "2025-03-15T10:00:00Z", title: "Как правильно оценить стоимость аренды склада",
    slug: "kak-pravilno-ocenit-stoimost-arendy-sklada",
    excerpt: "Методология расчёта арендной ставки для складских помещений разных классов в Иркутске и области.",
    content: null, cover_url: null, category: "Советы", tags: ["склад", "оценка"], status: "published",
    author_name: "Анастасия Романова", views: 198,
  },
  {
    id: "6", created_at: "2025-03-05T09:00:00Z", updated_at: "2025-03-05T09:00:00Z",
    published_at: "2025-03-05T09:00:00Z", title: "Торговая недвижимость Ангарска: новые открытия",
    slug: "torgovaya-nedvizhimost-angarska-novye-otkrytiya",
    excerpt: "Обзор новых торговых площадей и ТЦ Ангарска — потенциал и риски для ретейла в 2025 году.",
    content: null, cover_url: null, category: "Рынок", tags: ["торговля", "Ангарск"], status: "published",
    author_name: "Анастасия Романова", views: 143,
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
