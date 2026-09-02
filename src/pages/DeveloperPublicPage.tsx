import {
  ArrowLeft,
  Building2,
  Loader2,
  MapPin,
  Phone,
} from "lucide-react";
import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import DeveloperPromotions from "@/components/developers/DeveloperPromotions";
import PropertyGridCard from "@/components/PropertyGridCard";
import SeoHead from "@/components/SeoHead";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import SpecialistContactForm from "@/components/specialists/SpecialistContactForm";
import { RatingBadge } from "@/components/specialists/SpecialistReviews";
import { pluralObjects } from "@/components/specialists/specialistUtils";
import VerifiedBadge from "@/components/VerifiedBadge";
import {
  useDeveloperPublic,
  useDeveloperPublicProjects,
  useDeveloperPublicProperties,
  useTrackDeveloperEvent,
} from "@/hooks/useDeveloper";
import { isProfileVerified } from "@/hooks/useProfile";
import type { DbProperty } from "@/hooks/useProperties";
import { buildCatalogUrl } from "@/lib/catalogLinks";
import {
  DEVELOPER_PROJECT_STATUS_LABELS,
  DEVELOPER_SUBTYPE_LABELS,
  parseDeveloperPromotions,
} from "@/lib/developerTypes";

const DEVELOPER_INTENTS = [
  "Купить квартиру",
  "Ипотека",
  "Рассрочка",
  "Показ",
  "Другой запрос",
] as const;

const FRAME_DEVELOPER_INTENTS = [
  "Дом на заказ",
  "Ипотека",
  "Рассрочка",
  "Показ",
  "Другой запрос",
] as const;

