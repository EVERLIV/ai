import Fuse from "fuse.js";
import { Loader2, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SeoHead from "@/components/SeoHead";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import AgencyListCard from "@/components/specialists/AgencyListCard";
import RealtorListCard from "@/components/specialists/RealtorListCard";
import SpecialistMatchQuiz from "@/components/specialists/SpecialistMatchQuiz";
import SpecialistsQuizBanner from "@/components/specialists/SpecialistsQuizBanner";
import {
  isQuizDismissed,
  pluralAgencies,
  pluralRealtors,
} from "@/components/specialists/specialistUtils";
import {
  usePublicAgenciesCatalog,
  usePublicManagersCatalog,
} from "@/hooks/useAgency";
import {
  IRKUTSK_CITY_DISTRICTS,
  IRKUTSK_OBLAST_CITIES,
} from "@/lib/irkutskLocations";
import { cn } from "@/lib/utils";

type Tab = "rieltory" | "agentstva";
type Sort = "default" | "objects" | "name";

const SPECIALIST_SORT_OPTIONS: { label: string; value: Sort }[] = [
  { label: "По умолчанию", value: "default" },
  { label: "По числу объектов", value: "objects" },
  { label: "По имени / названию", value: "name" },
];

const PROPERTY_TYPE_FILTERS = [
  "Все типы",
  "Квартира",
  "Дом",
  "Офис",
  "Торговая",
  "Склад",
  "Земля",
  "Участок",
] as const;

function matchesCity(districts: string[], city: string): boolean {
  if (city === "Все") return true;
  if (!districts.length) return false;
  const needle = city.toLowerCase();
  return districts.some(
    (d) => d === city || d.toLowerCase().includes(needle),
  );
}

export default function SpecialistsCatalog() {
  const [params, setParams] = useSearchParams();
  const tab: Tab =
    params.get("tab") === "agentstva" ? "agentstva" : "rieltory";
  const [query, setQuery] = useState(params.get("q") || "");
  const [city, setCity] = useState(params.get("city") || "Все");
  const [propertyType, setPropertyType] = useState(
    params.get("type") || "Все типы",
  );
  const [sort, setSort] = useState<Sort>(() => {
    const s = params.get("sort");
    if (s === "objects" || s === "name") return s;
    return "default";
  });
  const [quizOpen, setQuizOpen] = useState(false);

  const { data: managers = [], isLoading: managersLoading } =
    usePublicManagersCatalog();
  const { data: agencies = [], isLoading: agenciesLoading } =
    usePublicAgenciesCatalog();

  useEffect(() => {
    if (!isQuizDismissed()) {
      const t = window.setTimeout(() => setQuizOpen(true), 400);
      return () => window.clearTimeout(t);
    }
  }, []);

  const setTab = (next: Tab) => {
    const p = new URLSearchParams(params);
    if (next === "rieltory") p.delete("tab");
    else p.set("tab", next);
    setParams(p, { replace: true });
  };

  const onCityChange = (value: string) => {
    setCity(value);
    const p = new URLSearchParams(params);
    if (value === "Все") p.delete("city");
    else p.set("city", value);
    setParams(p, { replace: true });
  };

  const filteredManagers = useMemo(() => {
    let list = managers.filter((m) => {
      if (!matchesCity(m.districts, city)) return false;
      if (propertyType !== "Все типы") {
        const types = m.property_types ?? [];
        if (
          !types.some((t) =>
            t.toLowerCase().includes(propertyType.toLowerCase()),
          )
        ) {
          return false;
        }
      }
      return true;
    });

    const q = query.trim();
    if (q) {
      const fuse = new Fuse(list, {
        keys: [
          { name: "full_name", weight: 0.5 },
          { name: "phone", weight: 0.2 },
          { name: "agency.name", weight: 0.3 },
        ],
        threshold: 0.4,
        ignoreLocation: true,
      });
      list = fuse.search(q).map((h) => h.item);
    }

    if (sort === "objects") {
      list = [...list].sort((a, b) => b.objects_count - a.objects_count);
    } else if (sort === "name") {
      list = [...list].sort((a, b) =>
        a.full_name.localeCompare(b.full_name, "ru"),
      );
    } else if (!q) {
      list = [...list].sort((a, b) => b.objects_count - a.objects_count);
    }
    return list;
  }, [managers, query, propertyType, sort, city]);

  const filteredAgencies = useMemo(() => {
    let list = agencies.filter((a) => matchesCity(a.districts, city));

    const q = query.trim();
    if (q) {
      const fuse = new Fuse(list, {
        keys: [
          { name: "name", weight: 0.7 },
          { name: "about", weight: 0.3 },
        ],
        threshold: 0.4,
        ignoreLocation: true,
      });
      list = fuse.search(q).map((h) => h.item);
    }

    if (sort === "objects") {
      list = [...list].sort((a, b) => b.objects_count - a.objects_count);
    } else if (sort === "name") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name, "ru"));
    } else if (!q) {
      list = [...list].sort((a, b) => b.objects_count - a.objects_count);
    }
    return list;
  }, [agencies, query, sort, city]);

  const loading = tab === "rieltory" ? managersLoading : agenciesLoading;
  const count =
    tab === "rieltory" ? filteredManagers.length : filteredAgencies.length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SeoHead
        title="Риелторы и агентства недвижимости — АрендаСити"
        description="Каталог проверенных риелторов и агентств в Иркутске. Подберём специалиста под ваш запрос."
      />
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 lg:px-8 pt-[72px] md:pt-[114px] pb-16">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
            Риелторы и агенты по недвижимости
          </h1>
          <Link
            to="/catalog"
            className="text-sm text-primary hover:underline shrink-0"
          >
            Каталог объектов →
          </Link>
        </div>

        <div className="flex gap-6 border-b border-border/70 mb-5">
          {(
            [
              { id: "rieltory" as const, label: "Риелторы" },
              { id: "agentstva" as const, label: "Агентства" },
            ] as const
          ).map((t) => {
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
          <select
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            aria-label="Город или район"
            className="h-10 min-w-[11rem] max-w-full sm:max-w-[16rem] px-3 rounded-lg border border-border bg-card text-sm text-foreground"
          >
            <optgroup label="Все">
              <option value="Все">Все города</option>
            </optgroup>
            <optgroup label="г. Иркутск — районы">
              {IRKUTSK_CITY_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </optgroup>
            <optgroup label="Города и посёлки области">
              {IRKUTSK_OBLAST_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </optgroup>
          </select>
          <select
            value={propertyType}
            onChange={(e) => setPropertyType(e.target.value)}
            className="h-10 px-3 rounded-lg border border-border bg-card text-sm text-foreground"
          >
            {PROPERTY_TYPE_FILTERS.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                tab === "rieltory"
                  ? "Имя, телефон или название агентства"
                  : "Название агентства"
              }
              className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-card text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <SpecialistsQuizBanner
          onOpenQuiz={() => setQuizOpen(true)}
          className="mb-6"
        />

        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <p className="text-sm text-muted-foreground">
            {loading ? (
              "Загрузка…"
            ) : tab === "rieltory" ? (
              <>
                Найдено {count} {pluralRealtors(count)}
                {city !== "Все" ? ` · ${city}` : ""}
              </>
            ) : (
              <>
                Найдено {count} {pluralAgencies(count)}
                {city !== "Все" ? ` · ${city}` : ""}
              </>
            )}
          </p>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="h-9 px-3 rounded-lg border border-border bg-card text-xs text-foreground"
          >
            {SPECIALIST_SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Загрузка…
          </div>
        ) : tab === "rieltory" ? (
          filteredManagers.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">
              Риелторы не найдены. Попробуйте изменить фильтры.
            </p>
          ) : (
            <div>
              {filteredManagers.map((m) => (
                <RealtorListCard key={m.id} manager={m} />
              ))}
            </div>
          )
        ) : filteredAgencies.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted-foreground">
            Агентства не найдены.
          </p>
        ) : (
          <div>
            {filteredAgencies.map((a) => (
              <AgencyListCard key={a.id} agency={a} />
            ))}
          </div>
        )}
      </main>

      <SiteFooter />
      <SpecialistMatchQuiz open={quizOpen} onOpenChange={setQuizOpen} />
    </div>
  );
}
