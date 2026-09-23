import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import AppInstallHero from "@/components/app/AppInstallHero";
import AppInstallQr from "@/components/app/AppInstallQr";
import AppInstallSteps from "@/components/app/AppInstallSteps";
import SeoHead from "@/components/SeoHead";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { absoluteUrl } from "@/config/site";
import {
  ANDROID_NOTE,
  ANDROID_STEPS,
  type AppPlatform,
  IOS_STEPS,
  IOS_TIP,
} from "@/lib/appInstallContent";

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
    <div className="min-h-screen bg-background flex flex-col overflow-x-clip">
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

        <AppInstallHero platform={platform} onSelectPlatform={selectPlatform} />

        <div ref={instructionsRef} className="mt-14 scroll-mt-28 lg:mt-0">
          {platform === "ios" ? (
            <AppInstallSteps steps={IOS_STEPS} platform="ios" tip={IOS_TIP} />
          ) : (
            <div className="lg:mb-16">
              <AppInstallSteps steps={ANDROID_STEPS} platform="android" note={ANDROID_NOTE} />
            </div>
          )}
        </div>

        <div className="mt-12 lg:mt-0">
          <AppInstallQr />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
