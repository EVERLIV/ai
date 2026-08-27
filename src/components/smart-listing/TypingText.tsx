import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Props = {
  text: string;
  /** Печать как в мессенджере */
  animate?: boolean;
  className?: string;
  onDone?: () => void;
  /** мс на символ; длинные тексты ускоряются */
  msPerChar?: number;
};

export default function TypingText({
  text,
  animate = true,
  className,
  onDone,
  msPerChar = 16,
}: Props) {
  const [shown, setShown] = useState(animate ? "" : text);
  const [done, setDone] = useState(!animate);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!animate) {
      setShown(text);
      setDone(true);
      return;
    }
    setShown("");
    setDone(false);
    let i = 0;
    const len = text.length;
    const chunk = len > 280 ? 3 : len > 140 ? 2 : 1;
    const delay = len > 400 ? Math.max(8, msPerChar - 6) : msPerChar;

    const id = window.setInterval(() => {
      i = Math.min(len, i + chunk);
      setShown(text.slice(0, i));
      if (i >= len) {
        window.clearInterval(id);
        setDone(true);
        onDoneRef.current?.();
      }
    }, delay);

    return () => window.clearInterval(id);
  }, [text, animate, msPerChar]);

  return (
    <span className={cn(className)}>
      {shown}
      {animate && !done ? (
        <span
          className="inline-block w-[2px] h-[1em] align-[-0.15em] ml-0.5 bg-foreground/70 animate-pulse"
          aria-hidden
        />
      ) : null}
    </span>
  );
}
