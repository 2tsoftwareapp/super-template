#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(dirname "$0")
ROOT_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
cd "$ROOT_DIR"

failed=0

POLICY_SEARCH_DIRS="
apps/api/src
apps/api/test
apps/admin/src
apps/web/src
packages/api-core/src
packages/api-database/src
packages/api-identity/src
packages/api-platform/src
"

search_matches() {
  pattern=$1
  shift

  if command -v rg >/dev/null 2>&1; then
    rg -n "$pattern" "$@" \
      --glob '!**/*.tsbuildinfo' \
      --glob '!**/generated/**' \
      --glob '!**/*.spec.ts' \
      --glob '!**/*.test.ts'
    return
  fi

  for dir in "$@"; do
    find "$dir" \
      \( -path '*/generated/*' -o -name '*.tsbuildinfo' -o -name '*.spec.ts' -o -name '*.test.ts' \) -prune -o \
      -type f \( -name '*.ts' -o -name '*.tsx' \) -print
  done | xargs grep -nE "$pattern" 2>/dev/null || true
}

filter_unknown_allowlist() {
  awk -F: '
    /\/filters\// { next }
    /postgres-errors\.ts:/ { next }
    /env\.schema\.ts:/ { next }
    /redis/ { next }
    /access-profile\.cache\.ts:/ { next }
    /notification-stream\.service\.ts:/ { next }
    /redact\.ts:/ { next }
    /current-user\.decorator\.ts:/ { next }
    /api-response\.decorator\.ts:/ { next }
    /apps\/api\/src\/main\.ts:/ { next }
    /database\.provider\.ts:/ { next }
    /app-error\.ts:/ { next }
    /observability\.types\.ts:/ { next }
    /transaction-executor\.ts:/ { next }
    /batch-delete-files\.use-case\.ts:/ { next }
    { print }
  '
}

search_unknown_targets() {
  pattern=$1

  if command -v rg >/dev/null 2>&1; then
    rg -n "$pattern" \
      packages/api-identity/src/modules \
      packages/api-platform/src/modules \
      packages/api-platform/src/modules \
      apps/admin/src \
      apps/web/src \
      --glob '**/application/**' \
      --glob '**/presentation/**' \
      --glob '!**/*.spec.ts' \
      --glob '!**/*.test.ts' \
      --glob '!**/generated/**' | filter_unknown_allowlist
    return
  fi

  true
}

check_policy() {
  name=$1
  pattern=$2
  message=$3
  shift 3

  output=$(search_matches "$pattern" "$@" || true)

  if [ -n "$output" ]; then
    failed=1
    printf 'Policy violation: %s\n' "$name" >&2
    printf '%s\n' "$output" >&2
    printf '%s\n' "$message" >&2
  fi
}

check_unknown_policy() {
  name=$1
  pattern=$2
  message=$3

  output=$(search_unknown_targets "$pattern" || true)

  if [ -n "$output" ]; then
    failed=1
    printf 'Policy violation: %s\n' "$name" >&2
    printf '%s\n' "$output" >&2
    printf '%s\n' "$message" >&2
  fi
}

# shellcheck disable=SC2086
check_policy '@boundaries-ignore' '@boundaries-ignore' 'Remove boundary-ignore comments and fix the underlying import surface.' $POLICY_SEARCH_DIRS
# shellcheck disable=SC2086
check_policy 'explicit any' ':\s*any\b|<\s*any\s*>|\bas\s+any\b' 'Use concrete types instead of explicit any.' $POLICY_SEARCH_DIRS

check_unknown_policy \
  'unknown outside boundary' \
  ':\s*unknown\b|<\s*unknown\s*>|\bas\s+unknown\b|Record<string,\s*unknown>' \
  'Use JsonValue/JsonObject or narrow unknown at explicit boundaries only.'

search_index_exports() {
  pattern=$1

  if command -v rg >/dev/null 2>&1; then
    rg -n "$pattern" \
      packages/api-core/src/index.ts \
      packages/api-database/src/index.ts \
      packages/api-identity/src/index.ts \
      packages/api-platform/src/index.ts \
      packages/api-platform/src/index.ts \
      packages/api-seed/src/index.ts \
      packages/api-health/src/index.ts
    return
  fi

  grep -nE "$pattern" \
    packages/api-core/src/index.ts \
    packages/api-database/src/index.ts \
    packages/api-identity/src/index.ts \
    packages/api-platform/src/index.ts \
    packages/api-platform/src/index.ts \
    packages/api-seed/src/index.ts \
    packages/api-health/src/index.ts \
    2>/dev/null || true
}

check_index_policy() {
  name=$1
  pattern=$2
  message=$3

  output=$(search_index_exports "$pattern" || true)

  if [ -n "$output" ]; then
    failed=1
    printf 'Policy violation: %s\n' "$name" >&2
    printf '%s\n' "$output" >&2
    printf '%s\n' "$message" >&2
  fi
}

search_presentation_imports() {
  pattern=$1

  if command -v rg >/dev/null 2>&1; then
    rg -n "$pattern" \
      packages/api-identity/src/modules \
      packages/api-platform/src/modules \
      packages/api-platform/src/modules \
      --glob '**/presentation/**/*.ts' \
      --glob '!**/*.spec.ts'
    return
  fi

  find packages/api-identity/src/modules packages/api-platform/src/modules packages/api-platform/src/modules \
    -path '*/presentation/*' -name '*.ts' ! -name '*.spec.ts' -print |
    xargs grep -nE "$pattern" 2>/dev/null || true
}

