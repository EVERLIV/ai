import { Flag, Send } from "lucide-react";
import { cloneElement, isValidElement, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export type ReportReason = "fraud" | "fake" | "not_owner" | "other";

const REASONS: { value: ReportReason; label: string }[] = [
  { value: "fraud", label: "Обман" },
  { value: "fake", label: "Нереальное объявление" },
  { value: "not_owner", label: "Не собственник (указан как собственник)" },
  { value: "other", label: "Другое" },
];

interface Props {
  propertyId: string;
  propertyAddress?: string;
  trigger?: React.ReactNode;
}

export default function ReportListingDialog({
  propertyId,
  propertyAddress,
  trigger,
}: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<ReportReason>("fraud");
  const [details, setDetails] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const openDialog = () => {
    if (!user) {
      toast({
        title: "Нужна авторизация",
        description:
          "Сообщить о проблеме могут только зарегистрированные пользователи.",
      });
      navigate(
        `/auth?redirect=${encodeURIComponent(window.location.pathname)}`,
      );
      return;
    }
    setOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (reason === "other" && details.trim().length < 5) {
      toast({
        title: "Опишите проблему",
        description: "Для причины «Другое» нужен текст.",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("property_reports" as never)
        .insert({
          property_id: propertyId,
          reporter_id: user.id,
          reason,
          details: details.trim() || null,
          contact_phone: contactPhone.trim() || null,
        } as never);

      if (error) throw error;

      toast({
        title: "Жалоба отправлена",
        description: "Мы проверим объявление.",
      });
      setOpen(false);
      setReason("fraud");
      setDetails("");
      setContactPhone("");
    } catch {
      toast({
        title: "Не удалось отправить",
        description:
          "Проверьте, что таблица property_reports создана, и попробуйте снова.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const defaultTrigger = (
    <button
      type="button"
      onClick={openDialog}
      className="inline-flex items-center justify-center gap-1 text-[11px] text-muted-foreground hover:text-destructive transition-colors min-w-0"
    >
      <Flag className="w-3 h-3 shrink-0" />
      <span className="truncate">Сообщить о проблеме</span>
    </button>
  );

  const renderedTrigger =
    trigger && isValidElement<{ onClick?: (e: React.MouseEvent) => void }>(
      trigger,
    )
      ? cloneElement(trigger, {
          onClick: (e: React.MouseEvent) => {
            trigger.props.onClick?.(e);
            openDialog();
          },
        })
      : defaultTrigger;

  return (
    <>
      {renderedTrigger}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Flag className="w-4 h-4 text-destructive" />
              Сообщить о проблеме
            </DialogTitle>
            <DialogDescription>
              {propertyAddress || "Объявление"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="space-y-2">
              <Label className="text-xs">Причина</Label>
              <div className="space-y-2">
                {REASONS.map((item) => (
                  <label
                    key={item.value}
                    className="flex items-center gap-2 rounded-md border border-border px-3 py-2 cursor-pointer text-sm"
                  >
                    <input
                      type="radio"
                      name="reason"
                      value={item.value}
                      checked={reason === item.value}
                      onChange={() => setReason(item.value)}
                      className="accent-primary"
                    />
                    {item.label}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs mb-1 block">
                Комментарий{" "}
                {reason === "other" ? "(обязательно)" : "(необязательно)"}
              </Label>
              <Textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={3}
                placeholder="Кратко опишите проблему"
                required={reason === "other"}
              />
            </div>

            <div>
              <Label className="text-xs mb-1 block">
                Телефон для связи (необязательно)
              </Label>
              <Input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+7 (___) ___-__-__"
              />
            </div>

            <Button type="submit" className="w-full gap-2" disabled={loading}>
              <Send className="w-4 h-4" />
              {loading ? "Отправка…" : "Отправить жалобу"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
