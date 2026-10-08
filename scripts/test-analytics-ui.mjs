// Execute the real React component handlers/effects in an isolated mocked DOM.
// Browser visual/navigation checks are additional, not replaced by these tests.
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import * as policy from "../lib/analytics-policy.mjs";
const require = createRequire(import.meta.url);
const { transform } = require("next/dist/build/swc");
const root = path.resolve(import.meta.dirname, "..");
let passed = 0;
async function check(name, run) { await run(); passed++; console.log("PASS", name); }
function emitter() {
  const listeners = new Map();
  return { addEventListener(type, fn) { if (!listeners.has(type)) listeners.set(type, new Set()); listeners.get(type).add(fn); }, removeEventListener(type, fn) { listeners.get(type)?.delete(fn); }, emit(type, event) { for (const fn of listeners.get(type) || []) fn(event); } };
}
async function component(filename, { consent = "accepted", response = { ok: true, id: "fixture-lead", email: { sent: true, owner: { sent: true }, customer: { sent: true } } }, ok = true } = {}) {
  let stateIndex = 0, consentValue = consent, fetched = 0, resets = 0;
  const effects = [], events = [], routes = [], frames = [], messages = [];
  const location = { origin: "https://ajspaintingtx.com", hostname: "ajspaintingtx.com", pathname: "/quote" };
  const storage = { getItem: () => consentValue ? JSON.stringify({ version: 1, choice: consentValue, at: Date.now() }) : null, setItem: (key, value) => { consentValue = JSON.parse(value).choice; } };
  const win = { ...emitter(), localStorage: storage };
  const doc = { ...emitter(), referrer: "https://www.google.com/search?q=PRIVATE", cookie: "", visibilityState: "visible", createElement() {
    const frame = { setAttribute() {}, contentWindow: { postMessage: (msg) => messages.push(msg) }, remove() { frame.removed = true; } };
    frames.push(frame); return frame;
  }, body: { appendChild() {} } };
  const hooks = { useState: (initial) => [stateIndex++ === 0 && filename === "AnalyticsConsent.js" ? consent : initial, () => {}], useRef: (value) => ({ current: value }), useEffect: (fn) => effects.push(fn) };
  const context = vm.createContext({ window: win, document: doc, location, localStorage: storage, URL, Date, setInterval: () => 1, clearInterval() {}, crypto: { randomUUID: () => "fixture-contact" }, FormData: class { constructor() {} get() { return "fixture"; } delete() {} append() {} *[Symbol.iterator]() {} }, fetch: async () => { fetched++; return { ok, status: ok ? 200 : 503, json: async () => response }; }, console });
  const mocks = {
    react: hooks, "react/jsx-runtime": { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }), Fragment: "fragment" },
    "next/link": { default: "a" }, "next/navigation": { usePathname: () => location.pathname, useRouter: () => ({ push: (url) => routes.push(url) }) },
    "../lib/analytics-client": { trackFormStart: (type) => events.push(["form_start", type]), trackLead: (...args) => events.push(["generate_lead", ...args]) },
    "../lib/analytics-policy.mjs": { ...policy, browserConsent: () => consentValue },
    "../lib/prepare-quote-photo": { prepareQuotePhoto() {} }, "../lib/quote-photos": { MAX_QUOTE_PHOTOS: 20 }, "../lib/quote-fields": { PROJECT_TYPES: [], PROJECT_SURFACES: {} }
  };
  const source = await fs.readFile(path.join(root, "components", filename), "utf8");
  const result = await transform(source, { filename, jsc: { parser: { syntax: "ecmascript", jsx: true }, transform: { react: { runtime: "automatic" } }, target: "es2022" }, module: { type: "es6" } });
  const mod = new vm.SourceTextModule(result.code, { context });
  await mod.link(async (id) => {
    const exports = mocks[id]; if (!exports) throw Error(`Unexpected import ${id}`);
    return new vm.SyntheticModule(Object.keys(exports), function () { for (const [key, value] of Object.entries(exports)) this.setExport(key, value); }, { context });
  });
  await mod.evaluate();
  const tree = mod.namespace.default({ enabled: true, test: false, slots: [] });
  function find(node, predicate) { if (!node || typeof node !== "object") return; if (predicate(node)) return node; for (const child of [node.props?.children].flat(Infinity)) { const found = find(child, predicate); if (found) return found; } }
  const cleanup = effects.map((fn) => fn()).filter((fn) => typeof fn === "function");
  return { tree, find, events, routes, frames, messages, effects, win, doc, location, cleanup, reject: () => { consentValue = "rejected"; }, fetched: () => fetched, resets: () => resets,
    submit: async () => { const form = find(tree, (node) => node.type === "form"); return form.props.onSubmit({ preventDefault() {}, currentTarget: { reset() { resets++; } } }); },
    ready: () => win.emit("message", { source: frames.at(-1)?.contentWindow, origin: location.origin, data: { type: "ajs-analytics-ready" } }) };
}
for (const filename of ["QuoteForm.js", "ContactForm.js", "ScheduleForm.js"]) {
  await check(`${filename}: failure never emits a lead`, async () => { const h = await component(filename, { ok: false, response: { error: "fixture failure" } }); await h.submit(); assert.equal(h.events.length, 0); });
  await check(`${filename}: success emits one lead only after response`, async () => { const h = await component(filename); assert.equal(h.events.length, 0); await h.submit(); assert.equal(h.events.filter((x) => x[0] === "generate_lead").length, 1); });
}
await check("contact 200 response with failed/skipped email is NOT a lead", async () => {
  for (const email of [{ sent: false }, { skipped: true }]) { const h = await component("ContactForm.js", { response: { ok: true, email } }); await h.submit(); assert.equal(h.events.length, 0); assert.equal(h.resets(), 0); }
});
await check("quote saved with delayed email counts; preserves delayed-notification page", async () => {
  const h = await component("QuoteForm.js", { response: { ok: true, id: "saved", email: { owner: { sent: false } } } }); await h.submit(); assert.equal(h.events.length, 1); assert.deepEqual(h.routes, ["/thank-you?email=delayed"]);
});
await check("rapid duplicate form submits do not double-send or double-count", async () => {
  for (const file of ["QuoteForm.js", "ContactForm.js", "ScheduleForm.js"]) { const h = await component(file); await Promise.all([h.submit(), h.submit()]); assert.equal(h.fetched(), 1); assert.equal(h.events.length, 1); }
});
await check("malformed 200 responses never clear quote/contact forms or count leads", async () => {
  for (const file of ["QuoteForm.js", "ContactForm.js", "ScheduleForm.js"]) { const h = await component(file, { response: {} }); await h.submit(); assert.equal(h.events.length, 0); assert.equal(h.resets(), 0); assert.equal(h.routes.length, 0); }
});
await check("controller does not create any frame before consent or after rejection", async () => {
  for (const consent of [null, "rejected"]) { const h = await component("AnalyticsConsent.js", { consent }); assert.equal(h.frames.length, 0); h.cleanup.forEach((fn) => fn()); }
});
await check("one view per path transition, same-route/query rerenders do not duplicate", async () => {
  const h = await component("AnalyticsConsent.js"); h.ready(); assert.equal(h.messages.length, 1);
  h.effects.at(-1)(); assert.equal(h.messages.length, 1);
  h.location.pathname = "/services"; h.effects.at(-1)(); assert.equal(h.messages.length, 2);
  h.location.pathname = "/quote"; h.effects.at(-1)(); assert.equal(h.messages.length, 3);
  h.cleanup.forEach((fn) => fn());
});
await check("form starts, successful lead IDs and clicks are deduplicated/allowlisted", async () => {
  const h = await component("AnalyticsConsent.js"); h.ready();
  const start = { detail: { name: "form_start", form_type: "quote", email: "PRIVATE" } };
  h.win.emit("ajs-business-event", start); h.win.emit("ajs-business-event", start);
  const lead = { detail: { name: "generate_lead", form_type: "quote", submissionId: "PRIVATE", serviceType: "Interior painting" } };
  h.win.emit("ajs-business-event", lead); h.win.emit("ajs-business-event", lead);
  for (const href of ["tel:PRIVATE", "mailto:PRIVATE", "/quote?email=PRIVATE"]) h.doc.emit("click", { target: { closest: () => ({ getAttribute: () => href }) } });
  assert.deepEqual(h.messages.map((x) => x.event.name), ["page_view", "form_start", "generate_lead", "phone_click", "email_click", "estimate_click"]);
  assert.ok(!JSON.stringify(h.messages).includes("PRIVATE")); h.cleanup.forEach((fn) => fn());
});
await check("private routes dispose the vendor frame; withdrawal drops queued events", async () => {
  const h = await component("AnalyticsConsent.js"); h.location.pathname = "/admin"; h.effects.at(-1)(); assert.equal(h.frames[0].removed, true); assert.equal(h.messages.length, 0);
  h.location.pathname = "/quote"; h.effects.at(-1)(); h.reject(); h.ready(); assert.equal(h.messages.length, 0);
  h.win.emit("ajs-business-event", { detail: { name: "form_start", form_type: "quote" } }); assert.equal(h.frames.at(-1).removed, true); h.cleanup.forEach((fn) => fn());
});
console.log(`${passed} UI/controller checks passed. No real browser, messages, records or provider requests.`);
