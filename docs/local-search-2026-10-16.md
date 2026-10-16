# Local search improvements

The website now names Waco, Hillsboro and Whitney in its homepage heading and search metadata, and provides five service detail pages linked from the homepage or service index. Each page explains scope, preparation and estimating details for an existing service. The homepage also explains that AJ's Painting travels to customers and prefers an on-site estimate.

The owner confirmed June 2004 as the opening month and year, that customers do not visit a storefront, and that the primary business number can receive texts. The established website and Business Profile supplied the business contacts, services and service areas. No street address, customer reviews or ratings were invented.

Technical changes include self-referencing canonicals, a public sitemap, robots.txt, business/service/breadcrumb structured data, and noindex metadata for admin and confirmation pages. Service pages are generated statically; analytics accepts only the five additional exact public paths. Existing image handling, customer data, inquiry APIs and booking logic are unchanged.

Validation completed before publication:

- Next.js 15.5.19 production build and ESLint passed.
- Eight existing About/navigation checks and 18 analytics privacy checks passed.
- `node scripts/test-seo.mjs` passed against a local production server: 13 public URLs, distinct titles, one H1 per page, descriptions, canonicals, structured data, sitemap and robots; admin/thank-you excluded; an unknown service returns 404.
- Chrome desktop (1280px) and mobile (390px) checks verified heading wrapping, no horizontal overflow, service navigation and the estimate link.
- Local testing used a new empty SQLite database, with analytics disabled and no customer submissions or messages.

To repeat the read-only route check, start the production build and set `BASE_URL` to its origin before running `node scripts/test-seo.mjs`. Default: `http://localhost:3011`.

Indexing and rankings remain Google's decision. The sitemap makes the public URLs discoverable but is not a guarantee of inclusion or ranking. Business structured data represents a service-area business without inventing an address; it does not claim eligibility for Google's address-dependent LocalBusiness rich result.
