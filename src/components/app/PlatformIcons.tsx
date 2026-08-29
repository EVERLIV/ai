import { cn } from "@/lib/utils";

type IconProps = {
  className?: string;
  /** white icons for dark backgrounds; dark for light tabs */
  variant?: "light" | "dark";
};

const APPLE_SRC = {
  light: "/icons/apple.png",
  dark: "/icons/apple-dark.png",
} as const;

const ANDROID_SRC = {
  light: "/icons/android.png",
  dark: "/icons/android-dark.png",
} as const;

export function AppleIcon({ className, variant = "dark" }: IconProps) {
  return (
    <img
      src={APPLE_SRC[variant]}
      alt=""
      width={20}
      height={20}
      aria-hidden
      draggable={false}
      decoding="async"
      className={cn("h-5 w-5 object-contain", className)}
    />
  );
}

export function AndroidIcon({ className, variant = "dark" }: IconProps) {
  return (
    <img
      src={ANDROID_SRC[variant]}
      alt=""
      width={20}
      height={20}
      aria-hidden
      draggable={false}
      decoding="async"
      className={cn("h-5 w-5 object-contain", className)}
    />
  );
}
