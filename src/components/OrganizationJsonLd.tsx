import { useEffect } from "react";
import { COMPANY, CONTACTS } from "@/config/company";
import { SITE, SITE_URL } from "@/config/site";

export default function OrganizationJsonLd() {
  useEffect(() => {
    const data = {
      "@context": "https://schema.org",
      "@type": "RealEstateAgent",
      name: COMPANY.brand,
      legalName: COMPANY.legalName,
      url: SITE_URL,
      logo: SITE.ogImage,
      telephone: CONTACTS.phoneTel,
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
