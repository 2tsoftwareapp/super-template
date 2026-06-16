#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

required_tools=(node pnpm docker flutter psql)
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

if [[ ! -f .env ]]; then
  cp .env.example .env
fi

set -a
source .env
set +a

pnpm install
(cd apps/mobile && flutter pub get)
docker compose -f infra/docker-compose.yml --env-file .env up -d
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
