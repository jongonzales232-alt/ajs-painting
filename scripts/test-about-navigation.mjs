// Local-only regression checks. No provider requests, form submissions or deployment.
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { createRequire } from "node:module";
import { SITE_LINKS } from "../lib/site-navigation.mjs";
import { cleanEvent, publicPath } from "../lib/analytics-policy.mjs";
const require = createRequire(import.meta.url);
const { transform } = require("next/dist/build/swc");
const root = path.resolve(import.meta.dirname, "..");
let passed = 0;
async function check(name, run) { await run(); passed++; console.log("PASS", name); }
function nodes(node) {
  if (!node || typeof node !== "object") return [];
  return [node, ...[node.props?.children].flat(Infinity).flatMap(nodes)];
}
function text(node) {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node !== "object") return String(node);
  return [node.props?.children].flat(Infinity).map(text).join("");
}
async function render(file, props = {}) {
  const effects = [], listeners = new Map();
  const context = vm.createContext({ document: {
    addEventListener: (type, fn) => listeners.set(type, fn),
    removeEventListener: (type) => listeners.delete(type)
  } });
  const mocks = {
    "react/jsx-runtime": { jsx: (type, props) => ({ type, props }), jsxs: (type, props) => ({ type, props }), Fragment: "fragment" },
    react: { useRef: (value) => ({ current: value }), useEffect: (fn) => effects.push(fn) },
    "next/link": { default: "a" }, "next/image": { default: "img" },
    "next/navigation": { usePathname: () => "/about" },
    "../../components/PublicLayout": { default: "layout" },
    "../lib/business": { getBusinessDetails: () => ({ phone: "(254) 205-0950", secondaryPhone: "(254) 715-8043", email: "ajspaintingcontractor@gmail.com", serviceArea: "Central Texas", insurance: { headline: "Insured" } }) },
    "../lib/site-navigation.mjs": { SITE_LINKS }, "./MobileNavigation": { default: "mobile-navigation" }
  };
  const source = await fs.readFile(path.join(root, file), "utf8");
  const compiled = await transform(source, { filename: file, jsc: { parser: { syntax: "ecmascript", jsx: true }, transform: { react: { runtime: "automatic" } }, target: "es2022" }, module: { type: "es6" } });
  const mod = new vm.SourceTextModule(compiled.code, { context });
  await mod.link(async (id) => {
    assert.ok(mocks[id], `Unexpected import: ${id}`);
    return new vm.SyntheticModule(Object.keys(mocks[id]), function () { for (const [key, value] of Object.entries(mocks[id])) this.setExport(key, value); }, { context });
  });
  await mod.evaluate();
  const tree = mod.namespace.default(props);
  return { tree, all: nodes(tree), effects, listeners, metadata: mod.namespace.metadata };
}

