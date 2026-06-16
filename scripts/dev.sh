#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ ! -f .env ]]; then
  cp .env.example .env
fi

set -a
source .env
set +a

docker compose -f infra/docker-compose.yml --env-file .env up -d

is_port_listening() {
  local port="$1"
  lsof -tiTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1
}

cat <<EOF
Starting API, Web, and Admin.
API: http://localhost:${API_PORT:-3001}/api/v1
Swagger: http://localhost:${API_PORT:-3001}/api/docs
Web: http://localhost:${WEB_PORT:-3000}
Admin: http://localhost:${ADMIN_PORT:-3002}
Mailpit: http://localhost:${MAILPIT_HTTP_PORT:-8025}
Run Flutter separately with: make dev-mobile
EOF

API_PID=""
WEB_PID=""
ADMIN_PID=""

if is_port_listening "${API_PORT:-3001}"; then
  printf '%s\n' "API already running on port ${API_PORT:-3001}; reusing existing process."
else
  pnpm --filter api dev &
  API_PID=$!
fi

if is_port_listening "${WEB_PORT:-3000}"; then
  printf '%s\n' "Web already running on port ${WEB_PORT:-3000}; reusing existing process."
else
  pnpm --filter web dev &
  WEB_PID=$!
fi

if is_port_listening "${ADMIN_PORT:-3002}"; then
  printf '%s\n' "Admin already running on port ${ADMIN_PORT:-3002}; reusing existing process."
else
  pnpm --filter admin dev &
  ADMIN_PID=$!
fi

cleanup() {
  [[ -n "$API_PID" ]] && kill "$API_PID" 2>/dev/null || true
  [[ -n "$WEB_PID" ]] && kill "$WEB_PID" 2>/dev/null || true
  [[ -n "$ADMIN_PID" ]] && kill "$ADMIN_PID" 2>/dev/null || true
}

trap cleanup EXIT INT TERM

wait_pids=()
[[ -n "$API_PID" ]] && wait_pids+=("$API_PID")
[[ -n "$WEB_PID" ]] && wait_pids+=("$WEB_PID")
[[ -n "$ADMIN_PID" ]] && wait_pids+=("$ADMIN_PID")

if [[ ${#wait_pids[@]} -eq 0 ]]; then
  wait
else
  wait "${wait_pids[@]}"
fi
