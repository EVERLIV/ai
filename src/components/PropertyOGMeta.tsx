import { useEffect } from "react";

interface Props {
  title: string;
  description: string;
  image?: string | null;
  url?: string;
  price?: number | null;
  area?: number | null;
  type?: string;
}

function setMeta(property: string, content: string) {
  const attr = property.startsWith("og:") || property.startsWith("twitter:") ? "property" : "name";
  let el = document.querySelector(`meta[${attr}="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, property);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

export default function PropertyOGMeta({ title, description, image, url, price, area, type }: Props) {
  useEffect(() => {
    const pageUrl = url || window.location.href;
    const ogImage = image || "/og-default.png";
    const priceText = price ? `${price.toLocaleString("ru-RU")} ₽` : "Цена по запросу";
    const fullDescription = `${type || "Объект"} ${area ? `${area} м²` : ""} — ${priceText}. ${description}`.slice(0, 200);

    const prevTitle = document.title;
    document.title = `${title} — АрендаСити`;

    setMeta("description", fullDescription);
    setMeta("og:title", title);
    setMeta("og:description", fullDescription);
    setMeta("og:image", ogImage);
    setMeta("og:url", pageUrl);
    setMeta("og:type", "website");
    setMeta("og:site_name", "АрендаСити");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", title);
    setMeta("twitter:description", fullDescription);
    setMeta("twitter:image", ogImage);

    return () => {
      document.title = prevTitle;
    };
  }, [title, description, image, url, price, area, type]);

  return null;
}
