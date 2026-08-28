import {
  Calendar,
  CheckCircle,
  Mail,
  MessageSquareText,
  Phone,
  Send,
  Tag,
  User,
} from "lucide-react";
import { useState } from "react";
import { BotGuardError, useFormBotGuard } from "@/hooks/useFormBotGuard";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { isSaleDeal } from "@/lib/propertyDeal";
import { submitLead } from "@/lib/submitLead";

interface Props {
  propertyId?: string;
  propertyAddress?: string;
  basePrice?: number;
  /** Тип сделки объекта — для продажи форма не спрашивает срок контракта. */
  dealType?: string | null;
  trigger?: React.ReactNode;
  className?: string;
}

type Term = "12" | "36";

export default function RequestPriceDialog({
  propertyId,
  propertyAddress,
  basePrice,
  dealType,
  trigger,
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agree, setAgree] = useState(true);
  const [term, setTerm] = useState<Term>("12");
  const [price, setPrice] = useState<string>("");
  const { toast } = useToast();
  const { BotGuard, ensureGuard, resetGuard } = useFormBotGuard();

  const isSale = isSaleDeal(dealType);

  const formatPrice = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 10);
    return digits ? Number(digits).toLocaleString("ru-RU") : "";
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!agree) {
      toast({
        title: "Подтвердите согласие",
        description: "Необходимо согласие на обработку персональных данных.",
      });
      return;
    }
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "").trim();
    const phone = String(fd.get("phone") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const message = String(fd.get("message") || "").trim();
    const offerPrice = Number(price.replace(/\D/g, "")) || 0;

    if (name.length < 2 || phone.length < 6) {
      toast({ title: "Заполните имя и телефон" });
      return;
    }

    setLoading(true);
    try {
      const bot = await ensureGuard();
      await submitLead({
        object_id: propertyId ?? null,
        name,
        phone,
        email: email || null,
        message: isSale
          ? `Предложение цены (продажа): ${offerPrice.toLocaleString("ru-RU")} ₽.${message ? `\nКомментарий: ${message}` : ""}`
          : `Предложение цены: ${offerPrice.toLocaleString("ru-RU")} ₽/мес при контракте на ${term === "12" ? "1 год" : "3 года"}.${message ? `\nКомментарий: ${message}` : ""}`,
        source: "price_offer",
        business_category: propertyAddress ?? null,
        website: bot.website,
        captchaToken: bot.captchaToken,
      });
      resetGuard();
      setSent(true);
      toast({
        title: "Заявка отправлена",
        description: "Менеджер свяжется в течение 15 минут.",
      });
    } catch (err) {
      if (err instanceof BotGuardError && err.message === "bot") return;
      toast({
        title:
          err instanceof BotGuardError
            ? err.message
            : "Не удалось отправить",
        description:
          err instanceof BotGuardError
            ? undefined
            : "Попробуйте ещё раз или позвоните нам.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const defaultTrigger = (
    <button
      type="button"
      className={
        className ??
        "inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
      }
    >
      <MessageSquareText className="w-3.5 h-3.5" />
      Запросить цену
    </button>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) setSent(false);
      }}
    >
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent
        className="max-w-md p-0 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <DialogHeader
          className={
            sent
              ? "sr-only px-6 pt-6"
              : "px-6 pt-6 pb-4 bg-gradient-to-br from-primary/5 to-transparent border-b border-border space-y-1.5"
          }
        >
          <DialogTitle
            className={sent ? undefined : "flex items-center gap-2 text-base"}
          >
            {!sent && <Tag className="w-4 h-4 text-primary" />}
            {sent ? "Заявка принята" : "Предложить свою цену"}
          </DialogTitle>
          <DialogDescription
            className={sent ? undefined : "text-xs leading-relaxed"}
          >
            {sent ? (
              "Менеджер свяжется с вами в течение 15 минут и обсудит вашу цену."
            ) : propertyAddress ? (
              <>
                Объект:{" "}
                <span className="text-foreground font-medium">
                  {propertyAddress}
                </span>
              </>
            ) : (
              "Оставьте контакты — обсудим вашу цену индивидуально."
            )}
          </DialogDescription>
        </DialogHeader>
        {sent ? (
          <div className="text-center px-6 py-10 space-y-3">
            <CheckCircle className="w-14 h-14 text-primary mx-auto" />
            <p className="font-display text-lg font-semibold text-foreground">
              Заявка принята
            </p>
            <p className="text-sm text-muted-foreground">
              Менеджер свяжется с вами в течение 15 минут и обсудит вашу цену.
            </p>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Закрыть
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            {/* Цена + срок */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-foreground">
                {isSale ? "Ваша цена за объект" : "Ваша цена за месяц"}
              </Label>
              <div className="relative">
                <Input
                  inputMode="numeric"
                  value={price}
                  onChange={(e) => setPrice(formatPrice(e.target.value))}
                  placeholder={
                    basePrice
                      ? Number(basePrice).toLocaleString("ru-RU")
                      : "Например, 120 000"
                  }
                  className={`h-11 text-base font-semibold ${isSale ? "pr-9" : "pr-14"}`}
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  {isSale ? "₽" : "₽/мес"}
                </span>
              </div>

              {!isSale && (
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {(
                    [
                      { v: "12", label: "1 год" },
                      { v: "36", label: "3 года" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => setTerm(opt.v)}
                      className={`flex items-center justify-center gap-1.5 h-9 rounded-lg border text-xs font-medium transition-all ${
                        term === opt.v
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      Контракт на {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Контакты */}
            <div className="space-y-2.5">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  name="name"
                  placeholder="Ваше имя"
                  required
                  className="h-11 pl-9"
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  name="phone"
                  type="tel"
                  placeholder="+7 (___) ___-__-__"
                  required
                  className="h-11 pl-9"
                />
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  name="email"
                  type="email"
                  placeholder="Email (необязательно)"
                  className="h-11 pl-9"
                />
              </div>
            </div>

            <Textarea
              name="message"
              placeholder={
                isSale
                  ? "Комментарий: форма оплаты, сроки сделки, вопросы по объекту…"
                  : "Комментарий: условия, сроки въезда, особые пожелания…"
              }
              rows={3}
              className="resize-none text-sm"
            />

            {/* PD consent + submit */}
            <div className="space-y-3 pt-1">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary cursor-pointer"
                />
                <span className="text-[11px] leading-relaxed text-muted-foreground">
                  Я согласен на обработку персональных данных в соответствии с{" "}
                  <a
                    href="/privacy"
                    target="_blank"
                    className="text-primary hover:underline"
                    rel="noopener"
                  >
                    политикой конфиденциальности
                  </a>
                  .
                </span>
              </label>

              <BotGuard />

              <Button
                type="submit"
                className="w-full gap-2 h-11"
                disabled={loading || !agree}
              >
                <Send className="w-4 h-4" />
                {loading ? "Отправка…" : "Отправить заявку"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
