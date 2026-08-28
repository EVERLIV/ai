import { Loader2, Send } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { BotGuardError, useFormBotGuard } from "@/hooks/useFormBotGuard";
import { submitLead } from "@/lib/submitLead";

interface Props {
  filterSummary: string;
  resultsCount: number;
}

export default function CatalogLeadWidget({
  filterSummary,
  resultsCount,
}: Props) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { BotGuard, ensureGuard, resetGuard } = useFormBotGuard();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length < 2 || phone.trim().length < 6) {
      toast({ title: "Укажите имя и телефон" });
      return;
    }
    setLoading(true);
    try {
      const bot = await ensureGuard();
      await submitLead({
        name: name.trim(),
        phone: phone.trim(),
        source: "catalog_sidebar",
        message: `Подбор из каталога (${resultsCount} объектов). Фильтры: ${filterSummary}`,
        website: bot.website,
        captchaToken: bot.captchaToken,
      });
      resetGuard();
      toast({
        title: "Заявка отправлена",
        description: "Менеджер свяжется в течение 15 минут.",
      });
      setName("");
      setPhone("");
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
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="font-display text-sm font-bold text-foreground leading-snug">
        Не нашли подходящий вариант?
      </h3>
      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
        Оставьте заявку — подберём за 15 минут по вашим критериям.
      </p>
      <form onSubmit={handleSubmit} className="mt-3 space-y-2">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Имя"
          className="h-9 text-sm"
          autoComplete="name"
        />
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Телефон"
          type="tel"
          className="h-9 text-sm"
          autoComplete="tel"
        />
        <BotGuard />
        <Button type="submit" className="w-full h-9 gap-2" disabled={loading}>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Отправить заявку
        </Button>
      </form>
    </div>
  );
}
