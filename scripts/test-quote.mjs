// Runs the real quote route, upload storage, and email serialization without
// sending messages or connecting to a customer database.
// node --experimental-vm-modules scripts/test-quote.mjs
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const uploadRoot = await fs.mkdtemp(path.join(os.tmpdir(), "ajs-quote-test-"));
const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jR1EAAAAASUVORK5CYII=", "base64");
const fields = { fullName: "Quote Test <&>", phone: "(254) 555-0123", email: "quote@example.test", address: "123 Test Road", projectType: "Interior painting", surface: "BOTH", projectSize: "3 rooms, 1200 sq ft", preferredStartDate: "2026-10-12", description: "Paint walls & trim.\n" + "Detailed scope. ".repeat(200), consent: "on" };
let created, emails, notes, failEmail, failDatabase, limited;
function reset() { created = []; emails = []; notes = []; failEmail = false; failDatabase = false; limited = false; }
reset();
const db = {
  lead: { create: async ({ data }) => {
    if (failDatabase) throw new Error("Simulated database outage");
    const lead = { ...data, id: "test-quote-123", createdAt: new Date() };
    created.push(lead);
    return lead;
  } },
  followUpNote: { create: async ({ data }) => notes.push(data) }
};
const context = vm.createContext({
  Buffer, FormData, File, Request, Response, URL, Date,
  console: { log() {}, error() {} },
  process: { env: { PRIVATE_UPLOAD_ROOT: uploadRoot, RESEND_API_KEY: "mock-only", EMAIL_FROM: "test@example.test" }, cwd: () => root },
  fetch: async (url, options) => {
    assert.equal(url, "https://api.resend.com/emails");
    emails.push(JSON.parse(options.body));
    return { ok: !failEmail, status: failEmail ? 503 : 200 };
  }
});
const cache = new Map();
async function synthetic(id, exports) {
  const mod = new vm.SyntheticModule(Object.keys(exports), function () {
    for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
  }, { context, identifier: id });
  return mod;
}
async function load(id) {
  id = id.replaceAll("\\", "/");
  if (cache.has(id)) return cache.get(id);
  let mod;
  if (id === "next/server") mod = await synthetic(id, { NextResponse: { json: (body, options) => Response.json(body, options) } });
  else if (id.endsWith("/lib/prisma.js")) mod = await synthetic(id, { prisma: db });
  else if (id.endsWith("/lib/rate-limit.js")) mod = await synthetic(id, { checkRateLimit: async () => ({ limited, message: "Wait a minute.", retryAfter: 60 }) });
  else if (!path.isAbsolute(id)) mod = await synthetic(id, await import(id));
  else mod = new vm.SourceTextModule(await fs.readFile(id, "utf8"), { context, identifier: id });
  cache.set(id, mod);
  await mod.link((specifier, parent) => load(specifier.startsWith(".") ? path.resolve(path.dirname(parent.identifier), specifier) + (path.extname(specifier) ? "" : ".js") : specifier));
  return mod;
}
const route = await load(path.join(root, "app/api/quote/route.js").replaceAll("\\", "/"));
await route.evaluate();
async function submit(overrides = {}, files = [], headers = {}) {
  const form = new FormData();
  for (const [key, value] of Object.entries({ ...fields, ...overrides })) if (value !== null) form.set(key, value);
  for (const file of files) form.append("photos", file);
  const response = await route.namespace.POST(new Request("http://localhost/api/quote", { method: "POST", body: form, headers }));
  return { status: response.status, body: await response.json() };
}
const photo = (name = "test.png") => new File([png], name, { type: "image/png" });
let checks = 0;
async function check(name, fn) { reset(); await fn(); checks++; console.log("PASS", name); }
try {
  await check("20 photos are stored and actually attached; every field preserved in both email formats", async () => {
    const result = await submit({}, Array.from({ length: 20 }, (_, i) => photo(`photo-${i}.png`)));
    assert.equal(result.status, 200, JSON.stringify(result.body));
    assert.equal(created.length, 1);
    assert.equal(created[0].photos.create.length, 20);
    assert.equal(emails[0].attachments.length, 20);
    assert.equal(emails[0].reply_to, fields.email);
    assert.equal(emails[0].to[0], "ajspaintingcontractor@gmail.com");
    for (const attachment of emails[0].attachments) assert.deepEqual(Buffer.from(attachment.content, "base64"), png);
    for (const email of emails) {
      for (const value of [fields.projectSize, fields.preferredStartDate, "Both", "Agreed", fields.description]) assert.ok(email.text.replaceAll("\r\n", "\n").includes(value.trim()));
      assert.ok(email.html.includes("Quote Test &lt;&amp;&gt;"));
      assert.ok(!email.html.includes("Quote Test <&>"));
      assert.ok(email.html.includes("2026-10-12"));
    }
  });
  await check("quote without photos or preferred date", async () => {
    assert.equal((await submit({ preferredStartDate: "" })).status, 200);
    assert.equal(emails[0].attachments.length, 0);
    assert.ok(emails[0].text.includes("Not specified"));
  });
  await check("reject excessive photo count before saving", async () => {
    assert.equal((await submit({}, Array.from({ length: 21 }, () => photo()))).status, 400);
    assert.equal(created.length, 0); assert.equal(emails.length, 0);
  });
  await check("reject oversized photo", async () => {
    assert.equal((await submit({}, [new File([Buffer.alloc(750 * 1024 + 1)], "big.jpg")])).status, 400);
    assert.equal(created.length, 0);
  });
  await check("invalid second photo cleans first upload and creates no partial quote", async () => {
    const before = await fs.readdir(path.join(uploadRoot, "lead-photos"));
    assert.equal((await submit({}, [photo(), new File(["not an image"], "fake.jpg")])).status, 400);
    assert.deepEqual(await fs.readdir(path.join(uploadRoot, "lead-photos")), before);
    assert.equal(created.length, 0); assert.equal(emails.length, 0);
  });
  await check("missing consent", async () => {
    assert.equal((await submit({ consent: null })).status, 400); assert.equal(created.length, 0);
  });
  await check("invalid phone and email", async () => {
    assert.equal((await submit({ phone: "abc" })).status, 400);
    assert.equal((await submit({ email: "bad email" })).status, 400);
  });
  await check("oversized text rejected instead of silently truncated", async () => {
    assert.equal((await submit({ description: "x".repeat(10001) })).status, 400);
    assert.equal((await submit({ fullName: "x".repeat(121) })).status, 400);
    assert.equal(created.length, 0);
  });
  await check("invalid calendar date rejected", async () => {
    assert.equal((await submit({ preferredStartDate: "2026-02-30" })).status, 400);
    assert.equal(created.length, 0);
  });
  await check("database failure cleans uploads and does not email", async () => {
    failDatabase = true;
    const before = await fs.readdir(path.join(uploadRoot, "lead-photos"));
    assert.equal((await submit({}, [photo()])).status, 500);
    assert.deepEqual(await fs.readdir(path.join(uploadRoot, "lead-photos")), before);
    assert.equal(emails.length, 0);
  });
  await check("email failure retains full quote and photos, exposes status, and records admin note", async () => {
    failEmail = true;
    const result = await submit({}, [photo()]);
    assert.equal(result.status, 200);
    assert.equal(result.body.email.owner.sent, false);
    assert.equal(created.length, 1); assert.equal(notes.length, 1);
    assert.ok(notes[0].note.includes("owner not sent"));
  });
  await check("rate limit", async () => {
    limited = true;
    assert.equal((await submit()).status, 429); assert.equal(created.length, 0);
  });
  await check("oversized request returns useful 413", async () => {
    assert.equal((await submit({}, [], { "content-length": String(20 * 1024 * 1024) })).status, 413);
  });
  console.log(`${checks} quote regression checks passed. No real emails sent.`);
} finally {
  await fs.rm(uploadRoot, { recursive: true, force: true });
}


