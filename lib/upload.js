import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const uploadRoot = path.join(process.cwd(), "public", "uploads");
const privateUploadRoot = path.join(process.cwd(), "storage", "uploads");
const allowedTypes = new Map([
  ["image/jpeg", [".jpg", ".jpeg"]],
  ["image/png", [".png"]],
  ["image/webp", [".webp"]],
  ["image/gif", [".gif"]]
]);

function detectImageType(bytes) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  if (bytes.length >= 6 && ["GIF87a", "GIF89a"].includes(bytes.toString("ascii", 0, 6))) {
    return "image/gif";
  }
  return null;
}

export async function saveUpload(file, folder = "general", options = {}) {
  if (!file || file.size === 0) return null;
  if (file.size > 6 * 1024 * 1024) {
    throw new Error("Images must be smaller than 6 MB.");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const detectedType = detectImageType(bytes);
  if (!detectedType || !allowedTypes.has(detectedType)) {
    throw new Error("Only valid JPG, PNG, WebP, and GIF images are allowed.");
  }

  const originalExt = path.extname(file.name || "").toLowerCase();
  const ext = allowedTypes.get(detectedType).includes(originalExt) ? originalExt : allowedTypes.get(detectedType)[0];
  const safeFolder = folder.replace(/[^a-z0-9-]/gi, "");
  const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;
  const isPrivate = options.private === true;
  const dir = path.join(isPrivate ? privateUploadRoot : uploadRoot, safeFolder);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), bytes);

  return {
    filename,
    url: isPrivate ? `/api/admin/lead-photos/${filename}` : `/uploads/${safeFolder}/${filename}`
  };
}

export function getPrivateUploadPath(folder, filename) {
  const safeFolder = folder.replace(/[^a-z0-9-]/gi, "");
  const safeFilename = path.basename(filename);
  const filePath = path.join(privateUploadRoot, safeFolder, safeFilename);
  const root = path.join(privateUploadRoot, safeFolder);
  const relative = path.relative(root, filePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Invalid file path.");
  }
  return filePath;
}

export function getPublicUploadPath(folder, filename) {
  const safeFolder = folder.replace(/[^a-z0-9-]/gi, "");
  const safeFilename = path.basename(filename);
  const filePath = path.join(uploadRoot, safeFolder, safeFilename);
  const root = path.join(uploadRoot, safeFolder);
  const relative = path.relative(root, filePath);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error("Invalid file path.");
  }
  return filePath;
}
