// Only these public routes and fixed labels may leave the site.
export const PAGES = Object.freeze({
  "/": "Home", "/services": "Services", "/gallery": "Gallery",
  "/quote": "Request a quote", "/contact": "Contact", "/schedule": "Schedule an estimate",
  "/thank-you": "Thank you", "/privacy": "Privacy"
});
export const CONSENT_KEY = "ajs.analytics-consent.v1";
export const CONSENT_AGE = 180 * 24 * 60 * 60 * 1000;
export function browserConsent() {
  try { return readConsent(window.localStorage); } catch { return null; }
}
export function readConsent(storage, now = Date.now()) {
  try {
    const record = JSON.parse(storage.getItem(CONSENT_KEY));
    return record?.version === 1 && ["accepted", "rejected"].includes(record.choice) &&
      Number.isFinite(record.at) && record.at <= now && now - record.at < CONSENT_AGE ? record.choice : null;
  } catch { return null; }
}
export function publicPath(path) { return Object.hasOwn(PAGES, path) ? path : null; }
const SERVICES = {
  "Interior painting": "interior", "Exterior painting": "exterior",
  "Interior and exterior painting": "interior_exterior", "Cabinet painting": "cabinets",
  "Fence or deck": "fence_deck", "Commercial painting": "commercial",
  "Drywall patching and prep": "drywall", "Not sure yet": "unspecified"
};
export function serviceLabel(value) { return Object.hasOwn(SERVICES, value) ? SERVICES[value] : "unspecified"; }
// Even referring hosts can contain private tenant/user labels. Retain only known sources.
export function safeReferrer(value) {
  try {
    const host = new URL(value).hostname;
    for (const domain of ["google.com", "bing.com", "duckduckgo.com", "yahoo.com", "facebook.com", "instagram.com", "nextdoor.com", "yelp.com"]) {
      if (host === domain || host.endsWith(`.${domain}`)) return `https://${domain}/`;
    }
  } catch { /* Unknown/direct referral: no raw URL leaves the browser. */ }
  return "";
}
export function cleanEvent(name, path, input = {}) {
  if (!publicPath(path)) return null;
  const params = { page_path: path, page_title: `${PAGES[path]} | AJ's Painting`, page_location: `https://ajspaintingtx.com${path}` };
  if (["form_start", "generate_lead"].includes(name)) {
    if (!["quote", "contact", "schedule"].includes(input.form_type)) return null;
    params.form_type = input.form_type;
    params.service_type = Object.values(SERVICES).includes(input.service_type) ? input.service_type : "unspecified";
  } else if (name === "estimate_click") {
    if (!["/quote", "/schedule"].includes(input.destination)) return null;
    params.destination = input.destination;
  } else if (!["page_view", "phone_click", "email_click", "user_engagement", "site_engagement"].includes(name)) return null;
  if (Number.isFinite(input.engagement_time_msec)) params.engagement_time_msec = Math.min(1800000, Math.max(1, Math.round(input.engagement_time_msec)));
  return { name, params };
}

// Measured foreground time; never an unconditional keep-alive ping.
export function engagementClock(now) {
  let previous = now, active = false, elapsed = 0;
  return {
    sample(eligible, time) { if (active) elapsed += Math.min(5000, Math.max(0, time - previous)); previous = time; active = eligible; },
    take() { const value = elapsed; elapsed = 0; return value; },
    amount() { return elapsed; },
    reset(time) { previous = time; active = false; elapsed = 0; }
  };
}
