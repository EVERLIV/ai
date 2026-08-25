import { Video } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

/** Индикатор видео на обложке карточки (как на референсе ЦИАН). */
export default function ListingVideoBadge({ className }: Props) {
  return (
    <div
      className={cn(
        "z-[1] flex items-center justify-center rounded-md bg-black/55 text-white pointer-events-none w-8 h-8 shrink-0",
        className,
      )}
      title="Есть видео"
      aria-hidden
    >
      <Video className="w-3.5 h-3.5" strokeWidth={2} />
    </div>
  );
}
