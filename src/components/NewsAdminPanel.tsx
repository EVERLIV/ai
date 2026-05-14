import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Plus, ArrowLeft } from "lucide-react";
import { useAllNewsPosts, useUpsertNews, useDeleteNews, type NewsPost } from "@/hooks/useNews";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = ["Рынок", "Советы", "Новости компании", "Законы", "Акции"];

function toSlug(str: string): string {
  const map: Record<string, string> = {
    а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"yo",ж:"zh",з:"z",и:"i",й:"j",к:"k",л:"l",м:"m",
    н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"h",ц:"ts",ч:"ch",ш:"sh",щ:"sch",
    ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya",
  };
  return str.toLowerCase().split("").map(c => map[c] ?? (/[a-z0-9]/.test(c) ? c : "-")).join("")
    .replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

type FormState = {
  id?: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  tags: string;
  cover_url: string;
  content: string;
  author_name: string;
  status: string;
  published_at: string | null;
};

const emptyForm = (): FormState => ({
  title: "", slug: "", category: "Рынок", excerpt: "", tags: "", cover_url: "",
  content: "", author_name: "Анастасия Романова", status: "draft", published_at: null,
});

function postToForm(post: NewsPost): FormState {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    category: post.category,
    excerpt: post.excerpt ?? "",
    tags: post.tags.join(", "),
    cover_url: post.cover_url ?? "",
    content: post.content ?? "",
    author_name: post.author_name,
    status: post.status,
    published_at: post.published_at,
  };
}

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
}

export default function NewsAdminPanel() {
  const { data: posts, isLoading } = useAllNewsPosts();
  const upsert = useUpsertNews();
  const del = useDeleteNews();
  const { toast } = useToast();

  const [view, setView] = useState<"list" | "editor">("list");
  const [form, setForm] = useState<FormState>(emptyForm());
  const [slugManual, setSlugManual] = useState(false);

  function openNew() {
    setForm(emptyForm());
    setSlugManual(false);
    setView("editor");
  }

  function openEdit(post: NewsPost) {
    setForm(postToForm(post));
    setSlugManual(true);
    setView("editor");
  }

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      if (key === "title" && !slugManual) {
        next.slug = toSlug(value as string);
      }
      if (key === "status" && value === "published" && !prev.published_at) {
        next.published_at = new Date().toISOString();
      }
      return next;
    });
  }

  async function save(publish?: boolean) {
    const payload: Partial<NewsPost> & { title: string; slug: string } = {
      ...(form.id ? { id: form.id } : {}),
      title: form.title,
      slug: form.slug,
      category: form.category,
      excerpt: form.excerpt || null,
      tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
      cover_url: form.cover_url || null,
      content: form.content || null,
      author_name: form.author_name,
      status: publish ? "published" : form.status,
      published_at: publish ? (form.published_at ?? new Date().toISOString()) : form.published_at,
    };
    try {
      await upsert.mutateAsync(payload);
      toast({ title: publish ? "Опубликовано" : "Сохранено" });
      setView("list");
    } catch (e) {
      toast({ title: "Ошибка", description: String(e), variant: "destructive" });
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить статью?")) return;
    try {
      await del.mutateAsync(id);
      toast({ title: "Удалено" });
    } catch (e) {
      toast({ title: "Ошибка", description: String(e), variant: "destructive" });
    }
  }

  const tagChips = form.tags.split(",").map(t => t.trim()).filter(Boolean);

  if (view === "editor") {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={() => setView("list")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Назад
          </button>
          <h2 className="text-lg font-semibold">{form.id ? "Редактировать статью" : "Новая статья"}</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <Label className="text-xs mb-1 block">Заголовок *</Label>
              <Input value={form.title} onChange={e => setField("title", e.target.value)} placeholder="Заголовок статьи" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Слаг</Label>
              <Input
                value={form.slug}
                onChange={e => { setSlugManual(true); setField("slug", e.target.value); }}
                placeholder="url-slug"
                className="font-mono text-xs"
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Категория</Label>
              <Select value={form.category} onValueChange={v => setField("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Краткое описание</Label>
              <Textarea value={form.excerpt} onChange={e => setField("excerpt", e.target.value)} rows={2} placeholder="Краткое описание..." />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Теги (через запятую)</Label>
              <Input value={form.tags} onChange={e => setField("tags", e.target.value)} placeholder="тег1, тег2" />
              {tagChips.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {tagChips.map(t => <span key={t} className="text-xs px-2 py-0.5 bg-muted text-muted-foreground">#{t}</span>)}
                </div>
              )}
            </div>
            <div>
              <Label className="text-xs mb-1 block">Обложка (URL)</Label>
              <Input value={form.cover_url} onChange={e => setField("cover_url", e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Автор</Label>
              <Input value={form.author_name} onChange={e => setField("author_name", e.target.value)} />
            </div>
            <div>
              <Label className="text-xs mb-1 block">Статус</Label>
              <Select value={form.status} onValueChange={v => setField("status", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Черновик</SelectItem>
                  <SelectItem value="published">Опубликован</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs mb-1 block">Содержимое (Markdown)</Label>
            <Textarea
              value={form.content}
              onChange={e => setField("content", e.target.value)}
              rows={20}
              placeholder="# Заголовок&#10;&#10;Текст статьи..."
              className="font-mono text-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button variant="outline" onClick={() => save(false)} disabled={upsert.isPending || !form.title || !form.slug}>
            {upsert.isPending ? "Сохранение..." : "Сохранить черновик"}
          </Button>
          <Button onClick={() => save(true)} disabled={upsert.isPending || !form.title || !form.slug}>
            Опубликовать
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Новости и статьи</h2>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Создать статью</Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground py-8 text-center animate-pulse">Загрузка...</div>
      ) : !posts?.length ? (
        <div className="text-sm text-muted-foreground py-8 text-center">Нет статей. Создайте первую.</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Заголовок</TableHead>
              <TableHead>Категория</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Дата публикации</TableHead>
              <TableHead className="w-24">Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.map(post => (
              <TableRow key={post.id}>
                <TableCell className="font-medium max-w-xs truncate">{post.title}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{post.category}</TableCell>
                <TableCell>
                  {post.status === "published"
                    ? <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-0 text-xs">Опубликован</Badge>
                    : <Badge variant="secondary" className="text-xs">Черновик</Badge>
                  }
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatDate(post.published_at)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openEdit(post)}><Edit className="w-3.5 h-3.5" /></Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(post.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
