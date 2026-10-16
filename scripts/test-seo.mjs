// Read-only checks against a running production build. No submissions or emails.
// BASE_URL=http://localhost:3011 node scripts/test-seo.mjs
import assert from "node:assert/strict";
import { paintingServices } from "../lib/painting-services.js";
import { publicPath, cleanEvent } from "../lib/analytics-policy.mjs";

const base = process.env.BASE_URL || "http://localhost:3011";
const site = "https://ajspaintingtx.com";
const paths = ["/", "/services", "/gallery", "/about", "/contact", "/quote", "/schedule", "/privacy",
  ...paintingServices.map(({ slug }) => `/services/${slug}`)];
const sitemap = await fetch(`${base}/sitemap.xml`);
assert.equal(sitemap.status, 200);
const xml = await sitemap.text();
const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => match[1]);
assert.deepEqual(urls.sort(), paths.map((path) => `${site}${path === "/" ? "" : path}`).sort());
const titles = new Set();
for (const path of paths) {
  const response = await fetch(`${base}${path}`);
  assert.equal(response.status, 200, path);
  const html = await response.text();
  assert.equal([...html.matchAll(/<h1[ >]/g)].length, 1, `${path}: one main heading`);
  const title = html.match(/<title>(.*?)<\/title>/)?.[1];
  assert.ok(title && !titles.has(title), `${path}: unique title`);
  titles.add(title);
  const canonical = html.match(/<link rel="canonical" href="([^"]+)"/g) || [];
  assert.equal(canonical.length, 1, `${path}: one canonical`);
  assert.equal(canonical[0], `<link rel="canonical" href="${site}${path === "/" ? "" : path}"`, path);
  assert.ok(/<meta name="description" content="[^"]+"/.test(html), `${path}: description`);
  assert.ok(!/<meta name="robots" content="[^"]*noindex/.test(html), `${path}: indexable`);
  const data = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].map((match) => JSON.parse(match[1]));
  const business = data.find((item) => item["@type"] === "PaintingContractor");
  assert.equal(business?.telephone, "+12542050950", `${path}: business contact`);
  assert.equal(business?.areaServed.length, 3, `${path}: known service areas`);
  assert.ok(!business.address && !business.aggregateRating, "No invented storefront or review rating");
  if (path.startsWith("/services/")) {
    assert.ok(data.some((item) => item["@graph"]?.some((entry) => entry["@type"] === "Service" && entry.url === site + path)));
    assert.equal(publicPath(path), path);
    assert.equal(publicPath(path + "?email=private@example.test"), null);
    assert.ok(!JSON.stringify(cleanEvent("page_view", path, { email: "private@example.test" })).includes("private"));
    for (const href of ["/schedule", "/quote", "/gallery"]) assert.ok(html.includes(`href="${href}"`), `${path}: ${href} linked`);
  }
  console.log("PASS", path);
}
const robots = await fetch(`${base}/robots.txt`).then((response) => response.text());
assert.ok(robots.includes(`Sitemap: ${site}/sitemap.xml`));
assert.ok(robots.includes("Allow: /"));
for (const path of ["/admin/login", "/thank-you"]) {
  const html = await fetch(`${base}${path}`).then((response) => response.text());
  assert.match(html, /<meta name="robots" content="noindex, nofollow"/);
  assert.ok(!urls.some((url) => url.endsWith(path)));
}
const missing = await fetch(`${base}/services/nonexistent-service`);
assert.equal(missing.status, 404, "Unknown services must not create duplicate landing pages");
console.log(`PASS ${paths.length} public pages, canonical URLs, structured data, sitemap, robots and excluded pages`);
