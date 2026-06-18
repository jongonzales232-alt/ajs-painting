import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const port = process.env.PORT || "3120";
const logDir = path.join(process.cwd(), ".online");
fs.mkdirSync(logDir, { recursive: true });
const out = fs.createWriteStream(path.join(logDir, "ajs-next-supervisor.log"), { flags: "a" });
const nextBin = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");

function write(message) {
  out.write(`[${new Date().toISOString()}] ${message}\n`);
}

function start() {
  write(`starting next on ${port}`);
  const child = spawn(process.execPath, [nextBin, "start", "-H", "127.0.0.1", "-p", port], {
    cwd: process.cwd(),
    stdio: ["ignore", "pipe", "pipe"],
    windowsHide: true
  });

  child.stdout.on("data", (chunk) => out.write(chunk));
  child.stderr.on("data", (chunk) => out.write(chunk));
  child.on("exit", (code, signal) => {
    write(`next exited code=${code} signal=${signal}; restarting in 2s`);
    setTimeout(start, 2000);
  });
}

start();
setInterval(() => write("supervisor heartbeat"), 60_000);
