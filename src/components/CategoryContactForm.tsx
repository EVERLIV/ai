import { CheckCircle, Loader2, Mail, Send } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CONTACTS } from "@/config/company";
import { useToast } from "@/hooks/use-toast";
import { BotGuardError, useFormBotGuard } from "@/hooks/useFormBotGuard";
import { submitLead } from "@/lib/submitLead";

interface Props {
  category: string;
}

export default function CategoryContactForm({ category }: Props) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { BotGuard, ensureGuard, resetGuard } = useFormBotGuard();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const name = String(fd.get("name") || "").trim();
    const phone = String(fd.get("phone") || "").trim();
    const email = String(fd.get("email") || "").trim();
    const message = String(fd.get("message") || "").trim();

    if (name.length < 2 || phone.length < 6) {
      toast({ title: "Заполните имя и телефон" });
      return;
    }

    setLoading(true);
    try {
      const bot = await ensureGuard();
      await submitLead({
        name,
        phone,
        email: email || null,
        message: message || null,
        source: "category_contact",
        business_category: category,
        website: bot.website,
        captchaToken: bot.captchaToken,
      });
      resetGuard();
      setSent(true);
      toast({
        title: "Заявка отправлена!",
        description: "Мы свяжемся с вами в ближайшее время.",
      });
    } catch (err) {
      if (err instanceof BotGuardError && err.message === "bot") return;
      toast({
        title:
          err instanceof BotGuardError
            ? err.message
            : "Не удалось отправить",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-20 bg-card">
      <div className="container mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-12 items-center max-w-5xl mx-auto">
          <div className="space-y-6">
            <h2 className="text-3xl font-display font-bold text-foreground">
              Подберём {category} под ваши задачи
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Оставьте заявку — наш менеджер свяжется с вами в течение 15 минут
              в рабочее время. Мы подберём оптимальный вариант с учётом ваших
              требований к расположению, площади и бюджету.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <a
                    href={`mailto:${CONTACTS.email}`}
                    className="font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {CONTACTS.email}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-background rounded-2xl border border-border p-6 sm:p-8">
            {sent ? (
              <div className="text-center py-8 space-y-4">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <h3 className="text-xl font-semibold text-foreground">
                  Заявка принята!
                </h3>
                <p className="text-muted-foreground">
                  Менеджер свяжется с вами в ближайшее время.
                </p>
                <Button variant="outline" onClick={() => setSent(false)}>
                  Отправить ещё
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Оставить заявку
                </h3>
                <Input name="name" placeholder="Ваше имя" required />
                <Input
                  name="phone"
                  type="tel"
                  placeholder="+7 (___) ___-__-__"
                  required
                />
                <Input name="email" type="email" placeholder="Email" />
                <Textarea
                  name="message"
                  placeholder={`Требования к ${category.toLowerCase()}: площадь, район, бюджет...`}
                  rows={3}
                />
                <BotGuard />
                <Button
                  type="submit"
                  className="w-full gap-2"
                  size="lg"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Отправить заявку
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Нажимая кнопку, вы соглашаетесь с политикой обработки
                  персональных данных
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
