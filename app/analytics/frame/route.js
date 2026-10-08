import { analyticsConfig } from "../../../lib/analytics-config";
import { analyticsFrame } from "../../../lib/analytics-frame.mjs";
import { PAGES } from "../../../lib/analytics-policy.mjs";
import { isAdmin } from "../../../lib/auth";

export const dynamic = "force-dynamic";
export async function GET(request) {
  const config = analyticsConfig();
  const url = new URL(request.url);
  const hostAllowed = config.test || config.qa ? ["localhost", "127.0.0.1"].includes(url.hostname) : ["ajspaintingtx.com", "www.ajspaintingtx.com"].includes(url.hostname);
  if ((!config.enabled && !config.test) || !hostAllowed || url.search || await isAdmin()) return new Response(null, { status: 404 });
  const code = `(${analyticsFrame.toString()})(${JSON.stringify({ id: config.id, test: config.test, qa: config.qa, pages: PAGES })})`;
  return new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="referrer" content="no-referrer"><title>AJ's Painting analytics</title></head><body><script>${code}</script></body></html>`, {
    headers: {
      "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer", "X-Robots-Tag": "noindex, nofollow", "X-Frame-Options": "SAMEORIGIN",
      "Content-Security-Policy": "default-src 'none'; script-src 'unsafe-inline' https://www.googletagmanager.com; connect-src https://*.google-analytics.com https://analytics.google.com; img-src https://*.google-analytics.com; frame-ancestors 'self'; base-uri 'none'; form-action 'none'"
    }
  });
}
