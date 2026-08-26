#!/usr/bin/env bash
set -euo pipefail

# Generate apps/api/openapi.json from the Nest app module graph without
# requiring a live HTTP listener or a reachable Postgres instance.
# DatabaseRlsGuard is skipped via DATABASE_SKIP_RLS_CHECK for this offline path.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_DIR="$ROOT_DIR/apps/api"

cd "$API_DIR"

export DATABASE_SKIP_RLS_CHECK=true
# Provide a syntactically valid URL so the pool can be constructed; no query is issued
# during OpenAPI generation when RLS check is skipped.
export DATABASE_URL="${DATABASE_URL:-postgresql://fullstack_starter_app:fullstack_starter_app@127.0.0.1:5432/fullstack_starter}"

printf '[openapi] Generating OpenAPI document via Nest application context\n'
pnpm exec ts-node -r tsconfig-paths/register --files --project tsconfig.json src/openapi/generate-openapi.ts

if [[ ! -f "$API_DIR/openapi.json" ]]; then
  printf '[openapi] openapi.json was not written\n' >&2
  exit 1
fi

printf '[openapi] Wrote %s\n' "$API_DIR/openapi.json"
