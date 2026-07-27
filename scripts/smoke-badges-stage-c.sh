#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
set -a
# shellcheck disable=SC1091
source .env
set +a

echo "=== Build api-server ==="
npm exec -- pnpm --filter @workspace/api-server run build

echo "=== Build portal-marujo ==="
npm exec -- pnpm --filter @workspace/portal-marujo run build

echo "=== Start API :9887 ==="
PORT=9887 node --enable-source-maps artifacts/api-server/dist/index.mjs >/tmp/api-badges-c.log 2>&1 &
PID=$!
cleanup() { kill "$PID" 2>/dev/null || true; }
trap cleanup EXIT

for i in $(seq 1 40); do
  curl -sf "http://127.0.0.1:9887/api/healthz" >/dev/null && break
  sleep 0.25
done
curl -sf "http://127.0.0.1:9887/api/healthz" >/dev/null || {
  echo "API failed"; tail -40 /tmp/api-badges-c.log; exit 1;
}

SMOKE_API_BASE=http://127.0.0.1:9887/api node scripts/smoke-badges-stage-c.mjs

echo "=== Stage C full checklist PASSED ==="
