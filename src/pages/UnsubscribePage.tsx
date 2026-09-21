import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Loader2, MailX } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SeoHead from "@/components/SeoHead";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { Button } from "@/components/ui/button";
import { absoluteUrl } from "@/config/site";
import { unsubscribeNewsletter } from "@/lib/newsletterApi";

export default function UnsubscribePage() {
  const [params] = useSearchParams();
  const token = useMemo(() => (params.get("token") || "").trim(), [params]);
  const [done, setDone] = useState(false);

  const mut = useMutation({
    mutationFn: () => unsubscribeNewsletter(token),
    onSuccess: () => setDone(true),
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SeoHead
        title="Отписка от рассылки"
        description="Отписка от рекламных и информационных писем ДАДАТУТ."
        url={absoluteUrl("/unsubscribe")}
        noindex
      />
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 lg:px-8 py-12 mt-[56px] lg:mt-[104px] max-w-lg">
        <div className="rounded-xl border border-border bg-card p-6 sm:p-8 text-center space-y-4">
          {done ? (
            <>
              <CheckCircle2 className="w-10 h-10 text-primary mx-auto" />
              <h1 className="font-display text-xl font-bold">Вы отписаны</h1>
              <p className="text-sm text-muted-foreground">
                Рекламные письма на этот адрес больше не будут отправляться.
                Сервисные уведомления (подтверждение почты, статус объекта) могут
                приходить отдельно.
              </p>
            </>
          ) : (
            <>
              <MailX className="w-10 h-10 text-muted-foreground mx-auto" />
              <h1 className="font-display text-xl font-bold">
                Отписка от рассылки ДАДАТУТ
              </h1>
              {!token ? (
                <p className="text-sm text-muted-foreground">
                  В ссылке нет токена отписки. Откройте письмо и нажмите
                  «Отписаться» внизу.
                </p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    Нажмите кнопку, чтобы отписаться от рекламных и
                    информационных рассылок.
                  </p>
                  <Button
                    disabled={mut.isPending}
                    onClick={() => mut.mutate()}
                    className="min-w-[180px]"
                  >
                    {mut.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    Отписаться
                  </Button>
                  {mut.isError && (
                    <p className="text-sm text-destructive">
                      {(mut.error as Error).message}
                    </p>
                  )}
                </>
              )}
            </>
          )}
          <Link
            to="/"
            className="inline-block text-sm text-primary underline underline-offset-2"
          >
            На главную
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
