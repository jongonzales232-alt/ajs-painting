import fs from "node:fs/promises";
import path from "node:path";
import { preparePublicImage } from "../lib/prepare-public-image.mjs";
import { isPublicImage, PUBLIC_IMAGE_FOLDERS } from "../lib/public-image-paths.mjs";

const root = process.env.PUBLIC_UPLOAD_ROOT || path.join(process.cwd(), "public", "uploads");
const args = process.argv.slice(2);
if (args[0] === "--file" && args.length === 3) {
  await preparePublicImage(root, args[1], args[2]);
} else if (args.length === 0) {
  let generated = 0;
  for (const folder of PUBLIC_IMAGE_FOLDERS) {
    const entries = await fs.readdir(path.join(root, folder), { withFileTypes: true }).catch((error) => {
      if (error.code !== "ENOENT") throw error;
      return [];
    });
    for (const entry of entries) {
      if (!entry.isFile() || !isPublicImage(folder, entry.name)) continue;
      try {
        generated += (await preparePublicImage(root, folder, entry.name)).generated;
      } catch (error) {
        // One damaged old photo must not prevent startup. Missing derivatives
        // fall back to streamed originals, with no request-time transforms.
        console.error("Could not prepare public photo", folder, entry.name, error.message);
      }
    }
  }
  console.log(`Prepared ${generated} public image variants.`);
} else {
  throw new Error("Usage: prepare-public-images.mjs [--file gallery|site filename]");
}
