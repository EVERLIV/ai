import { useEffect, useState } from "react";
import { X, Download, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Не показывать если уже установлено или уже отклонили
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      localStorage.getItem("pwa_install_dismissed")
    ) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Показать через 3 сек после загрузки
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
    if (outcome === "accepted") {
      setShow(false);
    }
    setInstalling(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("pwa_install_dismissed", "1");
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-sm px-4 animate-fade-in-up">
      <div className="bg-card border border-border shadow-xl flex items-center gap-3 p-4">
        {/* Иконка */}
        <div className="w-10 h-10 bg-primary flex items-center justify-center shrink-0">
          <Smartphone className="w-5 h-5 text-primary-foreground" />
        </div>

        {/* Текст */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-tight">Установить приложение</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">Быстрый доступ к каталогу без браузера</p>
        </div>

        {/* Кнопки */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstall}
            disabled={installing}
            className="inline-flex items-center gap-1.5 h-8 px-3 bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            <Download className="w-3.5 h-3.5" />
            {installing ? "..." : "Установить"}
          </button>
          <button
            onClick={handleDismiss}
            className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Закрыть"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
