import { Loader2, MessageSquareText, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  useMyAgency,
  useMyAgencyReviews,
  useReplyToAgencyReview,
} from "@/hooks/useAgency";
import {
  type AgencyReview,
  type AgencyReviewStatus,
} from "@/lib/agencyApi";
import { cn } from "@/lib/utils";

const STATUS_LABEL: Record<
  AgencyReviewStatus,
  { label: string; className: string }
> = {
  published: {
    label: "Опубликован",
    className: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  pending: {
    label: "На модерации",
    className: "bg-amber-50 text-amber-800 border-amber-200",
  },
  rejected: {
    label: "Отклонён",
    className: "bg-red-50 text-red-800 border-red-200",
  },
};

function managerName(review: AgencyReview): string | null {
  const raw = review.agency_managers;
  if (!raw) return null;
  const row = Array.isArray(raw) ? raw[0] : raw;
  return row?.full_name?.trim() || null;
}

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            "w-3.5 h-3.5",
            n <= value
              ? "fill-emerald-500 text-emerald-500"
              : "text-muted-foreground/40",
          )}
        />
      ))}
    </span>
  );
}

function ReviewCard({ review }: { review: AgencyReview }) {
  const { toast } = useToast();
  const replyMutation = useReplyToAgencyReview();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState(review.reply_body || "");
  const status = STATUS_LABEL[review.status] || STATUS_LABEL.pending;
  const about = managerName(review);
  const date = new Date(review.created_at).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const hasReply = !!(review.reply_body && review.reply_body.trim());

  const onSave = async () => {
    try {
      await replyMutation.mutateAsync({
        reviewId: review.id,
        reply: text,
      });
      setOpen(false);
      toast({ title: "Ответ сохранён" });
    } catch (err) {
      toast({
        title: "Не удалось сохранить ответ",
        description: err instanceof Error ? err.message : "",
        variant: "destructive",
      });
    }
  };

  return (
    <article className="bg-card border border-border rounded-lg p-4 sm:p-5 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold text-foreground">
              {review.author_name}
            </span>
            <Stars value={review.rating} />
            <span
              className={cn(
                "text-[10px] font-medium uppercase tracking-wide px-1.5 py-0.5 rounded-md border",
                status.className,
              )}
            >
              {status.label}
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            {date}
            {about ? ` · о специалисте ${about}` : " · об агентстве"}
          </p>
        </div>
      </div>

      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
        {review.body}
      </p>

      {review.status === "pending" && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
          Отзыв на модерации — на публичной странице пока не виден. Ответить
          можно уже сейчас; ответ появится вместе с отзывом после публикации.
        </p>
      )}

      {review.status === "rejected" && (
        <p className="text-xs text-red-800 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          Отзыв отклонён модератором и не показывается на сайте.
        </p>
      )}

      {hasReply && !open && (
        <div className="rounded-md bg-muted/60 border border-border px-3 py-2.5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            Ваш ответ
            {review.reply_at
              ? ` · ${new Date(review.reply_at).toLocaleDateString("ru-RU")}`
              : ""}
          </p>
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {review.reply_body}
          </p>
        </div>
      )}

      {open ? (
        <div className="space-y-2 pt-1">
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            maxLength={2000}
            placeholder="Напишите ответ клиенту…"
            className="text-sm resize-none"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={onSave}
              disabled={replyMutation.isPending || text.trim().length < 2}
            >
              {replyMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
              ) : null}
              {hasReply ? "Обновить ответ" : "Отправить ответ"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setOpen(false);
                setText(review.reply_body || "");
              }}
              disabled={replyMutation.isPending}
            >
              Отмена
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
            <MessageSquareText className="w-3.5 h-3.5 mr-1.5" />
            {hasReply ? "Изменить ответ" : "Ответить"}
          </Button>
        </div>
      )}
    </article>
  );
}

export default function MyReviewsTab() {
  const { data: myAgency, isLoading: agencyLoading } = useMyAgency();
  const agencyId = myAgency?.agency.id;
  const {
    data: reviews = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useMyAgencyReviews(agencyId);

  const counts = useMemo(() => {
    const pending = reviews.filter((r) => r.status === "pending").length;
    const published = reviews.filter((r) => r.status === "published").length;
    const rejected = reviews.filter((r) => r.status === "rejected").length;
    return { pending, published, rejected, total: reviews.length };
  }, [reviews]);

  if (agencyLoading || isLoading) {
    return (
      <div className="flex items-center text-muted-foreground text-sm py-10">
        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Загрузка отзывов…
      </div>
    );
  }

  if (!agencyId) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <MessageSquareText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm font-medium text-foreground mb-1">
          Нет привязанного агентства
        </p>
        <p className="text-xs text-muted-foreground">
          Отзывы доступны аккаунтам агентства и участникам команды.
        </p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-sm text-destructive space-y-2">
        <p>{error instanceof Error ? error.message : "Ошибка загрузки"}</p>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          Повторить
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">
            Мои отзывы
          </h2>
          <p className="text-xs text-muted-foreground mt-1">
            Отзывы об агентстве и специалистах. Можно ответить; новые отзывы
            сначала проходят модерацию.
          </p>
        </div>
        {counts.total > 0 && (
          <div className="flex flex-wrap gap-2 text-[11px]">
            <span className="px-2 py-1 rounded-md bg-muted text-muted-foreground">
              Всего {counts.total}
            </span>
            {counts.pending > 0 && (
              <span className="px-2 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                На модерации {counts.pending}
              </span>
            )}
            <span className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
              Опубликовано {counts.published}
            </span>
            {counts.rejected > 0 && (
              <span className="px-2 py-1 rounded-md bg-red-50 text-red-800 border border-red-200">
                Отклонено {counts.rejected}
              </span>
            )}
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <div className="bg-card border border-border rounded-lg p-10 text-center">
          <MessageSquareText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">
            Пока нет отзывов
          </p>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Когда клиенты оставят отзыв на странице агентства или риелтора, он
            появится здесь со статусом «На модерации».
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      )}
    </div>
  );
}
