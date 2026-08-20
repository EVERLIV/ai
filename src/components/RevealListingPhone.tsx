import { useEffect, useState } from "react";
import { Phone, ShieldCheck } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { supabasePublic } from "@/integrations/supabase/client";
import {
  formatPhoneDisplay,
  getListingOwnerUserId,
  getListingPhoneFromExtras,
  maskPhone,
  normalizePhoneTel,
} from "@/lib/listingContact";
import { propertyCtaButtonClass } from "@/components/OwnerMessageDialog";
import { cn } from "@/lib/utils";

type PropertyLike = {
  extras?: Record<string, unknown> | null;
  submitted_by?: string | null;
};

interface Props {
  property: PropertyLike;
  className?: string;
  /** Компактный вариант для мобильной нижней панели */
  variant?: "cta" | "bar";
}

export default function RevealListingPhone({ property, className, variant = "cta" }: Props) {
  const [open, setOpen] = useState(false);
  const [human, setHuman] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [phone, setPhone] = useState(() => getListingPhoneFromExtras(property.extras));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    const fromExtras = getListingPhoneFromExtras(property.extras);
    if (fromExtras) {
      setPhone(fromExtras);
      return;
    }

    const ownerId = getListingOwnerUserId(property);
    if (!ownerId) return;

    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data } = await supabasePublic
        .from("profiles")
        .select("phone")
        .eq("id", ownerId)
        .maybeSingle();
      if (cancelled) return;
      const profilePhone = typeof data?.phone === "string" ? data.phone.trim() : "";
      if (profilePhone.replace(/\D/g, "").length >= 10) setPhone(profilePhone);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, property]);

  const reset = () => {
    setHuman(false);
    setRevealed(false);
  };

  const tel = phone ? normalizePhoneTel(phone) : "";

  if (variant === "bar") {
    return (
      <>
        <button
          type="button"
          onClick={() => { setOpen(true); reset(); }}
          aria-label="Позвонить"
          className={cn(
            "flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl text-primary hover:bg-primary/10 active:scale-95 transition-all",
            className,
          )}
        >
          <Phone className="w-6 h-6" strokeWidth={2.2} />
          <span className="text-[10px] font-medium">Звонок</span>
        </button>
        <PhoneRevealDialog
          open={open}
          onOpenChange={(value) => { setOpen(value); if (!value) reset(); }}
          phone={phone}
          tel={tel}
          loading={loading}
          human={human}
          setHuman={setHuman}
          revealed={revealed}
          setRevealed={setRevealed}
        />
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setOpen(true); reset(); }}
        className={cn(propertyCtaButtonClass, "bg-foreground text-background", className)}
      >
        <Phone className="w-4 h-4 shrink-0" />
        Позвонить
      </button>
      <PhoneRevealDialog
        open={open}
        onOpenChange={(value) => { setOpen(value); if (!value) reset(); }}
        phone={phone}
        tel={tel}
        loading={loading}
        human={human}
        setHuman={setHuman}
        revealed={revealed}
        setRevealed={setRevealed}
      />
    </>
  );
}

function PhoneRevealDialog({
  open,
  onOpenChange,
  phone,
  tel,
  loading,
  human,
  setHuman,
  revealed,
  setRevealed,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  phone: string;
  tel: string;
  loading: boolean;
  human: boolean;
  setHuman: (value: boolean) => void;
  revealed: boolean;
  setRevealed: (value: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-primary" />
            Номер разместившего
          </DialogTitle>
          <DialogDescription>
            Номер скрыт от ботов. Подтвердите, что вы не робот, чтобы увидеть полный телефон.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-1">
          {loading ? (
            <p className="text-sm text-muted-foreground">Загрузка номера…</p>
          ) : !phone ? (
            <p className="text-sm text-muted-foreground">Номер не указан в объявлении.</p>
          ) : (
            <>
              <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-center">
                <div className="text-lg font-semibold tracking-wide text-foreground">
                  {revealed ? formatPhoneDisplay(phone) : maskPhone(phone)}
                </div>
              </div>

              {!revealed ? (
                <div className="space-y-3">
                  <label className="flex items-center gap-2 rounded-md border border-border px-3 py-2 cursor-pointer">
                    <Checkbox checked={human} onCheckedChange={(v) => setHuman(!!v)} />
                    <span className="text-sm">Я не робот</span>
                  </label>
                  <Button
                    type="button"
                    className="w-full gap-2"
                    disabled={!human}
                    onClick={() => setRevealed(true)}
                  >
                    <ShieldCheck className="w-4 h-4" />
                    Показать номер
                  </Button>
                </div>
              ) : (
                <Button asChild className="w-full gap-2">
                  <a href={`tel:${tel}`}>
                    <Phone className="w-4 h-4" />
                    Позвонить
                  </a>
                </Button>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
