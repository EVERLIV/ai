import { useEffect } from "react";
import { absoluteUrl, SITE_URL } from "@/config/site";
import {
  buildPropertySeoDescription,
  buildPropertySeoTitle,
} from "@/lib/seo/propertySeoTitle";

type Props = {
  id: string;
  deal_type?: string | null;
  type?: string | null;
  extras?: Record<string, unknown> | null;
  address?: string | null;
  district?: string | null;
  price?: number | null;
  area?: number | null;
  description?: string | null;
  coverPhoto?: string | null;
  photos?: string[];
  segment?: "commercial" | "residential" | "land";
};

export default function PropertyJsonLd({
  id,
  deal_type,
  type,
  extras,
  address,
  district,
  price,
  area,
  description,
  coverPhoto,
  photos,
  segment = "commercial",
}: Props) {
  useEffect(() => {
    const p = {
      deal_type,
      type,
      extras,
      address,
      district,
      price,
      area,
      description,
    };
    const title = buildPropertySeoTitle(p);
    const desc = buildPropertySeoDescription(p);
    const image = photos?.[0] || coverPhoto || undefined;
    const priceNum = Number(price) || 0;
    const url = `${SITE_URL}/property/${id}`;
    const primaryType = type || "Офис";
    const catalogPath =
      segment === "land"
        ? "/zemlya/catalog"
        : segment === "residential"
          ? "/zhilaya/catalog"
          : "/catalog";
    const catalogUrl = absoluteUrl(catalogPath);
    const catalogName =
      segment === "land"
        ? "Каталог земли"
        : segment === "residential"
          ? "Каталог жилья"
          : "Каталог";

    const data = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "RealEstateListing",
          name: title,
          description: desc,
          url,
          ...(image ? { image: absoluteUrl(image) } : {}),
          address: {
            "@type": "PostalAddress",
            streetAddress: address || "",
            addressLocality: district || "Иркутск",
            addressRegion: "Иркутская область",
            addressCountry: "RU",
          },
          ...(Number(area) > 0
            ? {
                floorSize: {
                  "@type": "QuantitativeValue",
                  value: area,
                  unitCode: "MTK",
                },
              }
            : {}),
          ...(priceNum > 0
            ? {
                offers: {
                  "@type": "Offer",
                  price: priceNum,
                  priceCurrency: "RUB",
                  availability: "https://schema.org/InStock",
                },
              }
            : {}),
          category: primaryType,
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Главная",
              item: SITE_URL,
            },
            {
              "@type": "ListItem",
              position: 2,
              name: catalogName,
              item: catalogUrl,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: title,
              item: url,
            },
          ],
        },
      ],
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "property-jsonld";
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [
    id,
    deal_type,
    type,
    extras,
    address,
    district,
    price,
    area,
    description,
    coverPhoto,
    photos,
    segment,
  ]);

  return null;
}
