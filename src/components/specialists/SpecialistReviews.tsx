import { Loader2, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  useAgencyReviews,
  useCreateAgencyReview,
} from "@/hooks/useAgency";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { formatAvgRating, type AgencyReview } from "@/lib/agencyApi";
import { cn } from "@/lib/utils";

type Props = {
  agencyId: string;
  managerId?: string | null;
  avgRating?: number | null;
  reviewsCount?: number | null;
  responseMinutes?: number | null;
  title?: string;
  className?: string;
};

function Stars({
  value,
  onChange,
  size = "sm",
}: {
  value: number;
  onChange?: (n: number) => void;
  size?: "sm" | "md";
}) {
  const icon = size === "md" ? "w-5 h-5" : "w-3.5 h-3.5";
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(n)}
          className={cn(
            !onChange && "pointer-events-none",
            onChange && "cursor-pointer",
          )}
          aria-label={`${n} из 5`}
        >
          <Star
            className={cn(
              icon,
              n <= value
                ? "fill-emerald-500 text-emerald-500"
                : "text-muted-foreground/40",
            )}
          />
        </button>
      ))}
    </span>
  );
}

function ReviewItem({ review }: { review: AgencyReview }) {
  const date = new Date(review.created_at).toLocaleDateString("ru-RU");
  const reply = review.reply_body?.trim();
  return (
    <article className="py-3 border-b border-border/50 last:border-0">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm font-medium text-foreground truncate">
            {review.author_name}
          </span>
          <Stars value={review.rating} />
        </div>
        <time className="text-[10px] text-muted-foreground shrink-0 tabular-nums">
          {date}
        </time>
      </div>
      <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
        {review.body}
      </p>
      {reply ? (
        <div className="mt-2.5 ml-0 sm:ml-3 pl-3 border-l-2 border-primary/30">
          <p className="text-[11px] font-semibold text-foreground mb-0.5">
            Ответ агентства
            {review.reply_at
              ? ` · ${new Date(review.reply_at).toLocaleDateString("ru-RU")}`
              : ""}
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
            {reply}
          </p>
        </div>
      ) : null}
    </article>
  );
}

export default function SpecialistReviews({
  agencyId,
  managerId,
  avgRating,
  reviewsCount,
  responseMinutes,
  title = "Отзывы",
  className,
}: Props) {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: reviews = [], isLoading } = useAgencyReviews({
    agencyId,
    managerId,
  });
  const createReview = useCreateAgencyReview();

  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (profile?.full_name?.trim()) {
      setName(profile.full_name.trim());
    }
  }, [profile?.full_name]);

  const displayCount = reviewsCount ?? reviews.length;
  const displayAvg =
    avgRating && avgRating > 0
      ? avgRating
      : reviews.length
        ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
        : 0;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      setError("Войдите, чтобы оставить отзыв");
      return;
    }
    setError("");
    try {
      await createReview.mutateAsync({
        agency_id: agencyId,
        manager_id: managerId || null,
        author_name: name,
        author_email: profile?.email || user.email || null,
        rating,
        body,
        user_id: user.id,
      });
      setSent(true);
      setBody("");
      setRating(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Не удалось отправить");
    }
  };

  return (
    <section className={cn("space-y-4", className)}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-sm text-muted-foreground">
            {displayAvg > 0 ? (
              <span className="inline-flex items-center gap-1.5 text-foreground font-medium">
                <Stars value={Math.round(displayAvg)} />
                {formatAvgRating(displayAvg)}
                <span className="font-normal text-muted-foreground">
                  · {displayCount}{" "}
                  {displayCount === 1
                    ? "отзыв"
                    : displayCount >= 2 && displayCount <= 4
                      ? "отзыва"
                      : "отзывов"}
                </span>
              </span>
            ) : (
              <span>Пока нет отзывов</span>
            )}
            {responseMinutes != null && responseMinutes > 0 && (
              <span>Ответ ~{responseMinutes} мин</span>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/60 bg-card px-4 sm:px-5">
        {isLoading ? (
          <div className="flex items-center text-muted-foreground text-sm py-6">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Загрузка отзывов…
          </div>
        ) : reviews.length === 0 ? (
          <p className="text-sm text-muted-foreground py-5">
            Пока нет опубликованных отзывов
          </p>
        ) : (
          <div>
            {reviews.map((r) => (
              <ReviewItem key={r.id} review={r} />
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border/60 bg-card p-4 sm:p-5 space-y-3">
        <p className="text-sm font-semibold text-foreground">Оставить отзыв</p>
        {!user ? (
          <p className="text-sm text-muted-foreground">
            Отзывы могут оставлять только зарегистрированные пользователи.{" "}
            <Link
              to="/auth"
              className="text-primary font-medium hover:underline"
            >
              Войти или зарегистрироваться
            </Link>
          </p>
        ) : sent ? (
          <p className="text-sm text-emerald-700">
            Спасибо! Отзыв отправлен на модерацию и появится после проверки.
            <button
              type="button"
              className="ml-2 text-primary hover:underline"
              onClick={() => setSent(false)}
            >
              Ещё один
            </button>
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs text-muted-foreground">Оценка</span>
              <Stars value={rating} onChange={setRating} size="md" />
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ваше имя"
              required
              minLength={2}
              className="w-full h-7 px-3 rounded border border-border bg-background text-sm"
            />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Как прошла работа со специалистом?"
              required
              minLength={5}
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-y min-h-[80px]"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <button
              type="submit"
              disabled={createReview.isPending}
              className="h-7 px-[11px] rounded bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-60 inline-flex items-center gap-2"
            >
              {createReview.isPending && (
                <Loader2 className="w-4 h-4 animate-spin" />
              )}
              Отправить на модерацию
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

/** Компактный бейдж рейтинга для list-карточек */
export function RatingBadge({
  avgRating,
  reviewsCount,
  className,
}: {
  avgRating?: number | null;
  reviewsCount?: number | null;
  className?: string;
}) {
  const n = Number(avgRating || 0);
  if (!n || !reviewsCount) return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] text-emerald-700 tabular-nums",
        className,
      )}
    >
      <Star className="w-3 h-3 fill-emerald-500 text-emerald-500" />
      {formatAvgRating(n)}
      <span className="text-muted-foreground">({reviewsCount})</span>
    </span>
  );
}
