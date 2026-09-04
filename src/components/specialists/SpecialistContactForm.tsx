import { Loader2 } from "lucide-react";
import { useState } from "react";
import { BotGuardError, useFormBotGuard } from "@/hooks/useFormBotGuard";
import { submitLead } from "@/lib/submitLead";
import { cn } from "@/lib/utils";
import { SPECIALIST_INTENTS } from "./specialistUtils";

type Props = {
  title?: string;
  source: "realtor_contact" | "agency_contact" | "developer_contact";
  /** Для CRM: имя специалиста / агентства / застройщика */
  targetLabel: string;
  /** Уведомление и привязка в CRM */
  agencyId?: string | null;
  /** Риелтор — для заявок со страницы /rieltor/... */
  managerId?: string | null;
  className?: string;
  intents?: readonly string[];
};

export default function SpecialistContactForm({
  title = "Свяжитесь со специалистом",
  source,
  targetLabel,
  agencyId,
  managerId,
  className,
  intents,
}: Props) {
  const intentOptions = intents ?? SPECIALIST_INTENTS;
  const [intent, setIntent] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const { BotGuard, ensureGuard, resetGuard } = useFormBotGuard();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const bot = await ensureGuard();
      const parts = [
        targetLabel,
        intent || null,
        comment.trim() || null,
      ].filter(Boolean);
      await submitLead({
        name,
        phone,
        message: comment.trim() || null,
        source,
        business_category: parts.join(" · "),
        agency_id: agencyId || null,
        manager_id: managerId || null,
        website: bot.website,
        captchaToken: bot.captchaToken,
      });
      resetGuard();
      setSent(true);
    } catch (err) {
      if (err instanceof BotGuardError && err.message === "bot") {
        setError("Не удалось отправить. Обновите страницу и попробуйте снова.");
        return;
      }
      const message =
        err instanceof BotGuardError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Не удалось отправить";
      if (/captcha|робот|reCAPTCHA|recaptcha/i.test(message)) {
        resetGuard();
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div
        className={cn(
          "rounded-xl border border-border/70 bg-card p-5 text-center",
          className,
        )}
      >
        <p className="text-sm font-semibold text-foreground">
          Заявка отправлена
        </p>
        <p className="text-xs text-muted-foreground mt-1.5">
          Специалист свяжется с вами в рабочее время
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setName("");
            setPhone("");
            setComment("");
            setIntent(null);
          }}
          className="mt-4 text-xs text-primary hover:underline"
        >
          Отправить ещё
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className={cn(
        "rounded-xl border border-border/70 bg-card p-5 space-y-4",
        className,
      )}
    >
      <h2 className="text-base font-semibold text-foreground">{title}</h2>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Что нужно сделать?
        </p>
        <div className="flex flex-wrap gap-1.5">
          {intentOptions.map((item) => {
            const active = intent === item;
            return (
              <button
                key={item}
                type="button"
                onClick={() => setIntent(item)}
                className={cn(
                  "h-8 px-2.5 rounded-lg text-xs font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-foreground hover:bg-muted",
                )}
              >
                {item}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2.5">
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ваше имя"
          className="w-full h-7 px-3 rounded border border-border bg-background text-sm focus:outline-none focus:border-primary"
        />
        <input
          required
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Контактный телефон"
          className="w-full h-7 px-3 rounded border border-border bg-background text-sm focus:outline-none focus:border-primary"
        />
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Комментарий (необязательно)"
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm resize-none focus:outline-none focus:border-primary"
        />
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <BotGuard />

      <button
        type="submit"
        disabled={loading}
        className="w-full h-7 rounded bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-60 inline-flex items-center justify-center gap-1.5"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          "Отправить заявку"
        )}
      </button>
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        Нажимая кнопку, вы соглашаетесь на обработку персональных данных
      </p>
    </form>
  );
}
