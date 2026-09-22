import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, Loader2, MailCheck, XCircle } from "lucide-react";
import { useEffect, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SeoHead from "@/components/SeoHead";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { absoluteUrl } from "@/config/site";
import { confirmNewsletterSubscription } from "@/lib/newsletterApi";

export default function NewsletterConfirmPage() {
  const [params] = useSearchParams();
  const token = useMemo(() => (params.get("token") || "").trim(), [params]);

  const mut = useMutation({
    mutationFn: () => confirmNewsletterSubscription(token),
  });

  // Подтверждаем сразу при переходе по ссылке из письма
  const { mutate } = mut;
  useEffect(() => {
    if (token) mutate();
  }, [token, mutate]);

  const confirmed = mut.isSuccess && mut.data?.confirmed;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SeoHead
        title="Подтверждение подписки"
        description="Подтверждение подписки на рассылку новых предложений ДАДАТУТ."
        url={absoluteUrl("/newsletter/confirm")}
        noindex
      />
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 lg:px-8 py-12 mt-[56px] lg:mt-[104px] max-w-lg">
        <div className="rounded-xl border border-border bg-card p-6 sm:p-8 text-center space-y-4">
          {!token ? (
            <>
              <XCircle className="w-10 h-10 text-muted-foreground mx-auto" />
              <h1 className="font-display text-xl font-bold">
                Нет токена подтверждения
              </h1>
              <p className="text-sm text-muted-foreground">
                Откройте письмо и нажмите кнопку «Подтвердить подписку».
              </p>
            </>
          ) : mut.isPending ? (
            <>
              <Loader2 className="w-10 h-10 text-muted-foreground mx-auto animate-spin" />
              <h1 className="font-display text-xl font-bold">
                Подтверждаем подписку…
              </h1>
            </>
          ) : confirmed ? (
            <>
              <CheckCircle2 className="w-10 h-10 text-primary mx-auto" />
              <h1 className="font-display text-xl font-bold">
                Подписка подтверждена
              </h1>
              <p className="text-sm text-muted-foreground">
                Будем присылать новые предложения недвижимости. Отписаться можно
                в один клик из любого письма.
              </p>
            </>
          ) : (
            <>
              <MailCheck className="w-10 h-10 text-muted-foreground mx-auto" />
              <h1 className="font-display text-xl font-bold">
                Ссылка недействительна
              </h1>
              <p className="text-sm text-muted-foreground">
                Возможно, подписка уже подтверждена или ссылка устарела.
                Оформите подписку заново на любой странице каталога.
              </p>
              {mut.isError && (
                <p className="text-sm text-destructive">
                  {(mut.error as Error).message}
                </p>
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
