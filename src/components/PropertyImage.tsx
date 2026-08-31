import { ImageIcon } from "lucide-react";
import ProtectedImage from "@/components/ProtectedImage";
import { cn } from "@/lib/utils";

interface PropertyImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
  /** Show a "Photo coming soon" placeholder when src is empty/missing */
  placeholderLabel?: string;
  /** listing — larger placeholder for catalog row cards */
  variant?: "default" | "listing";
}

/**
 * Universal image wrapper for property/ad cards.
 * Renders an <img> when src is present, otherwise a branded
 * "Фото скоро появится" placeholder with subtle warm gradient.
 */
export default function PropertyImage({
  src,
  alt,
  className,
  imgClassName,
  placeholderLabel = "Фото скоро появится",
  variant = "default",
}: PropertyImageProps) {
  const hasImage = src && src.trim().length > 0;
  const isListing = variant === "listing";

  return (
    <div
      className={cn(
        "relative w-full h-full min-h-0 min-w-0 overflow-hidden bg-muted",
        className,
      )}
    >
      {hasImage ? (
        <ProtectedImage
          src={src as string}
          alt={alt}
          loading="lazy"
          className={cn(
            "absolute inset-0 w-full h-full object-cover",
            imgClassName,
          )}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-3"
          style={{
            background: isListing
              ? "linear-gradient(145deg, hsl(35 28% 93%) 0%, hsl(38 42% 88%) 45%, hsl(40 22% 95%) 100%)"
              : "linear-gradient(135deg, hsl(35 30% 94%) 0%, hsl(38 45% 90%) 50%, hsl(40 25% 96%) 100%)",
          }}
        >
          <div
            className={cn(
              "rounded-full bg-background/70 backdrop-blur flex items-center justify-center text-muted-foreground",
              isListing ? "w-12 h-12" : "w-10 h-10",
            )}
          >
            <ImageIcon className={isListing ? "w-6 h-6" : "w-5 h-5"} />
          </div>
          <span
            className={cn(
              "font-medium tracking-wide text-foreground/70",
              isListing ? "text-xs" : "text-[11px]",
            )}
          >
            {placeholderLabel}
          </span>
        </div>
      )}
    </div>
  );
}
