import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** После перехода по ссылке всегда открывать страницу сверху, а не с прежним скроллом. */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = decodeURIComponent(hash.replace("#", ""));
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView();
      });
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}
