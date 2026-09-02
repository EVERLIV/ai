import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import AppInstallHero from "@/components/app/AppInstallHero";
import AppInstallQr from "@/components/app/AppInstallQr";
import AppInstallSteps from "@/components/app/AppInstallSteps";
import { AppleIcon, AndroidIcon } from "@/components/app/PlatformIcons";
import SeoHead from "@/components/SeoHead";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { COMPANY } from "@/config/company";
import { absoluteUrl } from "@/config/site";
import {
  ANDROID_NOTE,
  ANDROID_STEPS,
  type AppPlatform,
  IOS_STEPS,
  IOS_TIP,
} from "@/lib/appInstallContent";
import { cn } from "@/lib/utils";

export default function AppInstallPage() {
  const [platform, setPlatform] = useState<AppPlatform>("ios");
  const instructionsRef = useRef<HTMLDivElement>(null);

  const selectPlatform = (next: AppPlatform) => {
    setPlatform(next);
    requestAnimationFrame(() => {
      instructionsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SeoHead
        title="Приложение ДАДАТУТ — установка на iPhone и Android"
        description="Как установить ДАДАТУТ на домашний экран: пошаговая инструкция для iPhone (Safari) и Android (Chrome). QR-код для быстрого доступа."
        url={absoluteUrl("/app")}
      />
      <SiteHeader />

      <main className="flex-1 container mx-auto px-4 lg:px-8 py-8 mt-[56px] lg:mt-[104px] max-w-5xl">
        <nav className="text-[11px] text-muted-foreground mb-6 flex items-center gap-1.5">
          <Link to="/" className="hover:text-foreground transition-colors">
            Главная
          </Link>
          <span className="opacity-50">/</span>
          <span className="text-foreground">Приложение</span>
        </nav>

        <AppInstallHero onSelectPlatform={selectPlatform} />

        <div ref={instructionsRef} className="mt-10 scroll-mt-28">
          <div className="inline-flex rounded-full border border-border bg-muted/40 p-1">
            <button
              type="button"
              onClick={() => setPlatform("ios")}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                platform === "ios"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <AppleIcon variant="dark" className="h-4 w-4" />
              iPhone
            </button>
            <button
              type="button"
              onClick={() => setPlatform("android")}
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                platform === "android"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <AndroidIcon variant="dark" className="h-4 w-4" />
              Android
            </button>
          </div>

          <div className="mt-8">
            {platform === "ios" ? (
              <AppInstallSteps
                steps={IOS_STEPS}
                platform="ios"
                tip={IOS_TIP}
              />
            ) : (
              <AppInstallSteps
                steps={ANDROID_STEPS}
                platform="android"
                note={ANDROID_NOTE}
              />
            )}
          </div>
        </div>

        <div className="mt-12">
          <AppInstallQr />
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          {COMPANY.brand} — веб-приложение (PWA). Не требует скачивания из
          магазина приложений.
        </p>
      </main>

      <SiteFooter />
    </div>
  );
}
