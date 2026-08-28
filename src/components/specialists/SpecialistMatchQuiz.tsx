import { Loader2, X } from "lucide-react";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { submitLead } from "@/lib/submitLead";
import { BotGuardError, useFormBotGuard } from "@/hooks/useFormBotGuard";
import { cn } from "@/lib/utils";
import {
  dismissQuizPermanently,
  SPECIALIST_INTENTS,
  type SpecialistIntent,
} from "./specialistUtils";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function SpecialistMatchQuiz({ open, onOpenChange }: Props) {
  const [step, setStep] = useState<"intent" | "contact" | "done">("intent");
  const [intent, setIntent] = useState<SpecialistIntent | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { BotGuard, ensureGuard, resetGuard } = useFormBotGuard();

  const reset = () => {
    setStep("intent");
    setIntent(null);
    setName("");
    setPhone("");
    setLoading(false);
    setError("");
  };

  const handleClose = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const pickIntent = (value: SpecialistIntent) => {
    setIntent(value);
    setStep("contact");
    setError("");
  };

  const neverShow = () => {
    dismissQuizPermanently();
    handleClose(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!intent) return;
    setLoading(true);
    setError("");
    try {
      const bot = await ensureGuard();
      await submitLead({
        name,
        phone,
        source: "specialist_quiz",
        business_category: intent,
        website: bot.website,
        captchaToken: bot.captchaToken,
      });
      resetGuard();
      dismissQuizPermanently();
      setStep("done");
    } catch (err) {
      if (err instanceof BotGuardError && err.message === "bot") return;
      setError(
        err instanceof BotGuardError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Не удалось отправить",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className={cn(
          "max-w-[420px] p-0 gap-0 overflow-hidden rounded-2xl border-border/70 sm:rounded-2xl",
          "[&>button]:hidden",
        )}
      >
        <button
          type="button"
          onClick={() => handleClose(false)}
          className="absolute right-3 top-3 z-10 w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Закрыть"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="px-6 pt-6 pb-2 flex flex-col items-center text-center">
          <DialogTitle className="text-xl font-bold text-foreground leading-snug">
            {step === "done"
              ? "Заявка отправлена"
              : step === "contact"
                ? "Как с вами связаться?"
                : "С чем нужна помощь риелтора?"}
          </DialogTitle>
          <DialogDescription className="mt-1.5 text-sm text-muted-foreground">
            {step === "done"
              ? "Подберём специалиста и перезвоним в рабочее время"
              : step === "contact"
                ? intent
                : "Подберём лучшего специалиста под ваш запрос"}
          </DialogDescription>
        </div>

        <div className="px-6 pb-6 pt-3">
          {step === "intent" && (
            <div className="flex flex-col gap-2">
              {SPECIALIST_INTENTS.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => pickIntent(item)}
                  className="w-full h-11 rounded-xl bg-sky-50 text-sky-800 text-sm font-medium hover:bg-sky-100 transition-colors"
                >
                  {item}
                </button>
              ))}
              <button
                type="button"
                onClick={neverShow}
                className="mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Больше не показывать
              </button>
            </div>
          )}

          {step === "contact" && (
            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Имя *
                </label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Как к вам обращаться"
                  className="w-full h-7 px-3 rounded border border-border bg-background text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">
                  Телефон *
                </label>
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+7 (___) ___-__-__"
                  className="w-full h-7 px-3 rounded border border-border bg-background text-sm focus:outline-none focus:border-primary"
                />
              </div>
              {error && (
                <p className="text-xs text-destructive">{error}</p>
              )}
              <BotGuard />
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 disabled:opacity-60 transition-opacity inline-flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Отправить заявку"
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("intent");
                  setError("");
                }}
                className="w-full text-xs text-muted-foreground hover:text-foreground"
              >
                ← Назад к выбору
              </button>
            </form>
          )}

          {step === "done" && (
            <button
              type="button"
              onClick={() => handleClose(false)}
              className="w-full h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90"
            >
              Закрыть
            </button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
