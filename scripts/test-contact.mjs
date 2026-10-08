import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
const root = path.resolve(import.meta.dirname, "..");
let sent = { sent: true }, limited = false;
const context = vm.createContext({ Request, Response, console });
const mocks = {
  "next/server": { NextResponse: { json: (body, options) => Response.json(body, options) } },
  "../../../lib/email": { ownerEmail: () => "owner@example.test", sendEmail: async () => sent },
  "../../../lib/rate-limit": { checkRateLimit: async () => ({ limited, message: "Wait", retryAfter: 60 }) }
};
const cache = new Map();
async function load(id) {
  if (cache.has(id)) return cache.get(id);
  const exports = mocks[id];
  const mod = exports ? new vm.SyntheticModule(Object.keys(exports), function () { for (const [key, value] of Object.entries(exports)) this.setExport(key, value); }, { context }) : new vm.SourceTextModule(await fs.readFile(id, "utf8"), { context, identifier: id });
  cache.set(id, mod);
  await mod.link((specifier, parent) => load(mocks[specifier] ? specifier : path.resolve(path.dirname(parent.identifier), specifier) + ".js"));
  return mod;
}
const route = await load(path.join(root, "app/api/contact/route.js")); await route.evaluate();
async function submit() { return route.namespace.POST(new Request("http://localhost/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: "Local Test", email: "test@example.test", phone: "2545550123", message: "Test only" }) })); }
assert.equal((await submit()).status, 200);
sent = { sent: false }; assert.equal((await submit()).status, 503);
sent = { skipped: true }; assert.equal((await submit()).status, 503);
limited = true; assert.equal((await submit()).status, 429);
console.log("4 contact API checks passed: accepted, failed, skipped and rate-limited. No messages sent.");
