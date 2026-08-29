import { QRCodeSVG } from "qrcode.react";
import { absoluteUrl } from "@/config/site";

export default function AppInstallQr() {
  const url = absoluteUrl("/app");

  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
      <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:gap-10">
        <div className="shrink-0 rounded-xl border border-border bg-white p-3 shadow-sm">
          <QRCodeSVG
            value={url}
            size={160}
            level="M"
            includeMargin={false}
            aria-label={`QR-код: ${url}`}
          />
        </div>
        <div className="text-center sm:text-left">
          <h2 className="font-display text-xl font-bold text-foreground">
            Откройте на телефоне
          </h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-md">
            Наведите камеру — откроется эта страница с инструкцией по
            установке приложения АрендаСити.
          </p>
          <p className="mt-3 text-xs font-medium text-foreground/70 break-all">
            {url}
          </p>
        </div>
      </div>
    </div>
  );
}
