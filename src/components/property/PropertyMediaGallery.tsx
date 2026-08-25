import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PropertySaveButton from "@/components/PropertySaveButton";
import PropertySidebarExtras from "@/components/PropertySidebarExtras";
import VerifiedBadge from "@/components/VerifiedBadge";
import { useQuery } from "@tanstack/react-query";
import {
  buildPropertyDisplayTitle,
  formatPropertyPrice,
} from "@/lib/propertyCard";
import { fetchUnitTypeByIdApi } from "@/lib/developerApi";
import {
  planTabLabel,
  readPropertyMediaExtras,
  resolvePlanImageUrl,
  type GalleryTab,
} from "@/lib/propertyMedia";
import { getListingAgentDisplay } from "@/lib/propertySidebar";
import { parseVkVideoUrl } from "@/lib/vkVideo";
import { cn } from "@/lib/utils";

type GalleryProperty = {
  id: string;
  type?: string | null;
  deal_type?: string | null;
  segment?: string | null;
  area?: number | null;
  price?: number | null;
  price_per_m2?: number | null;
  address?: string | null;
  district?: string | null;
  photos?: string[] | null;
  cover_photo?: string | null;
  developer_id?: string | null;
  developer_unit_type_id?: string | null;
  agency_id?: string | null;
  listing_manager_id?: string | null;
  submitted_by?: string | null;
  extras?: Record<string, unknown> | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property: GalleryProperty;
  /** Начальная вкладка */
  initialTab?: GalleryTab;
  /** Индекс фото при открытии на вкладке photos */
  initialPhotoIndex?: number;
};

