import bannerBg from "@/assets/cta-rent-out.jpg";
import { AppleIcon, AndroidIcon } from "@/components/app/PlatformIcons";
import type { AppPlatform } from "@/lib/appInstallContent";
import { cn } from "@/lib/utils";

type Props = {
  onSelectPlatform: (platform: AppPlatform) => void;
};

export default function AppInstallHero({ onSelectPlatform }: Props) {
  return (
    <section className="relative rounded-2xl overflow-hidden min-h-[320px] sm:min-h-[360px]">
      <img
        src={bannerBg}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
        decoding="async"
      />
      <div
        className="absolute inset-0 bg-gradient-to-r from-foreground/92 via-foreground/78 to-foreground/45"
        aria-hidden
      />
      <div className="absolute inset-0 bg-foreground/25" aria-hidden />

      <div className="relative z-10 p-6 sm:p-8 lg:p-10 max-w-2xl text-background">
        <p className="text-xs font-semibold uppercase tracking-wider text-background/60 mb-3">
          Приложение
        </p>
        <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight">
          Как пользоваться приложением ДАДАТУТ
        </h1>
        <p className="mt-4 text-sm sm:text-base text-background/80 max-w-xl leading-relaxed">
          Установите на телефон — каталог, избранное и заявки всегда под рукой.
          Работает как приложение, без App Store и Google Play.
        </p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => onSelectPlatform("ios")}
            className={cn(
              "inline-flex items-center justify-center gap-2.5 rounded-full",
              "border border-background/25 bg-background/15 backdrop-blur-sm px-5 py-3",
              "text-sm font-semibold hover:bg-background/25 transition-colors",
            )}
          >
            <AppleIcon variant="light" className="h-5 w-5" />
            Установить на iPhone
          </button>
          <button
            type="button"
            onClick={() => onSelectPlatform("android")}
            className={cn(
              "inline-flex items-center justify-center gap-2.5 rounded-full",
              "border border-background/25 bg-background/15 backdrop-blur-sm px-5 py-3",
              "text-sm font-semibold hover:bg-background/25 transition-colors",
            )}
          >
            <AndroidIcon variant="light" className="h-5 w-5" />
            Установить на Android
          </button>
        </div>
      </div>
    </section>
  );
}
