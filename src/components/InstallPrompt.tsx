import { useEffect, useState } from "react";
import { X, Download } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      localStorage.getItem("pwa_install_dismissed")
    ) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setShow(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setInstalling(true);
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setShow(false);
    setInstalling(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("pwa_install_dismissed", "1");
  };

  if (!show) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9999] bg-foreground text-background animate-fade-in-down">
      <div className="max-w-screen-xl mx-auto px-4 h-10 flex items-center gap-3">
        {/* Иконка */}
        <div className="w-5 h-5 bg-primary flex items-center justify-center shrink-0">
          <span className="text-primary-foreground font-bold text-[10px]">А</span>
        </div>

        {/* Текст */}
        <p className="text-xs flex-1 min-w-0 truncate">
          <span className="font-semibold">АрендаСити</span>
          <span className="text-background/60 ml-2 hidden sm:inline">— установите приложение для быстрого доступа к каталогу</span>
        </p>

        {/* Кнопка установить */}
        <button
          onClick={handleInstall}
          disabled={installing}
          className="inline-flex items-center gap-1.5 h-6 px-3 bg-primary text-primary-foreground text-[11px] font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 shrink-0"
        >
          <Download className="w-3 h-3" />
          {installing ? "..." : "Установить"}
        </button>

        {/* Закрыть */}
        <button
          onClick={handleDismiss}
          className="w-6 h-6 flex items-center justify-center text-background/50 hover:text-background transition-colors shrink-0"
          aria-label="Закрыть"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