export default function PropertyMediaGallery({
  open,
  onOpenChange,
  property,
  initialTab = "photos",
  initialPhotoIndex = 0,
}: Props) {
  const photos = property.photos?.filter(Boolean) || [];
  const mediaExtras = readPropertyMediaExtras(property.extras);
  const unitTypeId = property.developer_unit_type_id || undefined;

  const { data: unitType } = useQuery({
    queryKey: ["unit-type", unitTypeId],
    enabled: open && !!unitTypeId && !mediaExtras.planImageUrl,
    queryFn: () => fetchUnitTypeByIdApi(unitTypeId!),
    staleTime: 60_000,
  });

  const planUrl = resolvePlanImageUrl({
    extrasPlan: mediaExtras.planImageUrl,
    unitTypePlan: unitType?.plan_image_url,
  });

  const videos = useMemo(
    () =>
      mediaExtras.videoUrls
        .map((url) => {
          const parsed = parseVkVideoUrl(url);
          return parsed ? { url, embedUrl: parsed.embedUrl } : null;
        })
        .filter(Boolean) as { url: string; embedUrl: string }[],
    [mediaExtras.videoUrls],
  );

  const planLabel = planTabLabel(property);
  const tabs = useMemo(() => {
    const list: { id: GalleryTab; label: string }[] = [];
    if (planUrl) list.push({ id: "plan", label: planLabel });
    if (videos.length)
      list.push({
        id: "video",
        label: videos.length > 1 ? `Видео (${videos.length})` : "Видео",
      });
    list.push({
      id: "photos",
      label: photos.length ? `${photos.length} фото` : "Фото",
    });
    return list;
  }, [planUrl, videos.length, photos.length, planLabel]);

  const [tab, setTab] = useState<GalleryTab>(initialTab);
  const [photoIndex, setPhotoIndex] = useState(initialPhotoIndex);
  const [videoIndex, setVideoIndex] = useState(0);

  useEffect(() => {
    if (!open) return;
    const allowed = tabs.map((t) => t.id);
    const next = allowed.includes(initialTab) ? initialTab : allowed[0] || "photos";
    setTab(next);
    setPhotoIndex(
      Math.min(Math.max(0, initialPhotoIndex), Math.max(0, photos.length - 1)),
    );
    setVideoIndex(0);
  }, [open, initialTab, initialPhotoIndex, tabs, photos.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
      if (tab === "photos" && photos.length > 1) {
        if (e.key === "ArrowLeft")
          setPhotoIndex((i) => (i - 1 + photos.length) % photos.length);
        if (e.key === "ArrowRight")
          setPhotoIndex((i) => (i + 1) % photos.length);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange, tab, photos.length]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const agent = getListingAgentDisplay(property.extras);
  const title = buildPropertyDisplayTitle(property);
  const price = formatPropertyPrice(property);
  const developerHref = agent?.developerId
    ? `/zastroyshchik/${agent.developerId}`
    : null;

  const goPrev = useCallback(() => {
    if (tab === "photos" && photos.length)
      setPhotoIndex((i) => (i - 1 + photos.length) % photos.length);
    if (tab === "video" && videos.length)
      setVideoIndex((i) => (i - 1 + videos.length) % videos.length);
  }, [tab, photos.length, videos.length]);

  const goNext = useCallback(() => {
    if (tab === "photos" && photos.length)
      setPhotoIndex((i) => (i + 1) % photos.length);
    if (tab === "video" && videos.length)
      setVideoIndex((i) => (i + 1) % videos.length);
  }, [tab, photos.length, videos.length]);

  if (!open) return null;

  const showNav =
    (tab === "photos" && photos.length > 1) ||
    (tab === "video" && videos.length > 1);

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-background"
      role="dialog"
      aria-modal="true"
      aria-label="Галерея объекта"
    >
      <header className="shrink-0 flex items-center gap-3 px-3 sm:px-5 h-12 border-b border-border">
        <nav className="flex-1 min-w-0 flex items-center gap-1 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "shrink-0 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                tab === t.id
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <button
          type="button"
          aria-label="Закрыть"
          onClick={() => onOpenChange(false)}
          className="w-9 h-9 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>
      </header>

      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        <div className="flex-1 min-w-0 min-h-0 flex flex-col bg-muted/40">
          <div className="relative flex-1 min-h-[40vh] flex items-center justify-center p-2 sm:p-4">
            {tab === "plan" && planUrl && (
              <img
                src={planUrl}
                alt={planLabel}
                className="max-h-full max-w-full object-contain"
              />
            )}
            {tab === "video" && videos[videoIndex] && (
              <div className="w-full max-w-4xl aspect-video bg-black rounded-md overflow-hidden">
                <iframe
                  title="VK Video"
                  src={videos[videoIndex].embedUrl}
                  className="w-full h-full border-0"
                  allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              </div>
            )}
            {tab === "photos" && (
              <img
                src={
                  photos[photoIndex] ||
                  property.cover_photo ||
                  "/placeholder.svg"
                }
                alt={property.address || title}
                className="max-h-full max-w-full object-contain"
              />
            )}

            {showNav && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/90 shadow flex items-center justify-center"
                  aria-label="Назад"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-background/90 shadow flex items-center justify-center"
                  aria-label="Вперёд"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {/* Thumbs */}
          <div className="shrink-0 border-t border-border px-3 py-2 overflow-x-auto">
            <div className="flex gap-1.5 min-w-min">
              {tab === "plan" && planUrl && (
                <Thumb active src={planUrl} onClick={() => undefined} />
              )}
              {tab === "video" &&
                videos.map((v, i) => (
                  <button
                    key={v.url}
                    type="button"
                    onClick={() => setVideoIndex(i)}
                    className={cn(
                      "relative w-16 h-12 rounded-md overflow-hidden bg-muted shrink-0 border-2",
                      videoIndex === i
                        ? "border-primary"
                        : "border-transparent",
                    )}
                  >
                    <span className="absolute inset-0 flex items-center justify-center bg-foreground/40">
                      <Play className="w-5 h-5 text-white fill-white" />
                    </span>
                  </button>
                ))}
              {tab === "photos" &&
                photos.map((url, i) => (
                  <Thumb
                    key={url}
                    src={url}
                    active={photoIndex === i}
                    onClick={() => setPhotoIndex(i)}
                  />
                ))}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="shrink-0 w-full lg:w-[340px] xl:w-[380px] border-t lg:border-t-0 lg:border-l border-border overflow-y-auto max-h-[42vh] lg:max-h-none bg-card">
          <div className="p-4 space-y-4">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-foreground leading-snug">
                  {title}
                </h2>
                {developerHref && agent?.primaryLabel && (
                  <Link
                    to={developerHref}
                    className="text-xs text-primary hover:underline mt-1 inline-block"
                    onClick={() => onOpenChange(false)}
                  >
                    {agent.primaryLabel}
                  </Link>
                )}
              </div>
              <PropertySaveButton
                propertyId={property.id}
                className="w-9 h-9 shrink-0"
              />
            </div>

            <div>
              <div className="price-display text-xl text-foreground">
                {price ?? "По запросу"}
              </div>
              {Number(property.price_per_m2) > 0 && (
                <p className="text-[11px] text-muted-foreground mt-0.5 tabular-nums">
                  {Number(property.price_per_m2).toLocaleString("ru-RU")} ₽/м²
                </p>
              )}
            </div>

            {agent && (
              <div className="rounded-lg border border-border/70 p-3 flex items-center gap-3">
                {agent.avatarUrl ? (
                  <img
                    src={agent.avatarUrl}
                    alt=""
                    className="w-11 h-11 rounded-md object-cover bg-muted"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-md bg-muted" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-semibold truncate">
                      {agent.primaryLabel}
                    </span>
                    {agent.isVerified && (
                      <VerifiedBadge size="sm" showLabel={false} />
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {agent.secondaryLabel}
                  </p>
                </div>
              </div>
            )}

            <div className="[&_.space-y-5]:space-y-3">
              <PropertySidebarExtras property={property} hideAgent />
            </div>

            <Link
              to="/contacts"
              onClick={() => onOpenChange(false)}
              className="block rounded-md border border-dashed border-border bg-muted/40 hover:bg-muted/70 transition-colors min-h-[120px] px-4 py-10 flex items-center justify-center text-center"
            >
              <span className="text-sm text-muted-foreground">
                ваша реклама здесь — разместить
              </span>
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Thumb({
  src,
  active,
  onClick,
}: {
  src: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-16 h-12 rounded-md overflow-hidden bg-muted shrink-0 border-2",
        active ? "border-primary" : "border-transparent",
      )}
    >
      <img src={src} alt="" className="w-full h-full object-cover" />
    </button>
  );
}
