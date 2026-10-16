import { paintingServices } from "../lib/painting-services";
import { SITE_URL } from "../lib/seo";

export default function sitemap() {
  // Only public landing pages; no admin, customer uploads or submission results.
  return ["", "/services", "/gallery", "/about", "/contact", "/quote", "/schedule", "/privacy",
    ...paintingServices.map(({ slug }) => `/services/${slug}`)
  ].map((path) => ({ url: `${SITE_URL}${path}` }));
}
