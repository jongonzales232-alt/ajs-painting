// Local component/config regression tests; no network or customer data.
// node --experimental-vm-modules scripts/test-gallery-images.mjs
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import vm from "node:vm";
import { createRequire } from "node:module";
import * as publicImagePaths from "../lib/public-image-paths.mjs";
const require = createRequire(import.meta.url);
const { transform } = require("next/dist/build/swc");
const { hasLocalMatch } = require("next/dist/shared/lib/match-local-pattern");
const config = require("../next.config.js");
let failed = false;
const context = vm.createContext({});
const mocks = {
  react: { useState: () => [failed, (value) => { failed = value; }] },
  "next/image": { default: "img" },
  "../lib/public-image-paths.mjs": publicImagePaths,
  "react/jsx-runtime": { jsx: (type, props, key) => ({ type, props, key }) }
};
const source = await fs.readFile(new URL("../components/SafeImage.js", import.meta.url), "utf8");
const compiled = await transform(source, { filename: "SafeImage.js", jsc: { parser: { syntax: "ecmascript", jsx: true }, transform: { react: { runtime: "automatic" } }, target: "es2022" }, module: { type: "es6" } });
const mod = new vm.SourceTextModule(compiled.code, { context });
await mod.link((id) => new vm.SyntheticModule(Object.keys(mocks[id]), function () {
  for (const [key, value] of Object.entries(mocks[id])) this.setExport(key, value);
}, { context }));
await mod.evaluate();
const render = (props) => { const node = mod.namespace.default(props); return node.type(node.props); };
let passed = 0;
function check(name, fn) { failed = false; fn(); passed++; console.log("PASS", name); }
check("public gallery and business photos get responsive optimized sources", () => {
  for (const src of ["/uploads/gallery/123-photo.jpg", "/uploads/site/123-photo.webp"]) {
    const image = render({ src, alt: "Finished project" });
    assert.match(image.props.src, /\.v1-768\.webp$/);
    assert.match(image.props.srcSet, /1920w/);
    assert.ok(image.props.sizes.includes("860px"));
    assert.ok(hasLocalMatch(config.images.localPatterns, src));
  }
});
check("private, legacy, remote and query-bearing images never enter public optimization", () => {
  for (const src of ["/api/admin/lead-photos/private.jpg", "/uploads/lead-photos/legacy.jpg", "https://example.test/photo.jpg", "/uploads/gallery/photo.jpg?private=1", "blob:local-preview"]) {
    assert.equal(render({ src }).props.unoptimized, true);
    assert.equal(hasLocalMatch(config.images.localPatterns, src), false);
  }
});
check("runtime optimizer is disabled; the brand logo is generated at build time", () => {
  assert.equal(config.images.unoptimized, true);
});
check("errors produce an accessible fallback, and replacement sources remount it", () => {
  const props = { src: "/uploads/gallery/old.jpg", alt: "Ceiling", className: "test" };
  render(props).props.onError();
  assert.equal(render(props).props["aria-label"], "Ceiling — image unavailable");
  assert.notEqual(mod.namespace.default(props).key, mod.namespace.default({ ...props, src: "/uploads/gallery/new.jpg" }).key);
  assert.equal(render({}).type, "div");
});
check("caller can supply sizes for a wider contact image", () => {
  assert.equal(render({ src: "/uploads/site/photo.jpg", sizes: "504px" }).props.sizes, "504px");
});
const css = await fs.readFile(new URL("../app/globals.css", import.meta.url), "utf8");
check("gallery reserves responsive 4:3 space and shows the whole photo", () => {
  const rule = css.match(/\.gallery-card img,\s*\.gallery-placeholder\s*\{([^}]+)/)[1];
  for (const expected of [/height:\s*auto/, /aspect-ratio:\s*4\s*\/\s*3/, /object-fit:\s*contain/]) assert.match(rule, expected);
});
console.log(`${passed} gallery image checks passed. No external writes.`);
