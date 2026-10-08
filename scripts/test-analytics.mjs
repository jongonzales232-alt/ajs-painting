import assert from "node:assert/strict";
import vm from "node:vm";
import { PAGES, CONSENT_KEY, CONSENT_AGE, analyticsPreference, analyticsAllowed, browserAnalyticsPreference, publicPath, cleanEvent, serviceLabel, safeReferrer, engagementClock } from "../lib/analytics-policy.mjs";
import { analyticsFrame } from "../lib/analytics-frame.mjs";
let checks = 0;
function check(name, fn) { fn(); checks++; console.log("PASS", name); }
const record = (choice, at = Date.now()) => JSON.stringify({ version: 1, choice, at });
check("new visitors use automatic analytics without a fabricated opt-in record", () => {
  let writes = 0;
  assert.equal(analyticsPreference({ getItem: () => null, setItem: () => writes++ }), "automatic");
  assert.equal(writes, 0);
  assert.equal(analyticsAllowed("automatic"), true);
  assert.equal(analyticsAllowed(undefined), false);
});
check("prior opt-outs, including old opt-outs, never expire into automatic tracking", () => {
  const now = Date.now();
  for (const at of [now, now - CONSENT_AGE * 3]) assert.equal(analyticsPreference({ getItem: () => record("rejected", at) }, {}, now), "rejected");
  assert.equal(analyticsPreference({ getItem: () => record("accepted", now) }, {}, now), "accepted");
});
check("corrupt, future-dated and blocked storage fail closed", () => {
  for (const value of ["bad", "{}", "null", record("accepted", Date.now() + 10000)]) assert.equal(analyticsPreference({ getItem: () => value }), "unavailable");
  assert.equal(analyticsPreference({ getItem() { throw Error(); } }), "unavailable");
});
check("GPC and Do Not Track override automatic and explicit analytics-on preferences", () => {
  for (const signals of [{ globalPrivacyControl: true }, { doNotTrack: "1" }, { doNotTrack: "yes" }]) {
    for (const value of [null, record("accepted")]) assert.equal(analyticsPreference({ getItem: () => value }, signals), "signal");
  }
});
check("automatic browser tracking requires writable preference storage", () => {
  const before = globalThis.window;
  try {
    globalThis.window = { localStorage: { getItem: () => null, setItem() { throw Error(); } }, navigator: {} };
    assert.equal(browserAnalyticsPreference(), "unavailable");
    const values = new Map();
    globalThis.window = { localStorage: { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) }, navigator: {} };
    assert.equal(browserAnalyticsPreference(), "automatic");
    assert.equal(values.size, 0);
  } finally { if (before === undefined) delete globalThis.window; else globalThis.window = before; }
});
check("only exact public paths; private, dynamic and query-bearing strings rejected", () => {
  for (const path of ["/admin", "/admin/login", "/api/quote", "/uploads/customer.jpg", "/quote?email=private@example.test", "/customers/Jane", "/toString"]) assert.equal(publicPath(path), null);
  for (const path of Object.keys(PAGES)) assert.equal(publicPath(path), path);
});
check("event allowlist discards personal parameters, URLs, titles and identifiers", () => {
  const event = cleanEvent("generate_lead", "/quote", { form_type: "quote", service_type: "interior", email: "sentinel@example.test", page_title: "Jane Doe", page_location: "https://example.test/?private=yes", submissionId: "secret" });
  assert.deepEqual(Object.keys(event.params).sort(), ["form_type", "page_location", "page_path", "page_title", "service_type"]);
  assert.equal(event.params.page_location, "https://ajspaintingtx.com/quote");
  assert.equal(cleanEvent("random_event", "/"), null);
  assert.equal(cleanEvent("form_start", "/quote", { form_type: "Jane" }), null);
  assert.equal(serviceLabel("Jane Doe 2545550123"), "unspecified");
});
check("referrers retain known broad sources, never raw hosts, paths or queries", () => {
  assert.equal(safeReferrer("https://www.google.com/search?q=Jane"), "https://google.com/");
  assert.equal(safeReferrer("https://customer-name.example.com/private?email=jane"), "");
  assert.equal(safeReferrer("https://google.com.evil.test/"), "");
});
function frameHarness(choice, test = false, signals = {}) {
  let listener, stored = choice === null ? null : record(choice);
  const scripts = [], messages = [];
  const parent = { postMessage: (message) => messages.push(message) };
  const win = { parent, addEventListener: (type, fn) => { if (type === "message") listener = fn; } };
  const context = vm.createContext({ window: win, navigator: signals, location: { origin: "https://ajspaintingtx.com" }, localStorage: { getItem: (key) => { assert.equal(key, CONSENT_KEY); return stored; } }, document: { createElement: () => ({}), head: { appendChild: (script) => scripts.push(script) } } });
  // ID is a unit-test fixture only, never used against a network.
  vm.runInContext(`(${analyticsFrame.toString()})(${JSON.stringify({ id: "G-UNITTEST", test, pages: PAGES })},${analyticsPreference.toString()})`, context);
  return { scripts, messages, win, reject: () => { stored = record("rejected"); }, send: (sequence, event, overrides = {}) => listener({ source: parent, origin: "https://ajspaintingtx.com", data: { type: "ajs-analytics-event", sequence, event }, ...overrides }) };
}
check("no tag or commands after rejection or while a browser privacy signal is active", () => {
  for (const [choice, signals] of [["rejected", {}], [null, { globalPrivacyControl: true }], ["accepted", { doNotTrack: "1" }]]) { const h = frameHarness(choice, false, signals); h.send(1, cleanEvent("page_view", "/")); assert.equal(h.scripts.length, 0); assert.equal(h.win.dataLayer.length, 0); }
});
check("new visitor automatically starts the actual collector logic once", () => {
  const h = frameHarness(null);
  h.send(1, cleanEvent("page_view", "/")); h.send(1, cleanEvent("page_view", "/"));
  assert.equal(h.scripts.length, 1);
  assert.equal(h.win.dataLayer.filter((c) => c[0] === "event").length, 1);
});
check("one tag and one page event despite duplicate delivery; manual pageviews and ads off", () => {
  const h = frameHarness("accepted"); const event = cleanEvent("page_view", "/quote");
  h.send(1, event); h.send(1, event);
  assert.equal(h.scripts.length, 1);
  const commands = h.win.dataLayer.map((args) => Array.from(args));
  assert.equal(commands.filter((c) => c[0] === "event").length, 1);
  const config = commands.find((c) => c[0] === "config")[2];
  assert.equal(config.send_page_view, false); assert.equal(config.allow_google_signals, false);
  assert.equal(config.allow_ad_personalization_signals, false);
  const consent = commands.find((c) => c[0] === "consent")[2];
  assert.equal(consent.ad_storage, "denied"); assert.equal(consent.ad_user_data, "denied");
});
check("withdrawal prevents subsequent frame commands, including queued events", () => {
  const h = frameHarness("accepted"); h.send(1, cleanEvent("page_view", "/"));
  const count = h.win.dataLayer.length; h.reject(); h.send(2, cleanEvent("phone_click", "/")); assert.equal(h.win.dataLayer.length, count);
});
check("synchronous disposal disables Google automatic unload events without a denial ping", () => {
  const h = frameHarness("accepted"); h.send(1, cleanEvent("page_view", "/"));
  h.win.ajsStopAnalytics(); assert.equal(h.win["ga-disable-G-UNITTEST"], true);
  h.send(2, cleanEvent("phone_click", "/")); assert.equal(h.win.dataLayer.length, 0);
});
check("forged cross-origin messages and private pages cannot initialize a tag", () => {
  const h = frameHarness("accepted");
  h.send(1, cleanEvent("page_view", "/"), { origin: "https://evil.test" });
  h.send(2, cleanEvent("page_view", "/"), { source: {} });
  h.send(3, { name: "page_view", params: { page_path: "/admin" } });
  assert.equal(h.scripts.length, 0);
});
check("frame rebuilds payload and does not relay PII, query strings or IDs", () => {
  const h = frameHarness("accepted", true);
  h.send(1, { name: "generate_lead", params: { page_path: "/quote", form_type: "quote", service_type: "Jane", page_title: "Jane", page_location: "https://example.test/?email=sentinel", fullName: "Jane", email: "sentinel" } });
  const json = JSON.stringify(h.messages);
  assert.ok(!json.includes("Jane") && !json.includes("sentinel"));
  assert.equal(h.scripts.length, 0); assert.equal(h.win.dataLayer.length, 0);
});
check("engagement clock counts foreground deltas once, not unfocused time", () => {
  const clock = engagementClock(0);
  clock.sample(true, 1000); assert.equal(clock.amount(), 0);
  clock.sample(true, 3000); assert.equal(clock.take(), 2000); assert.equal(clock.take(), 0);
  clock.sample(false, 4000); assert.equal(clock.take(), 1000);
  clock.sample(false, 30000); assert.equal(clock.amount(), 0);
  clock.sample(true, 40000); clock.sample(true, 41000); assert.equal(clock.take(), 1000);
});
check("engagement disposal drops pending time and suspended clocks are bounded", () => {
  const clock = engagementClock(0); clock.sample(true, 0); clock.sample(true, 600000);
  assert.equal(clock.amount(), 5000); clock.reset(600000); assert.equal(clock.take(), 0);
  clock.sample(false, 700000); assert.equal(clock.amount(), 0);
});
check("foreground engagement uses numeric duration and safe metadata only", () => {
  const h = frameHarness("accepted", true);
  h.send(1, cleanEvent("site_engagement", "/quote", { engagement_time_msec: 10000, email: "PRIVATE" }));
  assert.equal(h.messages.at(-1).event.params.engagement_time_msec, 10000);
  assert.ok(!JSON.stringify(h.messages).includes("PRIVATE"));
});
console.log(`${checks} analytics privacy checks passed. No network requests made.`);
