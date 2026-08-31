import { cn } from "@/lib/utils";
import type { ImgHTMLAttributes } from "react";

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  /** Block right-click / drag save (default true) */
  protect?: boolean;
};

export default function ProtectedImage({
  protect = true,
  className,
  draggable,
  onContextMenu,
  onDragStart,
  ...props
}: Props) {
  return (
    <img
      {...props}
      draggable={draggable ?? false}
      data-protected={protect ? "true" : undefined}
      className={cn(protect && "select-none", className)}
      onContextMenu={(e) => {
        if (protect) e.preventDefault();
        onContextMenu?.(e);
      }}
      onDragStart={(e) => {
        if (protect) e.preventDefault();
        onDragStart?.(e);
      }}
    />
  );
}
