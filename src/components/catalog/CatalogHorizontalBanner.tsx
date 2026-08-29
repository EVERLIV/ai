import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

export type CatalogHorizontalBannerItem = {
  id: string;
  href: string;
  external?: boolean;
  image: string;
  brand?: string;
  title: string;
  subtitle: string;
  cta: string;
  footer?: string;
  placeholder?: boolean;
};

type Props = {
  banner: CatalogHorizontalBannerItem;
  className?: string;
};

export default function CatalogHorizontalBanner({ banner, className }: Props) {
  const content = (
    <>
      <img
        src={banner.image}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        className={cn(
          "absolute inset-0",
          banner.placeholder
            ? "bg-[linear-gradient(90deg,rgba(8,12,20,0.93)_0%,rgba(8,12,20,0.78)_42%,rgba(8,12,20,0.45)_100%)]"
            : "bg-[linear-gradient(90deg,rgba(8,12,20,0.82)_0%,rgba(8,12,20,0.48)_55%,rgba(8,12,20,0.22)_100%)]",
        )}
      />
      <span className="absolute right-3 top-3 z-10 rounded bg-black/45 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white/90 backdrop-blur-sm sm:right-4 sm:top-4">
        Реклама
      </span>
      <div className="relative z-10 flex min-h-[120px] flex-col gap-4 p-4 sm:min-h-[132px] sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:p-5 md:p-6">
        <div
          className={cn(
            "min-w-0 flex-1 pr-16 sm:pr-0",
            banner.placeholder &&
              "rounded-lg bg-black/35 px-3 py-2.5 backdrop-blur-[1px] sm:px-4",
          )}
        >
          {banner.brand && (
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/90">
              {banner.brand}
            </p>
          )}
          <h3 className="mt-1 font-display text-lg font-bold leading-snug text-white sm:text-xl md:text-[1.35rem] [text-shadow:0_1px_12px_rgba(0,0,0,0.35)]">
            {banner.title}
          </h3>
          <p className="mt-1.5 text-xs font-medium leading-snug text-white sm:text-sm [text-shadow:0_1px_10px_rgba(0,0,0,0.4)]">
            {banner.subtitle}
          </p>
        </div>
        <span className="inline-flex h-10 shrink-0 items-center justify-center self-start rounded-md border border-white/70 bg-white/10 px-4 text-xs font-semibold text-white transition-colors group-hover:bg-white/20 sm:self-center sm:px-5 sm:text-sm">
          {banner.cta}
        </span>
      </div>
      {banner.footer && (
        <p className="relative z-10 border-t border-white/10 px-4 py-2 text-[9px] leading-snug text-white/70 sm:px-5 sm:text-[10px]">
          {banner.footer}
        </p>
      )}
    </>
  );

  const shellClass = cn(
    "group relative block overflow-hidden rounded-xl border text-white shadow-[var(--shadow-card)]",
    banner.placeholder
      ? "border-white/20 border-dashed"
      : "border-border/40",
    className,
  );

  if (banner.external) {
    return (
      <a
        href={banner.href}
        target="_blank"
        rel="noopener noreferrer"
        className={shellClass}
      >
        {content}
      </a>
    );
  }

  return (
    <Link to={banner.href} className={shellClass}>
      {content}
    </Link>
  );
}
