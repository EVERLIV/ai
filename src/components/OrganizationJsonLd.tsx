import { useEffect } from "react";
import { COMPANY, CONTACTS } from "@/config/company";
import { SITE, SITE_URL } from "@/config/site";

export default function OrganizationJsonLd() {
  useEffect(() => {
    const data = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "RealEstateAgent",
          "@id": `${SITE_URL}/#organization`,
          name: COMPANY.brand,
          legalName: COMPANY.legalName,
          url: SITE_URL,
          logo: SITE.ogImage,
          ...(CONTACTS.phoneTel ? { telephone: CONTACTS.phoneTel } : {}),
          email: CONTACTS.email,
          address: {
            "@type": "PostalAddress",
            streetAddress: COMPANY.officeAddress,
            addressLocality: COMPANY.city,
            addressRegion: "Иркутская область",
            addressCountry: "RU",
          },
          areaServed: {
            "@type": "AdministrativeArea",
            name: "Иркутская область",
          },
        },
        {
          "@type": "WebSite",
          "@id": `${SITE_URL}/#website`,
          name: SITE.name,
          url: SITE_URL,
          publisher: { "@id": `${SITE_URL}/#organization` },
          inLanguage: "ru-RU",
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: `${SITE_URL}/catalog?q={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
          },
        },
      ],
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "org-jsonld";
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);

    return () => {
      script.remove();
    };
  }, []);

  return null;
}
