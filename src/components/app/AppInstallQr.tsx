import { QRCodeSVG } from "qrcode.react";
import iphoneBack from "@/assets/app-install/iphone-back.png";
import { COMPANY } from "@/config/company";
import { absoluteUrl } from "@/config/site";

export default function AppInstallQr() {
  const url = absoluteUrl("/app");

  return (
    <section className="relative lg:h-[290px]">
      <div className="relative overflow-hidden rounded-[28px] border border-[#f2f2f4] bg-white p-6 lg:absolute lg:inset-x-0 lg:top-[23px] lg:h-[267px] lg:overflow-visible lg:p-0">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start lg:block">
          <QRCodeSVG
            value={url}
            size={160}
            level="M"
            aria-label={`QR-код: ${url}`}
            className="shrink-0 lg:absolute lg:left-[56px] lg:top-[54px]"
          />
          <div className="text-center sm:text-left lg:absolute lg:left-[264px] lg:top-[74px] lg:w-[420px]">
            <h2 className="text-[18px] font-semibold leading-[18px] text-foreground">Откройте на телефоне</h2>
            <p className="mt-[7px] max-w-[404px] text-sm leading-[18px] text-muted-foreground">
              Наведите камеру — откроется эта страница
              <br className="hidden lg:inline" /> с инструкцией по установке приложения {COMPANY.brand}.
            </p>
            <a href={url} className="mt-[19px] block text-sm leading-[18px] text-primary hover:underline">
              {url}
            </a>
            <p className="mt-1 text-[10px] leading-[12px] text-[#bfc3cc]">
              {COMPANY.brand} — веб-приложение (PWA).
              <br />
              Не требует скачивания из магазина приложений.
            </p>
          </div>
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute left-[717px] top-0 hidden h-[289px] w-[191px] overflow-hidden rounded-t-[32px] lg:block"
      >
        <img src={iphoneBack} alt="" className="absolute inset-0 size-full max-w-none" />
        <div
          className="absolute inset-0 opacity-25"
          style={{ backgroundImage: "linear-gradient(213.46deg, #fff 0%, rgba(255,255,255,0) 100%)" }}
        />
      </div>
    </section>
  );
}
