import fs from "node:fs";
import path from "node:path";
const db = process.env.DATABASE_URL;
if (db?.startsWith("file:")) fs.mkdirSync(path.dirname(db.slice(5)), { recursive: true });
for (const root of [process.env.PUBLIC_UPLOAD_ROOT || path.join(process.cwd(), "public", "uploads"), process.env.PRIVATE_UPLOAD_ROOT || path.join(process.cwd(), "storage", "uploads")]) {
  fs.mkdirSync(root, { recursive: true });
}
