import { useEffect } from "react";
import { absoluteUrl, SITE } from "@/config/site";

export type SeoHeadProps = {
  title: string;
  description: string;
  image?: string | null;
  url?: string;
  type?: "website" | "article";
  noindex?: boolean;
};

function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(
    `link[rel="${rel}"]`,
  ) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

export default function SeoHead({
  title,
  description,
  image,
  url,
  type = "website",
  noindex = false,
}: SeoHeadProps) {
  useEffect(() => {
    const pageUrl = url || window.location.href;
    const canonical = pageUrl.split("#")[0].split("?")[0];
    const ogImage = absoluteUrl(image || SITE.ogImage);
    const fullTitle = title.includes(SITE.name)
      ? title
      : `${title} — ${SITE.name}`;
    const desc = description.slice(0, 300);

    const prevTitle = document.title;
    document.title = fullTitle;

    setMeta("name", "description", desc);
    setLink("canonical", canonical);

    setMeta("property", "og:title", title);
    setMeta("property", "og:description", desc);
    setMeta("property", "og:image", ogImage);
    setMeta("property", "og:image:secure_url", ogImage);
    setMeta("property", "og:image:alt", title);
    setMeta("property", "og:url", canonical);
    setMeta("property", "og:type", type);
    setMeta("property", "og:site_name", SITE.name);
    setMeta("property", "og:locale", SITE.locale);

    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:site", SITE.twitterSite);
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", desc);
    setMeta("name", "twitter:image", ogImage);

    if (noindex) {
      setMeta("name", "robots", "noindex, nofollow");
    } else {
      const robots = document.querySelector('meta[name="robots"]');
      if (robots) robots.remove();
    }

    return () => {
      document.title = prevTitle;
    };
  }, [title, description, image, url, type, noindex]);

  return null;
}
