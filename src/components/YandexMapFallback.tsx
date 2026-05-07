import { AlertCircle, ExternalLink } from "lucide-react";

interface YandexMapFallbackProps {
  center: [number, number];
  points?: Array<[number, number]>;
  zoom?: number;
  label?: string;
  className?: string;
}

export default function YandexMapFallback({
  center,
  points = [center],
  zoom = 12,
  label = "Карта объекта",
  className = "absolute inset-0",
}: YandexMapFallbackProps) {
  const [lng, lat] = center;
  const visiblePoints = points.length > 0 ? points : [center];
  const pointParam = visiblePoints
    .slice(0, 80)
    .map(([pointLng, pointLat]) => `${pointLng},${pointLat},pm2rdm`)
    .join("~");
  const params = new URLSearchParams({
    ll: `${lng},${lat}`,
    z: String(zoom),
    pt: pointParam,
  });
  const src = `https://yandex.ru/map-widget/v1/?${params.toString()}`;
  const openUrl = `https://yandex.ru/maps/?${params.toString()}`;

  return (
    <div className={`${className} bg-muted`}>
      <iframe
        title={label}
        src={src}
        className="absolute inset-0 h-full w-full border-0"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        allowFullScreen
      />
      <div className="absolute left-3 top-3 z-[4] max-w-[320px] border border-border bg-card/95 px-3 py-2 text-[11px] text-muted-foreground backdrop-blur">
        <div className="flex items-start gap-2">
          <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
          <span>JS API Яндекс Карт не ответил, открыт резервный виджет.</span>
        </div>
      </div>
      <a
        href={openUrl}
        target="_blank"
        rel="noreferrer"
        className="absolute right-3 top-3 z-[4] inline-flex items-center gap-1.5 border border-border bg-card/95 px-3 py-2 text-[11px] font-semibold text-foreground backdrop-blur transition-opacity hover:opacity-90"
      >
        Открыть <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
