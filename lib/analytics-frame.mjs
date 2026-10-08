// Runs in a disposable, blank same-origin frame, NOT in the customer form document.
// Removing the frame stops vendor timers/listeners on withdrawal or private navigation.
export function analyticsFrame(config, readPreference) {
  if (window.parent === window) return;
  let stopped = false;
  window.ajsStopAnalytics = () => {
    stopped = true;
    // Google's documented disable switch also blocks automatic unload events.
    window["ga-disable-" + config.id] = true;
    window.dataLayer.length = 0;
  };
  function allowed() {
    if (stopped) return false;
    try {
      const choice = readPreference(localStorage, navigator);
      return choice === "automatic" || choice === "accepted";
    } catch { return false; }
  }
  let initialized = false;
  const seen = new Set();
  window.dataLayer = [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = gtag;
  window.addEventListener("message", (message) => {
    if (message.source !== window.parent || message.origin !== location.origin || !allowed()) return;
    const data = message.data;
    if (data?.type !== "ajs-analytics-event" || !Number.isInteger(data.sequence) || seen.has(data.sequence)) return;
    const event = data.event;
    if (!event || !["page_view", "phone_click", "email_click", "estimate_click", "form_start", "generate_lead", "user_engagement", "site_engagement"].includes(event.name)) return;
    const path = event.params?.page_path;
    if (!Object.hasOwn(config.pages, path)) return;
    // Rebuild instead of forwarding arbitrary caller-supplied parameters.
    const params = {
      page_path: path, page_title: config.pages[path] + " | AJ's Painting",
      page_location: "https://ajspaintingtx.com" + path, page_referrer: ""
    };
    if (["form_start", "generate_lead"].includes(event.name)) {
      if (!["quote", "contact", "schedule"].includes(event.params.form_type)) return;
      params.form_type = event.params.form_type;
      const service = event.params.service_type;
      params.service_type = ["interior", "exterior", "interior_exterior", "cabinets", "fence_deck", "commercial", "drywall"].includes(service) ? service : "unspecified";
    }
    if (event.name === "estimate_click") {
      if (!["/quote", "/schedule"].includes(event.params.destination)) return;
      params.destination = event.params.destination;
    }
    if (Number.isFinite(event.params.engagement_time_msec)) params.engagement_time_msec = Math.min(1800000, Math.max(1, Math.round(event.params.engagement_time_msec)));
    const knownReferrers = ["google.com", "bing.com", "duckduckgo.com", "yahoo.com", "facebook.com", "instagram.com", "nextdoor.com", "yelp.com"].map((host) => "https://" + host + "/");
    if (knownReferrers.includes(data.referrer)) params.page_referrer = data.referrer;
    if (!initialized) {
      initialized = true;
      if (!config.test) {
        gtag("consent", "default", { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
        gtag("js", new Date());
        gtag("config", config.id, {
          send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false,
          ads_data_redaction: true, url_passthrough: false, cookie_expires: 15552000,
          cookie_update: false, cookie_flags: "SameSite=Lax;Secure",
          ...(config.qa ? { debug_mode: true } : {}),
          page_location: params.page_location, page_title: params.page_title, page_referrer: params.page_referrer
        });
        const script = document.createElement("script");
        script.async = true;
        script.referrerPolicy = "no-referrer";
        script.src = "https://www.googletagmanager.com/gtag/js?id=" + config.id;
        document.head.appendChild(script);
      }
    }
    seen.add(data.sequence);
    if (config.test) {
      // Local dry-run only. No vendor script, cookies, ID, or external request.
      window.parent.postMessage({ type: "ajs-analytics-test", event: { name: event.name, params } }, location.origin);
    } else {
      // Update defaults for automatic session/engagement events too.
      gtag("set", { page_location: params.page_location, page_title: params.page_title, page_referrer: params.page_referrer });
      gtag("event", event.name, { ...params, send_to: config.id });
    }
  });
  window.parent.postMessage({ type: "ajs-analytics-ready" }, location.origin);
}
