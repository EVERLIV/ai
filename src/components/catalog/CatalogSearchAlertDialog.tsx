import { Bell, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { submitLead } from "@/lib/submitLead";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filterSummary: string;
  resultsCount: number;
}

export default function CatalogSearchAlertDialog({
  open,
  onOpenChange,
  filterSummary,
  resultsCount,
}: Props) {
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const phoneTrim = phone.trim();
    const emailTrim = email.trim();
    if (phoneTrim.length < 6 && !emailTrim.includes("@")) {
      toast({
        title: "Укажите телефон или email",
        description: "Нужен хотя бы один способ связи.",
      });
      return;
    }
    setLoading(true);
    try {
      await submitLead({
        name: "Подписка на поиск",
        phone: phoneTrim || "—",
        email: emailTrim || null,
        source: "catalog_search_alert",
        message: `Уведомить о новых объектах. Сейчас в выдаче: ${resultsCount}. Фильтры: ${filterSummary}`,
      });
      toast({
        title: "Заявка принята",
        description: "Сообщим, когда появятся подходящие объекты.",
      });
      setPhone("");
      setEmail("");
      onOpenChange(false);
    } catch {
      toast({ title: "Не удалось отправить", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            Уведомить о новых объектах
          </DialogTitle>
          <DialogDescription>
            Сохраним параметры текущего поиска и напишем, когда появятся новые
            объявления.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-2">
            <Label htmlFor="alert-phone">Телефон</Label>
            <Input
              id="alert-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+7 ..."
              autoComplete="tel"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="alert-email">Email</Label>
            <Input
              id="alert-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            Текущая выдача: {resultsCount} объектов. {filterSummary}
          </p>
          <Button type="submit" className="w-full gap-2" disabled={loading}>
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Подписаться на обновления
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function CatalogSearchAlertButton({
  onClick,
}: {
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="hidden xl:inline-flex items-center gap-1.5 h-7 px-[11px] rounded border border-border bg-card text-sm font-medium text-foreground hover:bg-muted/60 transition-colors shrink-0"
    >
      <Bell className="w-3.5 h-3.5 text-primary" />
      Уведомить о новых
    </button>
  );
}
