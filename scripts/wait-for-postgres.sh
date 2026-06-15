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

for _ in {1..60}; do
  if PGPASSWORD="${POSTGRES_PASSWORD:-postgres}" pg_isready -h "$host" -p "$port" -U "$user" -d "$db" >/dev/null 2>&1; then
    exit 0
  fi
  sleep 1
done

echo "PostgreSQL did not become ready in time." >&2
exit 1
