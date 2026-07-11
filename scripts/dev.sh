#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Load layered env files (.env.example -> .env.<APP_ENV> -> .env -> *.local) into
# this shell so child processes and docker compose substitution see them.
export APP_ENV="${APP_ENV:-development}"
# shellcheck disable=SC1091
. ./scripts/load-env.sh

docker compose -f infra/docker-compose.yml up -d
./scripts/wait-for-postgres.sh
pnpm --filter api db:migrate

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

# Kill any existing processes on target ports so stale code isn't reused.
for kv in "API_PORT:${API_PORT:-3001}" "WEB_PORT:${WEB_PORT:-3000}" "ADMIN_PORT:${ADMIN_PORT:-3002}"; do
  port="${kv#*:}"
  if is_port_listening "$port"; then
    printf '%s\n' "Killing existing process on port ${port}..."
    lsof -tiTCP:"$port" -sTCP:LISTEN | xargs kill 2>/dev/null || true
    # Give the process time to release the port.
    while is_port_listening "$port"; do sleep 0.5; done
  fi
done

pnpm --filter api dev &
API_PID=$!

pnpm --filter web dev &
WEB_PID=$!

pnpm --filter admin dev &
ADMIN_PID=$!

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
