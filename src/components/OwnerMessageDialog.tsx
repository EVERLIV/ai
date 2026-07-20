import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Send, CheckCircle, MessageSquareText, User, Phone, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  propertyId: string;
  propertyAddress: string;
  ownerName?: string;
  ownerUserId?: string;
  trigger?: React.ReactNode;
}

export default function OwnerMessageDialog({
  propertyId,
  propertyAddress,
  ownerName,
  ownerUserId,
  trigger,
}: Props) {
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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
      await supabase.from("crm_leads").insert({
        object_id: propertyId,
        name,
        phone,
        email: email || null,
        message: `Сообщение риелтору${ownerName ? ` (${ownerName})` : ""}${ownerUserId ? ` [user:${ownerUserId}]` : ""}:\n${message}`,
        source: "owner_message",
        business_category: propertyAddress,
      });
      setSent(true);
      toast({ title: "Сообщение отправлено", description: "Риелтор получит ваше обращение." });
    } catch {
      toast({ title: "Не удалось отправить", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const defaultTrigger = (
    <button
      type="button"
      className="flex items-center justify-center gap-1.5 h-9 rounded-lg bg-primary text-primary-foreground hover:opacity-90 transition-opacity text-sm font-semibold w-full"
    >
      <MessageSquareText className="w-4 h-4" />
      Написать сообщение
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setSent(false); }}>
      <div onClick={() => setOpen(true)}>{trigger ?? defaultTrigger}</div>
      <DialogContent className="max-w-md">
        {sent ? (
          <div className="text-center py-6 space-y-3">
            <CheckCircle className="w-12 h-12 text-primary mx-auto" />
            <h3 className="font-semibold">Сообщение отправлено</h3>
            <p className="text-sm text-muted-foreground">Риелтор свяжется с вами в ближайшее время.</p>
            <Button variant="outline" onClick={() => setOpen(false)}>Закрыть</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MessageSquareText className="w-4 h-4 text-primary" />
                Написать сообщение
              </DialogTitle>
              <DialogDescription>
                {ownerName ? `Риелтор: ${ownerName}` : "Отправьте сообщение риелтору объекта"}
                {propertyAddress && <> · {propertyAddress}</>}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3 pt-2">
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input name="name" placeholder="Ваше имя" required className="pl-9" />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input name="phone" type="tel" placeholder="+7 (___) ___-__-__" required className="pl-9" />
              </div>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input name="email" type="email" placeholder="Email (необязательно)" className="pl-9" />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Сообщение</Label>
                <Textarea name="message" rows={4} placeholder="Здравствуйте, интересует объект…" required />
              </div>
              <Button type="submit" className="w-full gap-2" disabled={loading}>
                <Send className="w-4 h-4" />
                {loading ? "Отправка…" : "Отправить"}
              </Button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
