import sharp from "sharp";
sharp.cache(false);
sharp.concurrency(1);
await sharp("public/brand/ajs-painting-logo-v3.png")
  .resize({ width: 720, withoutEnlargement: true })
  .webp({ quality: 90, effort: 4 })
  .toFile("public/brand/ajs-painting-logo-v3-small.webp");
