import { X, ExternalLink } from "lucide-react";
import { useEffect } from "react";

interface StreetViewModalProps {
  lat: number;
  lng: number;
  address: string;
  onClose: () => void;
}

/**
 * Free street-level imagery via Yandex Panoramas embed (best coverage in Russia).
 * No API key required for the embed iframe. Falls back to a link to Yandex Maps panoramas.
 */
export default function StreetViewModal({ lat, lng, address, onClose }: StreetViewModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  // Yandex Maps embed with panoramas layer (no API key needed for iframe)
  const yandexEmbed = `https://yandex.ru/map-widget/v1/?ll=${lng}%2C${lat}&z=18&panorama%5Bpoint%5D=${lng}%2C${lat}&panorama%5Bdirection%5D=0%2C0&panorama%5Bspan%5D=120%2C70&l=stv%2Csta`;
  const yandexLink = `https://yandex.ru/maps/?panorama%5Bpoint%5D=${lng}%2C${lat}&panorama%5Bdirection%5D=0%2C0&l=stv%2Csta`;

  return (
    <div
      className="fixed inset-0 z-[1000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl bg-card rounded-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-card">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-widest text-primary">
              Вид с улицы
            </p>
            <p className="text-sm font-semibold text-foreground truncate">{address}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={yandexLink}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-foreground hover:text-primary transition-colors"
            >
              Открыть в Яндекс <ExternalLink className="w-3 h-3" />
            </a>
            <button
              onClick={onClose}
              aria-label="Закрыть"
              className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 text-foreground flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="relative flex-1 bg-muted min-h-[60vh]">
          <iframe
            src={yandexEmbed}
            title={`Панорама улицы: ${address}`}
            className="absolute inset-0 w-full h-full border-0"
            allow="fullscreen"
          />
        </div>

        <div className="px-4 py-2 text-[10px] text-muted-foreground bg-muted/40 border-t border-border">
          Если панорама недоступна для этой точки —
          {" "}
          <a
            href={yandexLink}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            откройте Яндекс Карты
          </a>
          , чтобы найти ближайшую.
        </div>
      </div>
    </div>
  );
}
