#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_DIR="$ROOT_DIR/apps/api"
BASE_PORT="${OPENAPI_GENERATE_PORT:-3901}"
LOG_FILE="$(mktemp)"
JSON_FILE="$(mktemp)"
API_PID=""

cleanup() {
  rm -f "$LOG_FILE" "$JSON_FILE"
  if [[ -n "$API_PID" ]]; then
    kill "$API_PID" 2>/dev/null || true
    wait "$API_PID" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

find_available_port() {
  local port="$BASE_PORT"
  while lsof -tiTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; do
    port=$((port + 1))
  done
  printf '%s' "$port"
}

OPENAPI_PORT="$(find_available_port)"

cd "$ROOT_DIR"
API_PORT="$OPENAPI_PORT" pnpm --filter api exec nest start >"$LOG_FILE" 2>&1 &
API_PID=$!

printf '[openapi] Waiting for API on port %s' "$OPENAPI_PORT"
for _ in $(seq 1 90); do
  if curl -fsS "http://127.0.0.1:${OPENAPI_PORT}/api/docs-json" | node -e "let d='';process.stdin.on('data',c=>d+=c).on('end',()=>process.stdout.write(JSON.stringify(JSON.parse(d),null,2)))" >"$JSON_FILE" 2>/dev/null; then
    printf ' ready\n'
    mv "$JSON_FILE" "$API_DIR/openapi.json"
    exit 0
  fi
  printf '.'
  sleep 1
done
printf ' timed out\n'

cat "$LOG_FILE"
exit 1
