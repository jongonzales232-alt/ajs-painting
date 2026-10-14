#!/usr/bin/env bash
set -euo pipefail
node scripts/render-prepare.mjs
node node_modules/prisma/build/index.js db push --skip-generate
node prisma/seed.js
MALLOC_ARENA_MAX=2 UV_THREADPOOL_SIZE=1 node scripts/prepare-public-images.mjs
# Replace the shell; do not retain npm/npx/Node launcher processes.
exec node node_modules/next/dist/bin/next start -H 0.0.0.0 -p "${PORT:-3000}"
