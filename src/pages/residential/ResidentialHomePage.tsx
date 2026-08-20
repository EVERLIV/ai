import { Link } from "react-router-dom";
import {
  ArrowRight,
  BedDouble,
  Building2,
  DoorOpen,
  Home,
  House,
  KeyRound,
  Megaphone,
  Sparkles,
  Tag,
} from "lucide-react";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ListPropertyBlock from "@/components/ListPropertyBlock";
import SeoHead from "@/components/SeoHead";
import { absoluteUrl } from "@/config/site";
import { useProperties } from "@/hooks/useProperties";
import PropertyGridCard, { PropertyGridCardSkeleton } from "@/components/PropertyGridCard";
import { buildCatalogUrl } from "@/lib/catalogLinks";
import residentialHero from "@/assets/residential-hero.jpg";
import residentialBannerFree from "@/assets/residential-banner-free.jpg";
import residentialBannerAd from "@/assets/residential-banner-ad.jpg";
import residentialBannerAgency from "@/assets/residential-banner-agency.jpg";
import residentialBannerSlot from "@/assets/residential-banner-slot.jpg";

const categories = [
  {
    title: "Квартиры",
    href: "/zhilaya/kvartiry",
    body: "Студии, 1–4-комнатные квартиры и новостройки.",
    type: "Квартира",
    icon: BedDouble,
  },
  {
    title: "Дома",
    href: "/zhilaya/doma",
    body: "Дома, коттеджи и таунхаусы.",
    type: "Дом",
    icon: House,
  },
  {
    title: "Комнаты",
    href: "/zhilaya/komnaty",
    body: "Комнаты для жизни, учёбы и работы.",
    type: "Комната",
    icon: DoorOpen,
  },
];

