import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  adminUpdateAgencyReviewStatus,
  fetchPendingAgencyReviewsApi,
  type PendingAgencyReview,
} from "@/lib/adminModeration";

function embedName(
  value:
    | { id: string; name?: string; full_name?: string }
    | { id: string; name?: string; full_name?: string }[]
    | null
    | undefined,
  field: "name" | "full_name",
): string {
  if (!value) return "—";
  const row = Array.isArray(value) ? value[0] : value;
  if (!row) return "—";
  return (field === "name" ? row.name : row.full_name) || "—";
}

export default function AgencyReviewsModeration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: queue = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ["agency-reviews-pending"],
    queryFn: fetchPendingAgencyReviewsApi,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["agency-reviews-pending"] });
    queryClient.invalidateQueries({ queryKey: ["agency-reviews"] });
    queryClient.invalidateQueries({ queryKey: ["agency-public"] });
    queryClient.invalidateQueries({ queryKey: ["manager-public"] });
    queryClient.invalidateQueries({ queryKey: ["specialists-agencies"] });
    queryClient.invalidateQueries({ queryKey: ["specialists-managers"] });
  };

  const decide = useMutation({
    mutationFn: async ({
      id,
      status,
    }: {
      id: string;
      status: "published" | "rejected";
    }) => adminUpdateAgencyReviewStatus(id, status),
    onSuccess: (_d, vars) => {
      invalidate();
      toast({
        title:
          vars.status === "published"
            ? "Отзыв опубликован"
            : "Отзыв отклонён",
      });
    },
    onError: (err) => {
      toast({
        title: "Ошибка",
        description: err instanceof Error ? err.message : "Не удалось обновить",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center text-muted-foreground text-sm py-8">
        <Loader2 className="w-4 h-4 animate-spin mr-2" /> Загрузка отзывов…
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

  if (queue.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6">
        Нет отзывов на модерации
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {queue.map((item: PendingAgencyReview) => (
        <article
          key={item.id}
          className="rounded-xl border border-border/60 bg-card p-4 space-y-3"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-foreground">
                  {item.author_name}
                </span>
                <span className="inline-flex items-center gap-0.5 text-xs text-emerald-700">
                  <Star className="w-3.5 h-3.5 fill-emerald-500 text-emerald-500" />
                  {item.rating}
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                {embedName(item.agencies, "name")}
                {item.manager_id
                  ? ` · ${embedName(item.agency_managers, "full_name")}`
                  : ""}
                {item.author_email ? ` · ${item.author_email}` : ""}
              </p>
            </div>
            <time className="text-[10px] text-muted-foreground tabular-nums">
              {new Date(item.created_at).toLocaleString("ru-RU")}
            </time>
          </div>
          <p className="text-sm text-foreground leading-relaxed">{item.body}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={decide.isPending}
              onClick={() =>
                decide.mutate({ id: item.id, status: "published" })
              }
            >
              <Check className="w-4 h-4 mr-1" />
              Опубликовать
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={decide.isPending}
              onClick={() => decide.mutate({ id: item.id, status: "rejected" })}
            >
              <X className="w-4 h-4 mr-1" />
              Отклонить
            </Button>
          </div>
        </article>
      ))}
    </div>
  );
}
