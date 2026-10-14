import { spawn } from "node:child_process";
import path from "node:path";
import { isPublicImage } from "./public-image-paths.mjs";

const queueKey = Symbol.for("ajs.public-image-preparation");
export function prepareUploadedPublicImage(folder, filename) {
  if (!isPublicImage(folder, filename)) return Promise.reject(new Error("Invalid public image."));
  const previous = globalThis[queueKey] || Promise.resolve();
  const job = previous.then(() => new Promise((resolve, reject) => {
    const worker = spawn(process.execPath, [path.join(process.cwd(), "scripts", "prepare-public-images.mjs"), "--file", folder, filename], {
      env: { ...process.env, MALLOC_ARENA_MAX: "2", UV_THREADPOOL_SIZE: "1" },
      stdio: ["ignore", "ignore", "inherit"],
      windowsHide: true
    });
    let timedOut = false;
    const timeout = setTimeout(() => { timedOut = true; worker.kill("SIGKILL"); }, 120_000);
    const finish = () => clearTimeout(timeout);
    worker.once("error", (error) => { finish(); reject(error); });
    worker.once("exit", (code) => {
      finish();
      if (code === 0 && !timedOut) resolve();
      else reject(new Error("The photo could not be prepared. Try a smaller JPG, PNG, or WebP photo."));
    });
  }));
  // Serial workers bound native memory. Exit releases all Sharp allocations.
  globalThis[queueKey] = job.catch(() => {});
  return job;
}
