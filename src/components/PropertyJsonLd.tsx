import { useEffect } from "react";
import { absoluteUrl, SITE_URL } from "@/config/site";
import { buildPropertySeoDescription, buildPropertySeoTitle } from "@/lib/seo/propertySeoTitle";

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
}: Props) {
  useEffect(() => {
    const p = { deal_type, type, extras, address, district, price, area, description };
    const title = buildPropertySeoTitle(p);
    const desc = buildPropertySeoDescription(p);
    const image = photos?.[0] || coverPhoto || undefined;
    const priceNum = Number(price) || 0;
    const url = `${SITE_URL}/property/${id}`;
    const primaryType = type || "Офис";

    const data = {
      "@context": "https://schema.org",
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
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "property-jsonld";
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, [id, deal_type, type, extras, address, district, price, area, description, coverPhoto, photos]);

  return null;
}