check_presentation_policy() {
  name=$1
  pattern=$2
  message=$3

  output=$(search_presentation_imports "$pattern" || true)

  if [ -n "$output" ]; then
    failed=1
    printf 'Policy violation: %s\n' "$name" >&2
    printf '%s\n' "$output" >&2
    printf '%s\n' "$message" >&2
  fi
}

check_index_policy \
  'package index exports repositories' \
  'export .*Repository' \
  'Package index.ts must export modules and contracts only, not repositories.'

check_presentation_policy \
  'presentation imports drizzle' \
  "from 'drizzle-orm'" \
  'Presentation layer must not import drizzle-orm; use application services instead.'

check_presentation_policy \
  'presentation imports infrastructure' \
  "from ['\"]\.\./infrastructure/" \
  'Presentation layer must not import infrastructure; use application services instead.'

search_application_imports() {
  pattern=$1

  if command -v rg >/dev/null 2>&1; then
    rg -n "$pattern" \
      packages/api-identity/src/modules \
      packages/api-platform/src/modules \
      packages/api-platform/src/modules \
      --glob '**/application/**/*.ts' \
      --glob '!**/*.spec.ts'
    return
  fi

  find packages/api-identity/src/modules packages/api-platform/src/modules packages/api-platform/src/modules \
    -path '*/application/*' -name '*.ts' ! -name '*.spec.ts' -print |
    xargs grep -nE "$pattern" 2>/dev/null || true
}

warn_application_policy() {
  name=$1
  pattern=$2
  message=$3

  output=$(search_application_imports "$pattern" || true)

  if [ -n "$output" ]; then
    printf 'Policy warning: %s\n' "$name" >&2
    printf '%s\n' "$output" >&2
    printf '%s\n' "$message" >&2
  fi
}

check_application_policy() {
  name=$1
  pattern=$2
  message=$3

  output=$(search_application_imports "$pattern" || true)

  if [ -n "$output" ]; then
    failed=1
    printf 'Policy violation: %s\n' "$name" >&2
    printf '%s\n' "$output" >&2
    printf '%s\n' "$message" >&2
  fi
}

warn_application_policy \
  'application imports presentation DTOs' \
  "from ['\"]\.\./presentation/.*\\.dto" \
  'Prefer internal types in application services; map to DTOs at the controller boundary.'

check_application_policy \
  'application imports drizzle' \
  "from 'drizzle-orm'" \
  'Application layer must not import drizzle-orm; use infrastructure repositories instead.'

check_application_policy \
  'application imports express' \
  "from 'express'" \
  'Application layer must not import express; keep HTTP concerns in presentation.'

# Domain purity: modules/*/domain/ holds framework-free business rules.
# It must never import NestJS, Drizzle, express, or the database package.
check_domain_policy() {
  name=$1
  pattern=$2
  message=$3

  output=""
  if command -v rg >/dev/null 2>&1; then
    # Type-only imports are allowed: they carry no runtime coupling.
    output=$(rg -n "$pattern" \
      packages/api-identity/src/modules \
      packages/api-platform/src/modules \
      --glob '**/domain/**' \
      --glob '!**/*.spec.ts' \
      --glob '!**/*.test.ts' 2>/dev/null | grep -v 'import type' || true)
  fi

  if [ -n "$output" ]; then
    failed=1
    printf 'Policy violation: %s\n' "$name" >&2
    printf '%s\n' "$output" >&2
    printf '%s\n' "$message" >&2
  fi
}

check_domain_policy \
  'domain imports a framework' \
  "from '@nestjs/|from 'drizzle-orm'|from 'express'|from '@repo/api-database'" \
  'modules/*/domain must stay framework-free: pure functions and types only.'

# App Router purity: app/ may only contain route entries (page/layout/route
# handlers). Views, drawers, cards, and other components belong to features/.
check_app_router_purity() {
  output=$(find "apps/admin/src/app" "apps/web/src/app" \
    -type f \( -name '*.tsx' -o -name '*.ts' \) \
    ! -name 'page.tsx' ! -name 'layout.tsx' ! -name 'route.ts' \
    ! -name 'loading.tsx' ! -name 'error.tsx' ! -name 'not-found.tsx' \
    ! -name 'template.tsx' ! -name 'default.tsx' 2>/dev/null || true)

  if [ -n "$output" ]; then
    failed=1
    printf 'Policy violation: app router contains non-route files\n' >&2
    printf '%s\n' "$output" >&2
    printf 'Move views/components to src/features/<resource>/components/.\n' >&2
  fi
}

check_app_router_purity

warn_large_application_services() {
  if command -v rg >/dev/null 2>&1; then
  files=$(find packages/api-identity/src/modules packages/api-platform/src/modules packages/api-platform/src/modules \
    -path '*/application/*.service.ts' ! -name '*.spec.ts' 2>/dev/null || true)
  for file in $files; do
    lines=$(wc -l <"$file" | tr -d ' ')
    if [ "$lines" -gt 250 ]; then
      printf 'Policy warning: %s has %s lines (budget: 250)\n' "$file" "$lines" >&2
    fi
  done
  fi
}

warn_large_application_services

if command -v git >/dev/null 2>&1; then
  tracked_artifacts=$(git ls-files '*.tsbuildinfo' 'apps/api/storage/uploads/*' 2>/dev/null || true)

  if [ -n "$tracked_artifacts" ]; then
    failed=1
    printf 'Policy violation: tracked generated artifacts\n' >&2
    printf '%s\n' "$tracked_artifacts" >&2
    printf 'Remove generated uploads and tsbuildinfo files from git and keep them ignored.\n' >&2
  fi
fi

exit "$failed"
