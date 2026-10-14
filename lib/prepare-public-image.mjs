import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { isPublicImage, PUBLIC_IMAGE_WIDTHS, variantFilename } from "./public-image-paths.mjs";

// Runs only in a short-lived preparation process, never a GET route.
sharp.cache(false);
sharp.concurrency(1);
export async function preparePublicImage(root, folder, filename) {
  if (!isPublicImage(folder, filename)) throw new Error("Invalid public image.");
  if (/\.gif$/i.test(filename)) return { generated: 0, passthrough: true };
  const source = path.join(root, folder, filename);
  const sourceStat = await fs.stat(source);
  let generated = 0;
  for (const width of PUBLIC_IMAGE_WIDTHS) {
    const destination = path.join(root, folder, variantFilename(filename, width));
    const existing = await fs.stat(destination).catch((error) => {
      if (error.code !== "ENOENT") throw error;
      return null;
    });
    if (existing?.size > 0 && existing.mtimeMs >= sourceStat.mtimeMs) continue;
    const input = sharp(source, { sequentialRead: true, limitInputPixels: 40_000_000 });
    const metadata = await input.metadata();
    // Preserve animation; the streaming route falls back to the original.
    if (metadata.pages > 1) return { generated: 0, passthrough: true };
    const temporary = `${destination}.${process.pid}.tmp`;
    try {
      await input.rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 82, effort: 3 }).toFile(temporary);
      await fs.rename(temporary, destination);
      generated++;
    } finally {
      await fs.unlink(temporary).catch((error) => { if (error.code !== "ENOENT") throw error; });
    }
  }
  return { generated, passthrough: false };
}
