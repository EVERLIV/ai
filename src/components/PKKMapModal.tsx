import { X, ExternalLink, Map } from "lucide-react";
import { useEffect } from "react";

interface PKKMapModalProps {
  cadastralNumber: string;
  onClose: () => void;
}

export default function PKKMapModal({ cadastralNumber, onClose }: PKKMapModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const mapUrl = `https://ik6map.roscadastres.com/map?cadnum=${encodeURIComponent(cadastralNumber)}`;

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
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
              <Map className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-widest text-primary">
                Кадастровая карта
              </p>
              <p className="text-sm font-semibold text-foreground truncate font-mono">{cadastralNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-foreground hover:text-primary transition-colors"
            >
              Открыть на сайте <ExternalLink className="w-3 h-3" />
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
            src={mapUrl}
            title={`Кадастровая карта: ${cadastralNumber}`}
            className="absolute inset-0 w-full h-full border-0"
            allow="fullscreen"
          />
        </div>

        <div className="px-4 py-2 text-[10px] text-muted-foreground bg-muted/40 border-t border-border">
          Данные Росреестра · Публичная кадастровая карта ·{" "}
          <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            Открыть в новой вкладке
          </a>
        </div>
      </div>
    </div>
  );
}