export default function ResidentialHomePage() {
  const { data: properties = [], isLoading } = useProperties({ segment: "residential" });
  const featured = properties.slice(0, 12);
  const countsByType = new Map<string, number>();
  properties.forEach((property) => {
    countsByType.set(property.type, (countsByType.get(property.type) || 0) + 1);
  });

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SeoHead
        title="Снять, сдать и купить жильё в Иркутске и области"
        description="Квартиры, дома и комнаты в Иркутске и области. Снимайте, покупайте и размещайте жильё в каталоге ArendaCity. Для собственников размещение бесплатно."
        url={absoluteUrl("/zhilaya")}
      />
      <SiteHeader />

      <section className="pt-14 md:pt-[98px]">
        <div className="relative overflow-hidden border-b border-border/50">
          <img
            src={residentialHero}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(10,15,26,0.86)_0%,rgba(10,15,26,0.64)_44%,rgba(10,15,26,0.18)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,12,20,0.12)_0%,rgba(8,12,20,0.55)_100%)]" />

          <div className="container relative mx-auto px-4 lg:px-8 py-14 lg:py-20">
            <div className="max-w-3xl space-y-6 text-white">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-semibold backdrop-blur">
                <Home className="w-4 h-4" />
                Жилая недвижимость ArendaCity
              </span>
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-display font-bold leading-tight text-balance">
                Снять, сдать и купить жильё в Иркутске и области
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-white/82 sm:text-base">
                Квартиры, дома и комнаты в одном каталоге. Размещение для собственников за 0 ₽.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link to="/zhilaya/catalog" className="inline-flex h-11 items-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
                  Смотреть каталог <ArrowRight className="w-4 h-4" />
                </Link>
                <Link to="/zhilaya/list-property?mode=rent" className="inline-flex h-11 items-center gap-2 rounded-md border border-white/25 bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/15">
                  <KeyRound className="w-4 h-4" />
                  Разместить объект за 0 ₽
                </Link>
              </div>

              <div className="grid gap-3 pt-2 sm:grid-cols-3">
                <div className="rounded-xl border border-white/12 bg-white/10 p-4 backdrop-blur">
                  <div className="text-2xl font-bold">{properties.length || "0"}</div>
                  <div className="text-xs text-white/70">объектов в жилом разделе</div>
                </div>
                <div className="rounded-xl border border-white/12 bg-white/10 p-4 backdrop-blur">
                  <div className="text-2xl font-bold">0 ₽</div>
                  <div className="text-xs text-white/70">размещение для собственников</div>
                </div>
                <div className="rounded-xl border border-white/12 bg-white/10 p-4 backdrop-blur">
                  <div className="text-2xl font-bold">Иркутск</div>
                  <div className="text-xs text-white/70">и вся область в одном каталоге</div>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-white/10 bg-[#0d1420]">
            <div className="container mx-auto flex flex-wrap items-center gap-3 px-4 py-4 lg:px-8">
              <Link to={buildCatalogUrl({ segment: "residential", deal: "Продажа" })} className="inline-flex h-10 items-center rounded-full border border-white/10 bg-white px-4 text-sm font-medium text-foreground">
                Купить
              </Link>
              <Link to={buildCatalogUrl({ segment: "residential", deal: "Аренда" })} className="inline-flex h-10 items-center rounded-full border border-white/15 bg-white/10 px-4 text-sm font-medium text-white">
                Снять надолго
              </Link>
              <Link to="/zhilaya/list-property?mode=rent" className="inline-flex h-10 items-center rounded-full border border-primary/30 bg-primary/15 px-4 text-sm font-semibold text-white">
                Сдать жильё за 0 ₽
              </Link>
              <div className="ml-auto text-sm text-white/70">
                Бесплатное размещение в жилом разделе.
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-background py-10">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid gap-5 md:grid-cols-3">
            {categories.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.href} to={item.href} className="rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-md">
                  <Icon className="mb-4 h-5 w-5 text-primary" />
                  <div className="mb-1 text-lg font-semibold text-foreground">{item.title}</div>
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                  <div className="mt-4 inline-flex items-center gap-2 text-xs font-semibold text-primary">
                    {countsByType.get(item.type) || 0} объектов
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-muted/20 py-12">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                <Sparkles className="h-4 w-4" />
                Жилой каталог
              </div>
              <h2 className="mt-2 text-2xl font-display font-bold text-foreground sm:text-3xl">
                Актуальные квартиры, дома и комнаты
              </h2>
            </div>
            <Link to="/zhilaya/catalog" className="inline-flex h-11 items-center justify-center gap-2 rounded-md border border-border bg-card px-5 text-sm font-semibold text-foreground transition-colors hover:bg-background">
              Все объекты <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
            <div>
              {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {Array.from({ length: 9 }).map((_, index) => (
                    <PropertyGridCardSkeleton key={index} />
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {featured.slice(0, 3).map((property) => (
                    <PropertyGridCard key={property.id} property={property} />
                  ))}

                  <div className="group relative overflow-hidden rounded-2xl border border-primary/20 bg-card">
                    <img src={residentialBannerAd} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,12,20,0.15)_0%,rgba(8,12,20,0.82)_100%)]" />
                    <div className="relative flex h-full min-h-[220px] flex-col justify-end p-6 text-white">
                      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur">
                        <Megaphone className="h-5 w-5" />
                      </div>
                      <div className="text-lg font-semibold">Ваш баннер здесь</div>
                      <p className="mt-1 text-sm text-white/78">Агентство, ЖК или партнёр.</p>
                      <Link to="/contacts" className="mt-4 inline-flex h-10 w-fit items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
                        Забронировать место
                      </Link>
                    </div>
                  </div>

                  {featured.slice(3, 9).map((property) => (
                    <PropertyGridCard key={property.id} property={property} />
                  ))}
                </div>
              )}
            </div>

            <aside className="space-y-4">
              <Link to="/zhilaya/list-property?mode=rent" className="group block overflow-hidden rounded-2xl border border-border bg-card">
                <div className="relative h-56 overflow-hidden">
                  <img src={residentialBannerFree} alt="Бесплатное размещение жилья" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,12,20,0.04)_0%,rgba(8,12,20,0.8)_100%)]" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur">
                      <Tag className="h-4 w-4" />
                    </div>
                    <div className="mt-3 text-lg font-semibold">Разместить за 0 ₽</div>
                    <p className="mt-1 text-sm text-white/78">Квартира, дом или комната.</p>
                  </div>
                </div>
              </Link>

              <Link to="/contacts" className="group block overflow-hidden rounded-2xl border border-dashed border-primary/35 bg-card">
                <div className="relative h-56 overflow-hidden">
                  <img src={residentialBannerAd} alt="Рекламный баннер для агентства" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(8,12,20,0.08)_0%,rgba(8,12,20,0.82)_100%)]" />
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <div className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur">
                      <Building2 className="h-4 w-4" />
                    </div>
                    <div className="mt-3 text-lg font-semibold">Сдаётся место</div>
                    <p className="mt-1 text-sm text-white/78">Баннер для агентства или ЖК.</p>
                  </div>
                </div>
              </Link>
            </aside>
          </div>
        </div>
      </section>

      <section className="bg-muted/20 py-8">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="rounded-2xl border border-primary/15 bg-primary/5 p-6 lg:flex lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                <Sparkles className="h-4 w-4" />
                Для собственников
              </div>
              <h2 className="mt-2 text-2xl font-display font-bold text-foreground">Разместите жильё бесплатно и получайте заявки</h2>
              <p className="mt-2 text-sm text-muted-foreground">Публикация занимает несколько минут.</p>
            </div>
            <Link to="/zhilaya/list-property?mode=rent" className="mt-4 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 lg:mt-0">
              Добавить объект
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-background py-8">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="grid gap-4 md:grid-cols-2">
            <Link to="/contacts" className="group relative overflow-hidden rounded-2xl border border-border bg-card min-h-[180px]">
              <img src={residentialBannerAgency} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,12,20,0.78)_0%,rgba(8,12,20,0.35)_70%,rgba(8,12,20,0.15)_100%)]" />
              <div className="relative flex h-full min-h-[180px] flex-col justify-end p-6 text-white">
                <div className="text-lg font-semibold">Реклама агентства</div>
                <p className="mt-1 text-sm text-white/78">Для агентства, ЖК или партнёра.</p>
              </div>
            </Link>
            <Link to="/contacts" className="group relative overflow-hidden rounded-2xl border border-border bg-card min-h-[180px]">
              <img src={residentialBannerSlot} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(8,12,20,0.78)_0%,rgba(8,12,20,0.35)_70%,rgba(8,12,20,0.15)_100%)]" />
              <div className="relative flex h-full min-h-[180px] flex-col justify-end p-6 text-white">
                <div className="text-lg font-semibold">Место сдаётся</div>
                <p className="mt-1 text-sm text-white/78">Под акцию, ЖК или подборку объектов.</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-background">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="border-t border-border/60" />
        </div>
      </section>

      <ListPropertyBlock segment="residential" />
      <SiteFooter />
    </div>
  );
}
