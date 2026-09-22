import { useMutation } from "@tanstack/react-query";
import { BellRing, CheckCircle2, Loader2 } from "lucide-react";
import { type FormEvent, useId, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { subscribeNewsletter } from "@/lib/newsletterApi";
import { cn } from "@/lib/utils";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Props = {
  /** Откуда пришла подписка — видно в админке */
  source?: string;
  title?: string;
  description?: string;
  className?: string;
  /** Компактный вид для узкого сайдбара */
  compact?: boolean;
};

export default function NewsletterSubscribeCard({
  source = "site",
  title = "Получать новые предложения",
  description = "Письмо с новыми объектами — не чаще раза в неделю.",
  className,
  compact = false,
}: Props) {
  const inputId = useId();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: () => subscribeNewsletter({ email: email.trim(), source }),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!EMAIL_RE.test(value)) {
      setError("Укажите корректный email");
      return;
    }
    setError(null);
    mut.mutate();
  };

  if (mut.isSuccess) {
    return (
      <div
        className={cn(
          "rounded-xl border border-border bg-card p-4 flex items-start gap-2.5",
          className,
        )}
      >
        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            Проверьте почту
          </p>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            Мы отправили письмо со ссылкой для подтверждения. Рассылка начнётся
            только после того, как вы перейдёте по ней.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card",
        compact ? "p-3.5" : "p-4 sm:p-5",
        className,
      )}
    >
      <div className="flex items-start gap-2.5">
        <BellRing
          className={cn(
            "text-primary shrink-0",
            compact ? "w-4 h-4 mt-0.5" : "w-5 h-5 mt-0.5",
          )}
        />
        <div className="min-w-0">
          <p
            className={cn(
              "font-semibold text-foreground leading-tight",
              compact ? "text-xs" : "text-sm",
            )}
          >
            {title}
          </p>
          <p
            className={cn(
              "text-muted-foreground mt-1 leading-relaxed",
              compact ? "text-[10px]" : "text-xs",
            )}
          >
            {description}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-3 space-y-2">
        <label htmlFor={inputId} className="sr-only">
          Email для подписки на новые предложения
        </label>
        <Input
          id={inputId}
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="pochta@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (error) setError(null);
          }}
          disabled={mut.isPending}
          aria-invalid={Boolean(error)}
          className={cn(compact && "h-8 text-xs")}
        />

        <Button
          type="submit"
          disabled={mut.isPending}
          className={cn("w-full", compact && "h-8 text-xs")}
        >
          {mut.isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              Отправляем…
            </>
          ) : (
            "Подписаться"
          )}
        </Button>

        {error && (
          <p role="alert" className="text-[11px] text-destructive">
            {error}
          </p>
        )}
        {mut.isError && (
          <p role="alert" className="text-[11px] text-destructive">
            Не удалось оформить подписку. Попробуйте позже.
          </p>
        )}

        <p className="text-[10px] text-muted-foreground leading-relaxed">
          Нажимая «Подписаться», вы соглашаетесь с{" "}
          <Link to="/privacy" className="underline hover:text-foreground">
            политикой обработки персональных данных
          </Link>
          . Отписаться можно в один клик из любого письма.
        </p>
      </form>
    </div>
  );
}
