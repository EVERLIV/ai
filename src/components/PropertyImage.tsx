import { ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface PropertyImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  imgClassName?: string;
  /** Show a "Photo coming soon" placeholder when src is empty/missing */
  placeholderLabel?: string;
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
}: PropertyImageProps) {
  const hasImage = src && src.trim().length > 0;

  return (
    <div className={cn("relative w-full h-full overflow-hidden bg-muted", className)}>
      {hasImage ? (
        <img
          src={src as string}
          alt={alt}
          loading="lazy"
          className={cn("w-full h-full object-cover", imgClassName)}
          onError={(e) => {
            // Hide broken image, sibling placeholder will show through
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center px-3"
          style={{
            background:
              "linear-gradient(135deg, hsl(35 30% 94%) 0%, hsl(38 45% 90%) 50%, hsl(40 25% 96%) 100%)",
          }}
        >
          <div className="w-10 h-10 rounded-full bg-background/70 backdrop-blur flex items-center justify-center text-muted-foreground">
            <ImageIcon className="w-5 h-5" />
          </div>
          <span className="text-[11px] font-medium tracking-wide text-foreground/70">
            {placeholderLabel}
          </span>
        </div>
      )}
    </div>
  );
}
