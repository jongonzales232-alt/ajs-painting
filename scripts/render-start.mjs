import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

function mkdirForFileUrl(fileUrl) {
  if (!fileUrl?.startsWith("file:")) return;
  const dbPath = fileUrl.slice("file:".length);
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: process.env,
    stdio: "inherit",
    shell: process.platform === "win32"
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

mkdirForFileUrl(process.env.DATABASE_URL);
fs.mkdirSync(process.env.PUBLIC_UPLOAD_ROOT || path.join(process.cwd(), "public", "uploads"), { recursive: true });
fs.mkdirSync(process.env.PRIVATE_UPLOAD_ROOT || path.join(process.cwd(), "storage", "uploads"), { recursive: true });

run("npx", ["prisma", "db", "push"]);
run("node", ["prisma/seed.js"]);
run("npx", ["next", "start", "-H", "0.0.0.0", "-p", process.env.PORT || "3000"]);
