import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Newspaper, Eye, Calendar, User } from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import NewsSidebar from "@/components/NewsSidebar";
import PropertyAIChat from "@/components/PropertyAIChat";
import { useNewsPost, useNewsPosts } from "@/hooks/useNews";
import { supabase } from "@/integrations/supabase/client";
import SeoHead from "@/components/SeoHead";
import { absoluteUrl } from "@/config/site";
import { FALLBACK_NEWS_POSTS, mergeNewsPosts } from "@/data/newsFallback";

const CATEGORY_COLORS: Record<string, string> = {
  "Рынок": "bg-blue-100 text-blue-700",
  "Советы": "bg-emerald-100 text-emerald-700",
  "Новости компании": "bg-primary/10 text-primary",
  "Законы": "bg-amber-100 text-amber-700",
};

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

  const allPosts = useMemo(() => mergeNewsPosts(dbAllPosts ?? [], FALLBACK_NEWS_POSTS), [dbAllPosts]);
  const localPost = FALLBACK_NEWS_POSTS.find((p) => p.slug === slug);
  const post = (dbPost ?? undefined) || (!isLoading ? localPost : undefined);

  useEffect(() => {
    if (dbPost?.id) {
      supabase.from("news_posts").update({ views: (dbPost.views ?? 0) + 1 }).eq("id", dbPost.id).then(() => {});
    }
  }, [dbPost?.id]);

  const related = allPosts.filter((p) => p.slug !== slug).slice(0, 3);
  const catColor = post ? (CATEGORY_COLORS[post.category] ?? "bg-muted text-muted-foreground") : "";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {post && (
        <SeoHead
          title={post.title}
          description={post.excerpt || post.title}
          image={post.cover_url}
          url={absoluteUrl(`/news/${post.slug}`)}
          type="article"
        />
      )}
      <SiteHeader />

      <div className="sticky top-[56px] md:top-[98px] z-30 mt-[56px] md:mt-[98px] bg-card/90 backdrop-blur-xl shadow-[0_1px_0_0_hsl(var(--border)/0.5)]">
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