await check("desktop and mobile share unique public destinations, including cross-page reviews", async () => {
  assert.equal(new Set(SITE_LINKS.map((link) => link.href)).size, SITE_LINKS.length);
  assert.equal(SITE_LINKS.find((link) => link.label === "About Us").href, "/about");
  assert.equal(SITE_LINKS.find((link) => link.label === "Reviews").href, "/#reviews");
  const h = await render("components/SiteHeader.js");
  const mobile = h.all.find((node) => node.type === "mobile-navigation");
  assert.equal(mobile.props.links, SITE_LINKS);
  for (const href of ["/about", "/#reviews", "/schedule", "/quote", "/contact"]) assert.ok(h.all.some((node) => node.type === "a" && node.props.href === href));
});
await check("About copy retains owner facts, services and both estimate paths", async () => {
  const h = await render("app/about/page.js"), copy = text(h.tree);
  for (const phrase of ["founded by Felipe", "Alan and Jonathan", "rancher", "Hill County", "more than 27 years", "firefighter", "website and administrative", "drywall, texturing, tile work and remodeling"]) assert.ok(copy.includes(phrase), phrase);
  assert.equal((copy.match(/Alan/g) || []).length, 1);
  assert.equal(h.all.filter((node) => node.type === "h1").length, 1);
  assert.equal(h.all.filter((node) => node.type === "section").length, 5);
  assert.equal(h.all.filter((node) => node.type === "img").length, 0);
  for (const href of ["/quote", "/schedule"]) assert.ok(h.all.some((node) => node.type === "a" && node.props.href === href));
  assert.equal(h.metadata.title, "About Us");
  assert.ok(h.metadata.description.includes("Felipe"));
});
await check("compact footer retains About, reviews, scheduling, quote and privacy controls", async () => {
  const h = await render("components/SiteFooter.js");
  for (const href of ["/about", "/#reviews", "/schedule", "/quote", "/privacy", "tel:2542050950", "tel:2547158043"]) assert.ok(h.all.some((node) => node.type === "a" && node.props.href === href));
  assert.ok(h.all.some((node) => node.type === "button" && Object.hasOwn(node.props, "data-privacy-settings")));
});
await check("mobile menu preserves all links and Escape closes it with focus restored", async () => {
  const h = await render("components/MobileNavigation.js", { links: SITE_LINKS });
  let focused = false, prevented = false;
  h.tree.props.ref.current = { open: true };
  h.all.find((node) => node.type === "summary").props.ref.current = { focus() { focused = true; } };
  h.tree.props.onKeyDown({ key: "Escape", preventDefault() { prevented = true; } });
  assert.equal(h.tree.props.ref.current.open, false); assert.ok(focused && prevented);
  assert.equal(h.all.filter((node) => node.type === "a").length, SITE_LINKS.length + 1);
});
await check("mobile menu closes on navigation, outside click and tabbing out", async () => {
  const h = await render("components/MobileNavigation.js", { links: SITE_LINKS });
  const inside = {}, menu = { open: true, contains: (target) => target === inside };
  h.tree.props.ref.current = menu;
  const cleanup = h.effects.map((effect) => effect()).filter(Boolean);
  assert.equal(menu.open, false);
  menu.open = true;
  h.all.find((node) => node.props.className === "mobile-nav-links").props.onClick({ target: { closest: () => ({}) } });
  assert.equal(menu.open, false);
  menu.open = true; h.listeners.get("pointerdown")({ target: inside }); assert.equal(menu.open, true);
  h.listeners.get("pointerdown")({ target: {} }); assert.equal(menu.open, false);
  menu.open = true; h.tree.props.onBlur({ currentTarget: menu, relatedTarget: inside }); assert.equal(menu.open, true);
  h.tree.props.onBlur({ currentTarget: menu, relatedTarget: null }); assert.equal(menu.open, false);
  cleanup.forEach((fn) => fn()); assert.equal(h.listeners.size, 0);
});
await check("About is an analytics-safe public page using a fixed non-personal label", () => {
  assert.equal(publicPath("/about"), "/about");
  assert.equal(publicPath("/about?name=private"), null);
  const event = cleanEvent("page_view", "/about", { name: "private" });
  assert.equal(event.params.page_title, "About Us | AJ's Painting");
  assert.ok(!JSON.stringify(event).includes("private"));
});
await check("verified review links and honest review collection wording are preserved", async () => {
  const source = await fs.readFile(path.join(root, "app/page.js"), "utf8");
  assert.ok(source.includes('id="reviews"'));
  assert.ok(source.includes('id="reviews-heading">Customer Reviews'));
  assert.ok(source.includes("https://g.page/r/CYMMeygSaqn_EBM/review"));
  assert.ok(source.includes("https://www.google.com/maps/place/Aj's+Painting+and+Contracting/data=!4m2!3m1!1s0x0:0xffa96a12287b0c83"));
  assert.ok(source.includes("starting our Google review collection"));
});
await check("current experience wording is about Felipe, not an invented founding year", async () => {
  for (const file of ["app/layout.js", "app/page.js", "app/services/page.js", "components/SiteHeader.js"]) {
    const source = await fs.readFile(path.join(root, file), "utf8");
    assert.ok(!/20\+|20 years/.test(source), file);
    assert.ok(/Felipe[\s\S]{0,100}27|27[\s\S]{0,100}Felipe/.test(source), file);
  }
});
console.log(`${passed} About/navigation checks passed. No external writes.`);
