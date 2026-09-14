// Read-only fixtures: real slot generation and route logic; no customer DB or mail.
// node --experimental-vm-modules scripts/test-scheduling.mjs
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const now = new Date("2026-09-14T12:00:00Z");
class Clock extends Date { constructor(...args) { super(...(args.length ? args : [now])); } static now() { return now.getTime(); } }
let rows = [], blocked = [], emails = [], failEmail = false, conflict = false, limited = false;
const slots = [{ weekday: 1, startTime: "09:00", endTime: "10:00", active: true }, { weekday: 1, startTime: "09:30", endTime: "10:30", active: true }];
const db = {
  availabilitySlot: { findMany: async () => slots }, blockedDay: { findMany: async () => blocked },
  appointment: {
    findMany: async () => rows,
    create: async ({ data }) => { if (conflict) throw Object.assign(new Error("Conflict"), { code: "P2034" }); const row = { ...data, id: `test-${rows.length}` }; rows.push(row); return row; }
  },
  $transaction: async (fn) => fn(db)
};
const context = vm.createContext({ Date: Clock, Request, Response, Buffer, console: { error() {}, log() {} }, process: { env: { BUSINESS_TIME_ZONE: "America/Chicago" } } });
const cache = new Map();
async function load(id) {
  id = id.replaceAll("\\", "/");
  if (cache.has(id)) return cache.get(id);
  let exports;
  if (id === "next/server") exports = { NextResponse: { json: (data, options) => Response.json(data, options) } };
  if (id.endsWith("/lib/prisma.js")) exports = { prisma: db };
  if (id.endsWith("/lib/rate-limit.js")) exports = { checkRateLimit: async () => ({ limited, message: "Wait", retryAfter: 60 }) };
  if (id.endsWith("/lib/email.js")) exports = { ownerEmail: () => "owner@example.test", sendEmail: async (message) => { emails.push(message); if (failEmail === "throw") throw new Error("Mail down"); return { sent: !failEmail }; } };
  const mod = exports ? new vm.SyntheticModule(Object.keys(exports), function () { for (const [key, value] of Object.entries(exports)) this.setExport(key, value); }, { context, identifier: id }) : new vm.SourceTextModule(await fs.readFile(id, "utf8"), { context, identifier: id });
  cache.set(id, mod);
  await mod.link((specifier, parent) => load(specifier.startsWith(".") ? path.resolve(path.dirname(parent.identifier), `${specifier}.js`) : specifier));
  return mod;
}
const route = await load(path.join(root, "app/api/schedule/route.js")); await route.evaluate();
const slotModule = cache.get(path.join(root, "lib/slots.js").replaceAll("\\", "/")).namespace;
const time = cache.get(path.join(root, "lib/time.js").replaceAll("\\", "/")).namespace;
const make = (options = {}) => slotModule.buildAvailableSlots({ slots, blockedDays: [], appointments: [], now, days: 0, ...options });
let count = 0;
async function check(label, fn) { rows = []; blocked = []; emails = []; failEmail = false; conflict = false; limited = false; await fn(); console.log("PASS", label); count++; }
async function post(overrides = {}) {
  const data = { slot: "2026-09-14T14:00:00.000Z|2026-09-14T15:00:00.000Z", fullName: "Test Customer", phone: "2545550123", email: "test@example.test", address: "123 Test Road, Waco", notes: "Test only", ...overrides };
  const response = await route.namespace.POST(new Request("http://localhost/api/schedule", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) }));
  return { status: response.status, body: await response.json() };
}
await check("9 AM Central remains 9 AM on a UTC server", () => { assert.equal(make()[0].startsAt, "2026-09-14T14:00:00.000Z"); assert.match(make()[0].label, /9:00 AM CDT/); });
await check("winter, summer and DST transition conversions", () => {
  for (const [day, utc] of [["2026-01-05", "15"], ["2026-07-06", "14"], ["2026-03-08", "14"], ["2026-11-01", "15"]]) assert.equal(time.businessDateTime(day, "09:00").toISOString(), `${day}T${utc}:00:00.000Z`);
  assert.equal(time.businessDateTime("2026-03-08", "02:30"), null);
});
await check("Central calendar day is used across UTC midnight", () => { assert.equal(time.businessDateKey(new Date("2026-09-15T02:00:00Z")), "2026-09-14"); });
await check("today's blocked day removes all today's appointments", () => { assert.equal(make({ blockedDays: [{ date: "2026-09-14T00:00:00Z" }] }).length, 0); });
await check("overlaps excluded, adjacent visits allowed", () => {
  assert.equal(make({ appointments: [{ startsAt: "2026-09-14T14:15:00Z", endsAt: "2026-09-14T14:45:00Z" }] }).length, 0);
  assert.equal(make({ appointments: [{ startsAt: "2026-09-14T13:00:00Z", endsAt: "2026-09-14T14:00:00Z" }] }).length, 2);
});
await check("invalid ranges, inactive and past times are excluded", () => {
  assert.equal(time.isValidTimeRange("09:99", "10:00"), false);
  assert.equal(time.isValidTimeRange("24:00", "25:00"), false);
  assert.equal(make({ now: new Date("2026-09-14T16:00:00Z") }).length, 0);
  assert.equal(make({ slots: [{ ...slots[0], active: false }] }).length, 0);
});
await check("duplicate starts collapse and dates are ordered", () => { assert.equal(make({ slots: [...slots, slots[0]] }).length, 2); });
await check("booking persists and both messages/calendar use correct instant", async () => {
  const result = await post(); assert.equal(result.status, 200); assert.equal(rows.length, 1); assert.equal(emails.length, 2);
  assert.match(result.body.when, /9:00 AM CDT/); assert.match(emails[1].text, /123 Test Road/);
  assert.match(emails[1].attachments[0].content, /DTSTART:20260914T140000Z/);
});
await check("duplicate and overlapping bookings rejected", async () => {
  assert.equal((await post()).status, 200);
  assert.equal((await post()).status, 409);
  assert.equal((await post({ slot: "2026-09-14T14:30:00.000Z|2026-09-14T15:30:00.000Z" })).status, 409);
  assert.equal(rows.length, 1);
});
await check("forged or stale times rejected without saving", async () => {
  assert.equal((await post({ slot: "2026-09-14T09:00:00Z|2026-09-14T10:00:00Z" })).status, 400);
  assert.equal((await post({ slot: "2026-09-14T18:00:00Z|2026-09-14T19:00:00Z" })).status, 409);
  assert.equal(rows.length, 0);
});
await check("database concurrency conflict returns refreshable 409", async () => { conflict = true; assert.equal((await post()).status, 409); assert.equal(emails.length, 0); });
await check("email failure retains booking and does not invite duplicate submission", async () => { failEmail = true; const result = await post(); assert.equal(result.status, 200); assert.equal(result.body.email.customer.sent, false); assert.equal(rows.length, 1); });
await check("unexpected post-save failure still reports saved appointment", async () => { failEmail = "throw"; const result = await post(); assert.equal(result.status, 200); assert.equal(rows.length, 1); });
await check("rate limits and invalid contacts", async () => { assert.equal((await post({ phone: "abc" })).status, 400); limited = true; assert.equal((await post()).status, 429); assert.equal(rows.length, 0); });
await check("availability refresh is uncached and excludes booked intervals", async () => { await post(); const response = await route.namespace.GET(); assert.equal(response.headers.get("cache-control"), "no-store"); const result = await response.json(); assert.ok(!result.slots.some((slot) => slot.date === "2026-09-14")); });
console.log(`${count} scheduling checks passed; server TZ=${process.env.TZ || "system default"}. No real bookings or emails.`);
