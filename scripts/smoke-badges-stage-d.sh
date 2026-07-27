#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
set -a
# shellcheck disable=SC1091
source .env
set +a

echo "=== Build api-server ==="
npm exec -- pnpm --filter @workspace/api-server run build

echo "=== Start API :9888 ==="
PORT=9888 node --enable-source-maps artifacts/api-server/dist/index.mjs >/tmp/api-badges-d.log 2>&1 &
PID=$!
cleanup() { kill "$PID" 2>/dev/null || true; }
trap cleanup EXIT

for i in $(seq 1 40); do
  curl -sf "http://127.0.0.1:9888/api/healthz" >/dev/null && break
  sleep 0.25
done
curl -sf "http://127.0.0.1:9888/api/healthz" >/dev/null || {
  echo "API failed"; tail -40 /tmp/api-badges-d.log; exit 1;
}

SMOKE_API_BASE=http://127.0.0.1:9888/api node scripts/smoke-badges-stage-d.mjs

echo "=== Stage D schema+API smoke PASSED ==="
