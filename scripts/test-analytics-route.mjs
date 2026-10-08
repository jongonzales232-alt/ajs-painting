import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { analyticsFrame } from "../lib/analytics-frame.mjs";
import { PAGES, analyticsPreference } from "../lib/analytics-policy.mjs";

const source = fs.readFileSync(new URL("../app/analytics/frame/route.js", import.meta.url), "utf8")
  .replace(/^import .*;\r?$/gm, "").replace(/^export /gm, "");
let config = { enabled: true, test: false, qa: false, id: "G-UNITTEST" };
let admin = false;
const context = vm.createContext({
  URL, Response, analyticsFrame, analyticsPreference, PAGES,
  analyticsConfig: () => config, isAdmin: async () => admin
});
vm.runInContext(source, context);
let checks = 0;
async function check(name, fn) { await fn(); checks++; console.log("PASS", name); }
const request = (host = "ajspaintingtx.com", path = "/analytics/frame", extraHeaders = {}) =>
  new Request("http://0.0.0.0:10000" + path, { headers: { host, ...extraHeaders } });

await check("Render bind-address URL accepts the exact public Host", async () => {
  const response = await context.GET(request());
  assert.equal(response.status, 200);
  assert.match(await response.text(), /G-UNITTEST/);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.equal(response.headers.get("Referrer-Policy"), "no-referrer");
  assert.equal(response.headers.get("X-Frame-Options"), "SAMEORIGIN");
});
await check("www, case normalization and explicit HTTPS port work", async () => {
  for (const host of ["www.ajspaintingtx.com", "AJSPAINTINGTX.COM", "ajspaintingtx.com:443"])
    assert.equal((await context.GET(request(host))).status, 200);
});
await check("preview hosts cannot enable the production collector", async () => {
  assert.equal((await context.GET(request("ajs-painting.onrender.com"))).status, 404);
});
await check("spoofed forwarded-host cannot override the incoming Host", async () => {
  assert.equal((await context.GET(request("preview.example", "/analytics/frame", { "x-forwarded-host": "ajspaintingtx.com" }))).status, 404);
});
await check("malformed authorities and suffix domains fail closed", async () => {
  for (const host of ["ajspaintingtx.com.evil.test", "ajspaintingtx.com,evil.test", "ajspaintingtx.com@evil.test", "ajspaintingtx.com:3000"])
    assert.equal((await context.GET(request(host))).status, 404);
});
await check("production collector is blocked on loopback and bind address", async () => {
  for (const host of ["localhost:3000", "127.0.0.1:3000", "0.0.0.0:10000"])
    assert.equal((await context.GET(request(host))).status, 404);
});
await check("query-bearing requests are excluded", async () => {
  assert.equal((await context.GET(request("ajspaintingtx.com", "/analytics/frame?email=synthetic@example.test"))).status, 404);
});
await check("GPC and Do Not Track headers block the collector", async () => {
  for (const header of ["sec-gpc", "dnt"])
    assert.equal((await context.GET(request("ajspaintingtx.com", "/analytics/frame", { [header]: "1" }))).status, 404);
});
await check("signed-in administrators are excluded", async () => {
  admin = true;
  assert.equal((await context.GET(request())).status, 404);
  admin = false;
});
await check("disabled production setting fails closed", async () => {
  config = { ...config, enabled: false };
  assert.equal((await context.GET(request())).status, 404);
});
await check("QA permits only loopback, never the production domain", async () => {
  config = { ...config, enabled: true, qa: true };
  assert.equal((await context.GET(request("localhost:3101"))).status, 200);
  assert.equal((await context.GET(request("127.0.0.1:3101"))).status, 200);
  assert.equal((await context.GET(request())).status, 404);
});
console.log(`${checks} analytics route checks passed. No network requests made.`);
