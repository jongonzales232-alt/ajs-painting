import fs from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { isPublicImage, parsePublicImageFilename } from "./public-image-paths.mjs";

const contentTypes = { ".gif": "image/gif", ".jpeg": "image/jpeg", ".jpg": "image/jpeg", ".png": "image/png", ".webp": "image/webp" };
export async function publicImageResponse(request, { folder, filename }, root = process.env.PUBLIC_UPLOAD_ROOT || path.join(process.cwd(), "public", "uploads")) {
  const parsed = parsePublicImageFilename(filename);
  if (!parsed || !isPublicImage(folder, parsed.original)) return new Response(null, { status: 404 });
  let actualFilename = filename;
  let handle;
  let fallback = false;
  try {
    // Derivatives must not outlive publication of their originals.
    if (parsed.variant) await fs.access(path.join(root, folder, parsed.original));
    try {
      handle = await fs.open(path.join(root, folder, actualFilename), "r");
    } catch (error) {
      if (error.code !== "ENOENT" || !parsed.variant) throw error;
      actualFilename = parsed.original;
      fallback = true;
      handle = await fs.open(path.join(root, folder, actualFilename), "r");
    }
    const stat = await handle.stat();
    if (!stat.isFile()) { await handle.close(); return new Response(null, { status: 404 }); }
    const etag = `W/"${stat.size}-${Math.trunc(stat.mtimeMs)}"`;
    const headers = {
      "Content-Type": contentTypes[path.extname(actualFilename).toLowerCase()],
      "Cache-Control": fallback ? "no-store" : "public, max-age=31536000, immutable",
      "Content-Length": String(stat.size),
      "X-Content-Type-Options": "nosniff",
      ETag: etag
    };
    if (request.headers.get("if-none-match") === etag) {
      await handle.close();
      delete headers["Content-Length"];
      return new Response(null, { status: 304, headers });
    }
    if (request.method === "HEAD") { await handle.close(); return new Response(null, { headers }); }
    // Backpressure/cancellation, without a whole-file Buffer.
    return new Response(Readable.toWeb(handle.createReadStream({ highWaterMark: 64 * 1024 })), { headers });
  } catch (error) {
    await handle?.close().catch(() => {});
    if (error.code !== "ENOENT" && error.code !== "ENOTDIR") console.error("Public image read failed", error.code);
    return new Response(null, { status: 404 });
  }
}
