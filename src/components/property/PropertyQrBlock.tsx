import { QRCodeCanvas, QRCodeSVG } from "qrcode.react";
import { Check, Copy, Download } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  getPropertyPageUrl,
  propertyQrFilename,
} from "@/lib/propertyQr";

type Props = {
  propertyId: string;
  publicId?: string | null;
  /** Компактный вид для таблицы / popover */
  compact?: boolean;
  className?: string;
};

export default function PropertyQrBlock({
  propertyId,
  publicId,
  compact = false,
  className = "",
}: Props) {
  const { toast } = useToast();
  const wrapRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const url = getPropertyPageUrl(propertyId);
  const qrSize = compact ? 120 : 160;

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast({ title: "Ссылка скопирована" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Не удалось скопировать", variant: "destructive" });
    }
  }, [toast, url]);

  const downloadPng = useCallback(() => {
    const canvas = wrapRef.current?.querySelector("canvas");
    if (!canvas || !(canvas instanceof HTMLCanvasElement)) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = propertyQrFilename(propertyId, publicId);
      a.click();
      URL.revokeObjectURL(a.href);
    }, "image/png");
  }, [propertyId, publicId]);

  return (
    <div
      className={`flex flex-col sm:flex-row gap-4 sm:gap-6 items-start ${className}`}
    >
      <div className="shrink-0 rounded-lg border border-border bg-white p-2 shadow-sm">
        <QRCodeSVG
          value={url}
          size={qrSize}
          level="M"
          includeMargin={false}
          aria-label={`QR-код: ${url}`}
        />
        <div ref={wrapRef} className="sr-only" aria-hidden>
          <QRCodeCanvas
            value={url}
            size={qrSize * 2}
            level="M"
            includeMargin={false}
          />
        </div>
      </div>

      <div className="min-w-0 flex-1 space-y-2">
        {!compact && (
          <div>
            <p className="text-sm font-medium text-foreground">
              QR-код объекта
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Ведёт на страницу объекта на сайте
            </p>
          </div>
        )}
        {publicId ? (
          <p className="text-xs text-muted-foreground">
            ID:{" "}
            <span className="font-mono font-medium text-foreground">
              {publicId}
            </span>
          </p>
        ) : null}
        <p className="text-xs text-muted-foreground break-all">{url}</p>
        <div className="flex flex-wrap gap-2 pt-1">
          <Button type="button" variant="outline" size="sm" onClick={copyLink}>
            {copied ? (
              <Check className="w-3.5 h-3.5 mr-1.5" />
            ) : (
              <Copy className="w-3.5 h-3.5 mr-1.5" />
            )}
            Копировать ссылку
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={downloadPng}>
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Скачать PNG
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Мини QR только для печати (без кнопок). */
export function PropertyQrPrint({ propertyId, size = 80 }: { propertyId: string; size?: number }) {
  const url = getPropertyPageUrl(propertyId);
  return (
    <QRCodeSVG
      value={url}
      size={size}
      level="M"
      includeMargin={false}
      aria-hidden
    />
  );
}
