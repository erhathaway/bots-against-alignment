#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

export PUBLIC_GUN_PEER="http://127.0.0.1:8765/gun"
export PUBLIC_E2E="1"
export MOCK_LLM="1"

TMP_DIR="$(mktemp -d)"
export DATABASE_URL="file:${TMP_DIR}/boa-e2e.db"

GUN_LOG="${TMP_DIR}/gun.log"
bun "${ROOT_DIR}/scripts/gun-relay.ts" >"${GUN_LOG}" 2>&1 &
GUN_PID=$!

cleanup() {
  if kill -0 "$GUN_PID" 2>/dev/null; then
    kill "$GUN_PID"
  fi
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

for _ in {1..30}; do
  if curl -s "http://127.0.0.1:8765/health" >/dev/null; then
    GUN_READY="1"
    break
  fi
  sleep 1
done
if [[ "${GUN_READY:-}" != "1" ]]; then
  echo "Gun relay failed to start; logs:" >&2
  cat "${GUN_LOG}" >&2 || true
  exit 1
fi

cd "$ROOT_DIR"
bun run db:migrate
bun run build
bun run preview -- --host 127.0.0.1 --port 4173
