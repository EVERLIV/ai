import Fuse from "fuse.js";
import { Loader2, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import DeveloperListCard from "@/components/developers/DeveloperListCard";
import SeoHead from "@/components/SeoHead";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { usePublicDeveloperProjects, useVerifiedDevelopers } from "@/hooks/useDeveloper";
import type { DeveloperSubtype } from "@/lib/developerTypes";
import { cn } from "@/lib/utils";

type Tab = "apartment_developer" | "frame_house_builder";
type Sort = "default" | "name";

const TABS: { id: Tab; label: string }[] = [
  { id: "apartment_developer", label: "Многоквартирные дома" },
  { id: "frame_house_builder", label: "Деревянные дома" },
];

function pluralDevelopers(n: number) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "застройщик";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14))
    return "застройщика";
  return "застройщиков";
}

export default function DevelopersCatalog() {
  const [params, setParams] = useSearchParams();
  const tab: Tab =
    params.get("tab") === "derevo"
      ? "frame_house_builder"
      : "apartment_developer";
  const [query, setQuery] = useState(params.get("q") || "");
  const [sort, setSort] = useState<Sort>("default");

  const { data: developers = [], isLoading } = useVerifiedDevelopers({
    subtype: tab,
  });
  const { data: projects = [] } = usePublicDeveloperProjects();

  const projectCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of projects) {
      map.set(p.developer_id, (map.get(p.developer_id) || 0) + 1);
    }
    return map;
  }, [projects]);

  const setTab = (next: Tab) => {
    const p = new URLSearchParams(params);
    if (next === "apartment_developer") p.delete("tab");
    else p.set("tab", "derevo");
    setParams(p, { replace: true });
  };

  const filtered = useMemo(() => {
    let list = developers;
    const q = query.trim();
    if (q) {
      const fuse = new Fuse(list, {
        keys: [
          { name: "name", weight: 0.6 },
          { name: "city", weight: 0.2 },
          { name: "about", weight: 0.2 },
        ],
        threshold: 0.4,
        ignoreLocation: true,
      });
      list = fuse.search(q).map((h) => h.item);
    }
    if (sort === "name") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name, "ru"));
    }
    return list;
  }, [developers, query, sort]);

  const subtype: DeveloperSubtype = tab;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SeoHead
        title="Застройщики — АрендаСити"
        description="Каталог застройщиков: ЖК и деревянные дома в Иркутске и области"
      />
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 lg:px-8 pt-[72px] md:pt-[114px] pb-16">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            Застройщики
          </h1>
          <Link
            to="/zastroyshchikam"
            className="text-sm text-primary hover:underline shrink-0"
          >
            Застройщикам →
          </Link>
        </div>

        <div className="flex gap-6 border-b border-border/70 mb-5">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={cn(
                  "relative pb-2.5 text-sm font-medium transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t.label}
                {active && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Название компании или город"
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-card text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <p className="text-sm text-muted-foreground">
            {isLoading
              ? "Загрузка…"
              : `Найдено ${filtered.length} ${pluralDevelopers(filtered.length)}`}
          </p>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="h-9 px-3 rounded-lg border border-border bg-card text-xs text-foreground"
          >
            <option value="default">По умолчанию</option>
            <option value="name">По названию</option>
          </select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Загрузка…
          </div>
        ) : filtered.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            {subtype === "frame_house_builder"
              ? "Пока нет застройщиков деревянных домов."
              : "Пока нет застройщиков многоквартирных домов."}
          </p>
        ) : (
          <div>
            {filtered.map((d) => (
              <DeveloperListCard
                key={d.id}
                developer={d}
                projectsCount={projectCounts.get(d.id) || 0}
              />
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
