import { getBusinessDetails } from "../lib/business";
import { jsonLd, SITE_URL } from "../lib/seo";

export default function BusinessStructuredData() {
  const { phone, email } = getBusinessDetails();
  const business = {
    "@context": "https://schema.org",
    "@type": "PaintingContractor",
    "@id": `${SITE_URL}/#business`,
    name: "AJ's Painting and Contracting",
    alternateName: "AJ's Painting",
    url: SITE_URL,
    telephone: `+1${phone.replace(/\D/g, "")}`,
    email,
    logo: `${SITE_URL}/brand/ajs-painting-logo-v3.png`,
    description: "Family-owned residential and commercial painting serving Waco, Hillsboro and Whitney, Texas. We travel to customers for estimates and project work.",
    areaServed: ["Waco", "Hillsboro", "Whitney"].map((name) => ({ "@type": "City", name: `${name}, Texas` })),
    sameAs: [
      "https://www.facebook.com/ajspaintingcontractor",
      "https://www.instagram.com/ajs.painting"
    ]
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(business) }} />;
}
