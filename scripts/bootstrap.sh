#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

required_tools=(node pnpm docker)
missing_tools=()

for tool in "${required_tools[@]}"; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    missing_tools+=("$tool")
  fi
done

if [[ ${#missing_tools[@]} -gt 0 ]]; then
  printf 'Missing required tools: %s\n' "${missing_tools[*]}" >&2
  exit 1
fi

# Load layered env files into this shell (.env.example provides safe dev defaults,
# so bootstrap works with zero setup; create .env.local for personal overrides).
export APP_ENV="${APP_ENV:-development}"
# shellcheck disable=SC1091
. ./scripts/load-env.sh

pnpm install
if sh scripts/mobile.sh doctor >/dev/null 2>&1; then
  sh scripts/mobile.sh setup
else
  printf '%s\n' 'Flutter unavailable; skipping apps/mobile dependency bootstrap on this machine.'
fi
docker compose -f infra/docker-compose.yml up -d
./scripts/wait-for-postgres.sh
pnpm --filter api db:migrate
pnpm --filter api db:seed
./scripts/generate-contracts.sh

cat <<EOF
Bootstrap complete.
Web: http://localhost:${WEB_PORT:-3000}
Admin: http://localhost:${ADMIN_PORT:-3002}
API: http://localhost:${API_PORT:-3001}/api/v1
Swagger: http://localhost:${API_PORT:-3001}/api/docs
Mailpit: http://localhost:${MAILPIT_HTTP_PORT:-8025}
Run Flutter separately with: make dev-mobile
EOF
