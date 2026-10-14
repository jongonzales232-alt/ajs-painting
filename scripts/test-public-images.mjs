import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sharp from "sharp";
import { preparePublicImage } from "../lib/prepare-public-image.mjs";
import { publicImageResponse } from "../lib/public-image-response.mjs";
import { publicImageSources, variantFilename, PUBLIC_IMAGE_WIDTHS } from "../lib/public-image-paths.mjs";

const root = await fs.mkdtemp(path.join(os.tmpdir(), "ajs-images-"));
process.env.PUBLIC_UPLOAD_ROOT = root;
process.env.PRIVATE_UPLOAD_ROOT = path.join(root, "private");
const { saveUpload, removePublicUpload } = await import("../lib/upload.js");
let passed = 0;
async function check(name, fn) { await fn(); passed++; console.log("PASS", name); }
const request = (method = "GET", headers = {}) => new Request("https://example.test/image", { method, headers });
const response = (filename, options = {}) => publicImageResponse(request(options.method, options.headers), { folder: options.folder || "gallery", filename }, root);
try {
  await fs.mkdir(path.join(root, "gallery"));
  const original = await sharp({ create: { width: 1600, height: 1200, channels: 4, background: "#4987bc" } }).png().toBuffer();
  await fs.writeFile(path.join(root, "gallery", "sample.png"), original);
  await check("prepare all responsive variants without changing the original", async () => {
    assert.equal((await preparePublicImage(root, "gallery", "sample.png")).generated, 4);
    assert.deepEqual(await fs.readFile(path.join(root, "gallery", "sample.png")), original);
    for (const width of PUBLIC_IMAGE_WIDTHS) {
      const meta = await sharp(path.join(root, "gallery", variantFilename("sample.png", width))).metadata();
      assert.equal(meta.format, "webp");
      assert.equal(meta.width, Math.min(width, 1600));
      assert.equal(meta.width / meta.height, 4 / 3);
    }
  });
  await check("repeat preparation reuses existing derivatives", async () => {
    const filename = path.join(root, "gallery", variantFilename("sample.png", 768));
    const before = await fs.stat(filename);
    assert.equal((await preparePublicImage(root, "gallery", "sample.png")).generated, 0);
    assert.equal((await fs.stat(filename)).mtimeMs, before.mtimeMs);
  });
  await check("GET, HEAD and conditional GET serve matching bytes and headers", async () => {
    const filename = variantFilename("sample.png", 768);
    const get = await response(filename);
    assert.equal(get.status, 200);
    assert.equal(get.headers.get("content-type"), "image/webp");
    assert.equal(get.headers.get("x-content-type-options"), "nosniff");
    assert.deepEqual(Buffer.from(await get.arrayBuffer()), await fs.readFile(path.join(root, "gallery", filename)));
    const head = await response(filename, { method: "HEAD" });
    assert.equal(await head.text(), "");
    assert.equal(head.headers.get("content-length"), get.headers.get("content-length"));
    assert.equal((await response(filename, { headers: { "if-none-match": get.headers.get("etag") } })).status, 304);
  });
  await check("missing variants stream originals without writing or transforming", async () => {
    await fs.writeFile(path.join(root, "gallery", "fallback.png"), original);
    const get = await response(variantFilename("fallback.png", 768));
    assert.equal(get.headers.get("content-type"), "image/png");
    assert.equal(get.headers.get("cache-control"), "no-store");
    assert.deepEqual(Buffer.from(await get.arrayBuffer()), original);
    await assert.rejects(fs.stat(path.join(root, "gallery", variantFilename("fallback.png", 768))), { code: "ENOENT" });
  });
  await check("large original streams bounded chunks and supports cancellation", async () => {
    await fs.writeFile(path.join(root, "gallery", "large.jpg"), Buffer.alloc(6 * 1024 * 1024, 1));
    const get = await response("large.jpg");
    const reader = get.body.getReader();
    const chunk = await reader.read();
    assert.ok(chunk.value.length <= 64 * 1024);
    await reader.cancel();
    await fs.unlink(path.join(root, "gallery", "large.jpg"));
  });
  await check("private folders, traversal and arbitrary widths stay unavailable", async () => {
    for (const folder of ["lead-photos", "private", "../gallery"]) assert.equal((await response("sample.png", { folder })).status, 404);
    for (const name of ["../sample.png", "sample.png/extra", "sample.png.v1-4096.webp", "sample.png?x=1"]) assert.equal((await response(name)).status, 404);
    for (const src of ["/api/admin/lead-photos/a.jpg", "/uploads/lead-photos/a.jpg", "https://example.test/a.jpg", "/uploads/gallery/a.jpg?x=1", "/uploads/gallery/a.gif"]) assert.equal(publicImageSources(src), null);
    assert.match(publicImageSources("/uploads/gallery/sample.png").srcSet, /v1-1920\.webp 1920w/);
  });
  await check("public upload worker prepares variants before publishing its URL", async () => {
    const upload = await saveUpload(new File([original], "new.png", { type: "image/png" }), "gallery");
    for (const width of PUBLIC_IMAGE_WIDTHS) assert.ok((await fs.stat(path.join(root, "gallery", variantFilename(upload.filename, width)))).size > 0);
    await removePublicUpload("gallery", upload.filename);
    await assert.rejects(fs.stat(path.join(root, "gallery", upload.filename)), { code: "ENOENT" });
    for (const width of PUBLIC_IMAGE_WIDTHS) await assert.rejects(fs.stat(path.join(root, "gallery", variantFilename(upload.filename, width))), { code: "ENOENT" });
  });
  await check("private quote uploads stay private and never receive variants", async () => {
    const upload = await saveUpload(new File([original], "quote.png", { type: "image/png" }), "lead-photos", { private: true });
    assert.match(upload.url, /^\/api\/admin\/lead-photos\//);
    assert.deepEqual(await fs.readdir(path.join(root, "private", "lead-photos")), [upload.filename]);
  });
  await check("deleted originals prevent orphan derivatives being served", async () => {
    await fs.unlink(path.join(root, "gallery", "sample.png"));
    assert.equal((await response(variantFilename("sample.png", 768))).status, 404);
  });
  await check("GIF originals retain animation without conversion", async () => {
    const gif = Buffer.from("R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", "base64");
    await fs.writeFile(path.join(root, "gallery", "animation.gif"), gif);
    assert.equal((await preparePublicImage(root, "gallery", "animation.gif")).passthrough, true);
    assert.deepEqual(Buffer.from(await (await response("animation.gif")).arrayBuffer()), gif);
  });
  console.log(`${passed} public image checks passed.`);
} finally {
  const resolved = path.resolve(root);
  if (!resolved.startsWith(path.resolve(os.tmpdir()) + path.sep) || !path.basename(resolved).startsWith("ajs-images-")) throw new Error("Unexpected test directory.");
  await fs.rm(resolved, { recursive: true, force: true });
}