export default function DeveloperPublicPage() {
  const { id } = useParams<{ id: string }>();
  const { data: developer, isLoading, error } = useDeveloperPublic(id);
  const { data: projects = [] } = useDeveloperPublicProjects(id);
  const { data: rawProperties = [], isLoading: propsLoading } =
    useDeveloperPublicProperties(id);
  const track = useTrackDeveloperEvent();

  const properties = rawProperties as unknown as DbProperty[];
  const promotions = useMemo(
    () => parseDeveloperPromotions(developer?.promotions),
    [developer?.promotions],
  );

  useEffect(() => {
    if (!developer?.id) return;
    track.mutate({
      event_type: "view_developer",
      developer_id: developer.id,
      source_page: `/zastroyshchik/${developer.id}`,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [developer?.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Загрузка…
      </div>
    );
  }

  if (error || !developer) {
    return (
      <div className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1 container mx-auto px-4 py-20 text-center">
          <h1 className="text-xl font-semibold">Застройщик не найден</h1>
          <Link
            to="/zastroyshchiki"
            className="text-primary text-sm mt-4 inline-block hover:underline"
          >
            Все застройщики
          </Link>
        </main>
        <SiteFooter />
      </div>
    );
  }

  const verified = isProfileVerified(developer.verification_status);
  const isFrameBuilder = developer.subtype === "frame_house_builder";
  const catalogHref = buildCatalogUrl({
    seller: "developer",
    segment: "residential",
    ...(isFrameBuilder
      ? { types: ["Дом на заказ", "Дом", "Коттедж", "Дача"], market: "На заказ" }
      : {}),
  });
  const objectsCount = properties.length;
  const listingsTitle = isFrameBuilder
    ? "Дома на заказ"
    : "Квартиры в продаже";
  const backTab =
    developer.subtype === "frame_house_builder"
      ? "/zastroyshchiki?tab=derevo"
      : "/zastroyshchiki";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SeoHead
        title={`${developer.name} — застройщик`}
        description={
          developer.about?.slice(0, 160) ||
          `Проекты застройщика ${developer.name} на ДАДАТУТ`
        }
      />
      <SiteHeader />

      <div className="mt-[56px] lg:mt-[104px] border-b border-border/50">
        <div className="container mx-auto px-4 lg:px-8 h-10 flex items-center">
          <Link
            to={backTab}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Все застройщики
          </Link>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
          <div className="flex-1 min-w-0 space-y-8">
            <section className="flex flex-col sm:flex-row gap-5 items-start">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border border-border bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                {developer.logo_url ? (
                  <img
                    src={developer.logo_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building2 className="w-8 h-8 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="font-display text-2xl sm:text-3xl font-bold text-foreground">
                    {developer.name}
                  </h1>
                  {verified && <VerifiedBadge />}
                </div>
                <p className="text-sm text-muted-foreground">
                  {DEVELOPER_SUBTYPE_LABELS[developer.subtype]}
                  {developer.city ? ` · ${developer.city}` : ""}
                </p>
                {developer.avg_rating ? (
                  <RatingBadge
                    avgRating={developer.avg_rating}
                    reviewsCount={developer.reviews_count}
                    href="#reviews"
                    className="text-sm"
                  />
                ) : null}
                {verified && (
                  <p className="text-xs text-primary">
                    Документы застройщика проверены
                  </p>
                )}
                {developer.about && (
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl whitespace-pre-line">
                    {developer.about}
                  </p>
                )}
                {developer.phone && (
                  <a
                    href={`tel:${developer.phone.replace(/\D/g, "")}`}
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    <Phone className="w-4 h-4" />
                    {developer.phone}
                  </a>
                )}
              </div>
            </section>

            <DeveloperPromotions promotions={promotions} />

            {projects.length > 0 && (
              <section className="space-y-4">
                <h2 className="text-lg font-semibold">Проекты</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {projects.map((p) => (
                    <Link
                      key={p.id}
                      to={`/proekt/${p.id}`}
                      className="group rounded-xl border border-border/60 overflow-hidden bg-card hover:border-border hover:bg-muted/20 transition-colors"
                    >
                      <div className="aspect-[16/9] bg-muted">
                        {p.cover_photo ? (
                          <img
                            src={p.cover_photo}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                          />
                        ) : null}
                      </div>
                      <div className="p-4 space-y-1">
                        <h3 className="text-sm font-semibold group-hover:text-primary">
                          {p.title}
                        </h3>
                        <p className="text-[11px] text-muted-foreground">
                          {isFrameBuilder
                            ? "Под заказ"
                            : DEVELOPER_PROJECT_STATUS_LABELS[p.status]}
                          {!isFrameBuilder && p.delivery_year
                            ? ` · ${p.delivery_year}`
                            : ""}
                        </p>
                        {p.address && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 shrink-0" />
                            {p.address}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            <section className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">{listingsTitle}</h2>
                {!propsLoading && objectsCount > 0 && (
                  <Link
                    to={catalogHref}
                    className="text-sm text-primary hover:underline"
                  >
                    Все в каталоге →
                  </Link>
                )}
              </div>
              {propsLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground py-8">
                  <Loader2 className="w-4 h-4 animate-spin" /> Загрузка…
                </div>
              ) : objectsCount === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Объявлений пока нет.
                </p>
              ) : (
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                  {properties.map((p) => (
                    <PropertyGridCard key={p.id} property={p} />
                  ))}
                </div>
              )}
            </section>

            <section
              id="reviews"
              className="scroll-mt-24 space-y-3 rounded-xl border border-border/60 bg-card p-4 sm:p-5"
            >
              <h2 className="text-lg font-semibold">Отзывы</h2>
              {developer.avg_rating ? (
                <RatingBadge
                  avgRating={developer.avg_rating}
                  reviewsCount={developer.reviews_count}
                  className="text-sm"
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  Пока нет опубликованных отзывов о застройщике.
                </p>
              )}
              {Number(developer.reviews_count || 0) > 0 && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Средняя оценка по отзывам покупателей. Подробные отзывы
                  появятся здесь по мере модерации.
                </p>
              )}
            </section>

            <section className="rounded-xl border border-border/60 bg-card px-4 sm:px-5 py-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[11px] text-muted-foreground mb-1">
                  Объекты застройщика
                </div>
                <div className="text-sm font-medium text-foreground tabular-nums">
                  {propsLoading
                    ? "Загрузка…"
                    : `${objectsCount} ${pluralObjects(objectsCount)} в каталоге`}
                </div>
              </div>
              {!propsLoading && objectsCount > 0 && (
                <Link
                  to={catalogHref}
                  className="h-7 px-[11px] rounded bg-primary text-primary-foreground text-sm font-medium inline-flex items-center hover:opacity-90"
                >
                  Смотреть в каталоге
                </Link>
              )}
            </section>
          </div>

          <aside className="lg:w-[340px] shrink-0">
            <div className="sticky top-24">
              <SpecialistContactForm
                title="Свяжитесь с застройщиком"
                source="developer_contact"
                targetLabel={developer.name}
                intents={
                  isFrameBuilder ? FRAME_DEVELOPER_INTENTS : DEVELOPER_INTENTS
                }
              />
            </div>
          </aside>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
