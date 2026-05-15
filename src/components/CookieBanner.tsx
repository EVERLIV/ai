import { useEffect, useState } from "react";
import { X, Cookie } from "lucide-react";

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem("cookie_accepted")) {
      // Показать через 1 сек
      const t = setTimeout(() => setShow(true), 1000);
      return () => clearTimeout(t);
    }
  }, []);

  const accept = () => {
    localStorage.setItem("cookie_accepted", "1");
    setShow(false);
  };

  const dismiss = () => {
    localStorage.setItem("cookie_accepted", "dismissed");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[9998] w-80 animate-fade-in-up">
      <div className="bg-card border border-border shadow-xl p-4 relative">
        {/* Закрыть */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Закрыть"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Иконка + заголовок */}
        <div className="flex items-center gap-2 mb-2 pr-6">
          <Cookie className="w-4 h-4 text-primary shrink-0" />
          <p className="text-sm font-semibold text-foreground">Мы используем cookies</p>
        </div>

        {/* Текст */}
        <p className="text-[11px] text-muted-foreground leading-relaxed mb-4">
          Сайт использует файлы cookie для улучшения работы и анализа трафика.
          Продолжая пользоваться сайтом, вы соглашаетесь с{" "}
          <a href="/privacy" className="text-primary hover:underline">политикой конфиденциальности</a>.
        </p>

        {/* Кнопки */}
        <div className="flex gap-2">
          <button
            onClick={accept}
            className="flex-1 h-8 bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            Принять
          </button>
          <button
            onClick={dismiss}
            className="flex-1 h-8 border border-border text-xs text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
          >
            Отклонить
          </button>
        </div>
      </div>
    </div>
  );
}
