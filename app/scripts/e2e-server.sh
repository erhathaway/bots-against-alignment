#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

export PUBLIC_E2E="1"
export MOCK_LLM="${MOCK_LLM:-1}"
export OPENAI_API_KEY="${OPENAI_API_KEY:-}"

TMP_DIR="$(mktemp -d)"
export DATABASE_URL="file:${TMP_DIR}/boa-e2e.db"

cleanup() {
  rm -rf "$TMP_DIR"
}
trap cleanup EXIT

cd "$ROOT_DIR"
bun run db:migrate
bun run build
bun run preview -- --host 127.0.0.1 --port 4173
