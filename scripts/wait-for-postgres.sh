#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

host="${POSTGRES_HOST:-localhost}"
port="${POSTGRES_PORT:-5432}"
user="${POSTGRES_USER:-postgres}"
db="${POSTGRES_DB:-fullstack_starter}"

is_ready() {
  if command -v pg_isready >/dev/null 2>&1; then
    PGPASSWORD="${POSTGRES_PASSWORD:-postgres}" pg_isready \
      -h "$host" \
      -p "$port" \
      -U "$user" \
      -d "$db" >/dev/null 2>&1
    return $?
  fi

  node -e "
    const net = require('node:net');
    const socket = net.connect({ host: process.argv[1], port: Number(process.argv[2]) });
    socket.setTimeout(1000);
    socket.once('connect', () => { socket.end(); process.exit(0); });
    socket.once('timeout', () => { socket.destroy(); process.exit(1); });
    socket.once('error', () => process.exit(1));
  " "$host" "$port" >/dev/null 2>&1
}

for _ in {1..60}; do
  if is_ready; then
    exit 0
  fi
  sleep 1
done

echo "PostgreSQL did not become ready in time." >&2
exit 1
