// Shared with the browser. Only published gallery/site images get variants.
export const PUBLIC_IMAGE_WIDTHS = [384, 768, 1280, 1920];
export const PUBLIC_IMAGE_FOLDERS = ["gallery", "site"];
const originalName = /^[a-zA-Z0-9_-]+\.(jpe?g|png|webp|gif)$/i;
export function isPublicImage(folder, filename) {
  return PUBLIC_IMAGE_FOLDERS.includes(folder) && originalName.test(filename);
}
export function variantFilename(filename, width) {
  if (!originalName.test(filename) || !PUBLIC_IMAGE_WIDTHS.includes(width)) throw new Error("Invalid public image variant.");
  return `${filename}.v1-${width}.webp`;
}
export function parsePublicImageFilename(filename) {
  if (originalName.test(filename)) return { original: filename, variant: false };
  const match = /^(.*)\.v1-(384|768|1280|1920)\.webp$/.exec(filename);
  if (!match || !originalName.test(match[1])) return null;
  return { original: match[1], variant: true };
}
export function publicImageSources(src) {
  const match = /^\/uploads\/(gallery|site)\/([^/]+)$/.exec(src || "");
  if (!match || !isPublicImage(match[1], match[2]) || /\.gif$/i.test(match[2])) return null;
  const base = `/uploads/${match[1]}/`;
  return {
    src: base + variantFilename(match[2], 768),
    srcSet: PUBLIC_IMAGE_WIDTHS.map((width) => `${base}${variantFilename(match[2], width)} ${width}w`).join(", ")
  };
}
