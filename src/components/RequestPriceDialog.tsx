import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Send, CheckCircle, MessageSquareText } from "lucide-react";

interface Props {
  propertyId?: string;
  propertyAddress?: string;
  trigger?: React.ReactNode;
  className?: string;
}

export default function RequestPriceDialog({ propertyId, propertyAddress, trigger, className }: Props) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSent(true);
    toast({
      title: "Заявка отправлена!",
      description: "Менеджер свяжется с вами в течение 15 минут и сообщит цену.",
    });
  };

  const defaultTrigger = (
    <button
      type="button"
      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
        {trigger ?? defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-md" onClick={(e) => e.stopPropagation()}>
        <DialogHeader>
          <DialogTitle>Запросить цену</DialogTitle>
          <DialogDescription>
            {propertyAddress
              ? `Объект: ${propertyAddress}`
              : "Оставьте контакты — менеджер пришлёт актуальную цену и условия."}
          </DialogDescription>
        </DialogHeader>

        {sent ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle className="w-12 h-12 text-primary mx-auto" />
            <h3 className="text-base font-semibold text-foreground">Заявка принята</h3>
            <p className="text-sm text-muted-foreground">Менеджер свяжется с вами в ближайшее время.</p>
            <Button variant="outline" onClick={() => { setSent(false); setOpen(false); }}>
              Закрыть
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input name="name" placeholder="Ваше имя" required />
            <Input name="phone" type="tel" placeholder="+7 (___) ___-__-__" required />
            <Input name="email" type="email" placeholder="Email (необязательно)" />
            <Textarea
              name="message"
              placeholder="Дополнительные пожелания (срок, условия)"
              rows={3}
            />
            {propertyId && <input type="hidden" name="propertyId" value={propertyId} />}
            <Button type="submit" className="w-full gap-2" size="lg">
              <Send className="w-4 h-4" />
              Отправить заявку
            </Button>
            <p className="text-[10px] text-muted-foreground text-center">
              Нажимая кнопку, вы соглашаетесь с политикой обработки персональных данных
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
