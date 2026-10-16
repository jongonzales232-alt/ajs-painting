export const SITE_URL = "https://ajspaintingtx.com";

export function pageMetadata(title, description, path) {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "en_US",
      siteName: "AJ's Painting and Contracting",
      title,
      description,
      url: path
    }
  };
}

export function jsonLd(value) {
  return JSON.stringify(value).replace(/</g, "\\u003c");
}
