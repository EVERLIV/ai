import appIcon from "@/assets/app-install/app-icon.png";
import dashedCurve from "@/assets/app-install/dashed-curve.svg";
import iconAndroid from "@/assets/app-install/icon-android.svg";
import iconApple from "@/assets/app-install/icon-apple.svg";
import iconShadow from "@/assets/app-install/icon-shadow.svg";
import type { AppPlatform } from "@/lib/appInstallContent";
import { cn } from "@/lib/utils";

type Props = {
  platform: AppPlatform;
  onSelectPlatform: (platform: AppPlatform) => void;
};

const PLATFORMS: { id: AppPlatform; label: string; icon: string; iconClass: string }[] = [
  { id: "ios", label: "iPhone", icon: iconApple, iconClass: "h-10 w-8" },
  { id: "android", label: "Android", icon: iconAndroid, iconClass: "h-10 w-[34px]" },
];

export default function AppInstallHero({ platform, onSelectPlatform }: Props) {
  return (
    <section className="relative lg:h-[434px]">
      <div
        aria-hidden
        className="pointer-events-none absolute left-[664px] top-[-62px] hidden h-[317px] w-[340px] lg:block"
      >
        <div className="absolute left-[70px] top-[103px] flex h-[209px] w-[228px] items-center justify-center">
          <div className="h-[165.5px] w-[192.6px] rotate-[14.62deg] relative">
            <img src={iconShadow} alt="" className="absolute inset-[-18.13%_-15.57%] block size-auto max-w-none" />
          </div>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative h-[254.9px] w-[286.7px] -scale-y-100 rotate-[166.02deg] overflow-hidden">
            <img
              src={appIcon}
              alt=""
              className="absolute left-[-4.84%] top-[-13.87%] h-[125.78%] w-[111.84%] max-w-none"
            />
          </div>
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute left-[335.5px] top-[207.8px] hidden h-[107.6px] w-[416.4px] items-center justify-center lg:flex"
      >
        <img src={dashedCurve} alt="" className="h-[86.1px] w-[412.5px] max-w-none rotate-3" />
      </div>

      <h1 className="relative font-display text-[34px] font-bold leading-[1] text-foreground sm:text-[42px] lg:text-[50px]">
        Как пользоваться
        <br />
        приложением <span className="text-primary">ДАДАТУТ</span>
      </h1>
      <p className="relative mt-4 max-w-[680px] text-base leading-[26px] text-muted-foreground lg:absolute lg:left-[2px] lg:top-[115px] lg:mt-0 lg:text-[18px]">
        Установите на телефон — каталог, избранное и заявки всегда под рукой.
        <br className="hidden lg:inline" /> Работает как приложение, без App Store и Google Play.
      </p>

      <div className="relative mt-8 flex gap-[10px] lg:absolute lg:left-[2px] lg:top-[211px] lg:mt-0">
        {PLATFORMS.map(({ id, label, icon, iconClass }) => {
          const isActive = platform === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelectPlatform(id)}
              aria-pressed={isActive}
              className={cn(
                "flex size-[140px] flex-col items-center rounded-[20px] pt-8 transition-colors",
                isActive ? "bg-[#e9c8c9]" : "bg-white hover:bg-[#fdf7f7]",
              )}
            >
              <span
                aria-hidden
                className={cn(iconClass, isActive ? "bg-white" : "bg-[#f0dfdf]")}
                style={{
                  mask: `url(${icon}) center / contain no-repeat`,
                  WebkitMask: `url(${icon}) center / contain no-repeat`,
                }}
              />
              <span
                className={cn(
                  "mt-[5px] text-[20px] font-medium leading-[26px] tracking-[-0.2px]",
                  isActive ? "text-white" : "text-[#f0dfdf]",
                )}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
