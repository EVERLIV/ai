import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

const STORAGE_KEY = "cookie_accepted";

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY)) return;
    const t = setTimeout(() => setShow(true), 600);
    return () => clearTimeout(t);
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setShow(false);
  };

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "dismissed");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[9998] pb-[env(safe-area-inset-bottom)]"
      role="dialog"
      aria-label="Уведомление о файлах cookie"
    >
      <div className="pointer-events-auto w-full border-t border-border bg-card/95 backdrop-blur-md shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
        <div className="container mx-auto px-4 lg:px-8 py-3 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
          <p className="flex-1 text-[12px] sm:text-[13px] text-muted-foreground leading-relaxed min-w-0">
            Мы сохраняем технические данные в браузере (вход в кабинет, избранное,
            настройки) и можем ставить служебные cookie для работы сайта. Сторонней
            рекламной аналитики нет. Подробнее — в{" "}
            <Link
              to="/privacy"
              className="text-foreground underline underline-offset-2 hover:text-primary"
            >
              политике конфиденциальности
            </Link>
            .
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={accept}
              className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              Понятно
            </button>
            <button
              type="button"
              onClick={dismiss}
              className="h-9 px-3 rounded-md border border-border text-xs text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
