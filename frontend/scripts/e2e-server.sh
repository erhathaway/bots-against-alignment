#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="${ROOT_DIR}/../backend"

export VITE_BACKEND_API="http://127.0.0.1:8000"
export VITE_GUN_PEER="http://127.0.0.1:8765/gun"
export VITE_E2E="1"
export MOCK_LLM="1"

TMP_DIR="$(mktemp -d)"
GUN_LOG="${TMP_DIR}/gun.log"
bun "${ROOT_DIR}/scripts/gun-relay.ts" >"${GUN_LOG}" 2>&1 &
GUN_PID=$!

pushd "$BACKEND_DIR" >/dev/null
poetry run uvicorn src:app --port 8000 --log-level warning &
BACKEND_PID=$!
popd >/dev/null

cleanup() {
  if kill -0 "$GUN_PID" 2>/dev/null; then
    kill "$GUN_PID"
  fi
  if kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID"
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

for _ in {1..30}; do
  if curl -s "http://127.0.0.1:8000/health_check" >/dev/null; then
    BACKEND_READY="1"
    break
  fi
  sleep 1
done
if [[ "${BACKEND_READY:-}" != "1" ]]; then
  echo "Backend failed to start" >&2
  exit 1
fi

cd "$ROOT_DIR"
bun run build
bun run preview -- --host 127.0.0.1 --port 4173
