import { Check, Copy, Share2 } from "lucide-react";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import {
  buildPropertySharePayload,
  canUseNativeShare,
  copyPropertyShareText,
  mailShareUrl,
  type PropertyShareInput,
  sharePropertyNative,
  telegramShareUrl,
  vkShareUrl,
  whatsappShareUrl,
} from "@/lib/propertyShare";
import { cn } from "@/lib/utils";

interface Props {
  property: PropertyShareInput;
  variant?: "icon" | "bar";
  className?: string;
}

export default function PropertyShareButton({
  property,
  variant = "icon",
  className,
}: Props) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const payload = buildPropertySharePayload(
    property,
    typeof window !== "undefined" ? window.location.href : undefined,
  );

  const handleNativeShare = async () => {
    setBusy(true);
    try {
      const result = await sharePropertyNative(payload);
      if (result === "shared") setOpen(false);
    } catch {
      toast({ title: "Не удалось поделиться", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const copyText = async () => {
    try {
      await copyPropertyShareText(payload);
      setCopied(true);
      toast({
        title: "Скопировано",
        description: "SEO-текст, ссылка, описание и CTA готовы к отправке.",
      });
      window.setTimeout(() => setCopied(false), 2000);
      setOpen(false);
    } catch {
      toast({ title: "Не удалось скопировать", variant: "destructive" });
    }
  };

  const triggerClass =
    variant === "bar"
      ? "flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl text-foreground hover:bg-muted active:scale-95 transition-all"
      : "flex items-center justify-center w-8 h-8 border border-foreground/25 text-foreground hover:bg-muted transition-colors";

  const icon = (
    <Share2
      className={variant === "bar" ? "w-6 h-6" : "w-4 h-4"}
      strokeWidth={2.2}
    />
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Поделиться"
          disabled={busy}
          className={cn(triggerClass, className)}
        >
          {icon}
          {variant === "bar" && (
            <span className="text-[10px] font-medium">Поделиться</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72 p-3 space-y-2">
        <p className="text-xs font-semibold text-foreground">
          Поделиться объектом
        </p>
        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-3">
          {payload.title}
        </p>
        <div className="grid gap-1.5">
          {canUseNativeShare() && (
            <button
              type="button"
              onClick={handleNativeShare}
              className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium flex items-center hover:opacity-90"
            >
              Открыть меню «Поделиться»
            </button>
          )}
          <a
            href={telegramShareUrl(payload)}
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
            className="h-8 px-3 rounded-md bg-muted text-xs font-medium flex items-center hover:bg-muted/80"
          >
            Telegram
          </a>
          <a
            href={whatsappShareUrl(payload)}
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
            className="h-8 px-3 rounded-md bg-muted text-xs font-medium flex items-center hover:bg-muted/80"
          >
            WhatsApp
          </a>
          <a
            href={vkShareUrl(payload)}
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
            className="h-8 px-3 rounded-md bg-muted text-xs font-medium flex items-center hover:bg-muted/80"
          >
            ВКонтакте
          </a>
          <a
            href={mailShareUrl(payload)}
            onClick={() => setOpen(false)}
            className="h-8 px-3 rounded-md bg-muted text-xs font-medium flex items-center hover:bg-muted/80"
          >
            Email
          </a>
          <button
            type="button"
            onClick={copyText}
            className="h-8 px-3 rounded-md border border-border text-xs font-medium flex items-center gap-1.5 hover:bg-muted"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-primary" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
            {copied ? "Скопировано" : "Скопировать текст и ссылку"}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
