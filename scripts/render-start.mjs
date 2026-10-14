import { spawnSync } from "node:child_process";

// Compatibility while Render transitions to the direct shell start command.
const result = spawnSync("bash", ["scripts/render-start.sh"], { stdio: "inherit", env: process.env });
process.exit(result.status ?? 1);
