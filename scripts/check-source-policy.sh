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
packages/api-kernel/src
packages/api-plugin-kit/src
packages/api-runtime/src
packages/database-runtime/src
packages/observability/src
packages/config/src
packages/feature-*/src
"

search_matches() {
  pattern=$1
  shift

  if command -v rg >/dev/null 2>&1; then
    rg -n "$pattern" "$@" \
      --glob '!**/*.tsbuildinfo' \
      --glob '!**/generated/**' \
      --glob '!**/*.spec.ts' \
      --glob '!**/*.test.ts' || true
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

# shellcheck disable=SC2086
check_policy '@boundaries-ignore' '@boundaries-ignore' 'Remove boundary-ignore comments and fix the underlying import surface.' $POLICY_SEARCH_DIRS
# shellcheck disable=SC2086
check_policy 'explicit any' ':\s*any\b|<\s*any\s*>|\bas\s*any\b' 'Use concrete types instead of explicit any.' $POLICY_SEARCH_DIRS

# API host must not own business feature implementation folders
if rg -n '.' apps/api/src/identity apps/api/src/platform apps/api/src/auth apps/api/src/upload apps/api/src/jobs apps/api/src/mail 2>/dev/null; then
  failed=1
  printf 'Policy violation: apps/api contains business feature folders\n' >&2
fi

# No umbrella feature packages
if [ -d packages/features/identity ] || [ -d packages/features/platform ]; then
  failed=1
  printf 'Policy violation: umbrella packages/features/{identity,platform} must not exist\n' >&2
fi

# No wildcard feature exports
wildcard=$(rg -n '"\./\*"' packages/feature-*/package.json || true)
if [ -n "$wildcard" ]; then
  failed=1
  printf 'Policy violation: feature packages must not use wildcard exports\n%s\n' "$wildcard" >&2
fi

# database-runtime must not own business schema tables
if rg -n 'pgTable\(' packages/database-runtime/src --glob '!**/persistence/timestamps.ts' --glob '!**/*.spec.ts'; then
  failed=1
  printf 'Policy violation: database-runtime must not define business tables\n' >&2
fi

# api-kernel must not import Nest/Express/Drizzle/Redis/Sentry
kernel_fw=$(rg -n "from ['\"]@nestjs/|from ['\"]express|from ['\"]drizzle-orm|from ['\"]redis|from ['\"]@sentry/" packages/api-kernel/src || true)
if [ -n "$kernel_fw" ]; then
  failed=1
  printf 'Policy violation: api-kernel must stay framework-free\n%s\n' "$kernel_fw" >&2
fi

# Features must not import apps/*
feat_apps=$(rg -n "from ['\"](@/|\.\./\.\./\.\./apps/|apps/)" packages/feature-*/src || true)
# Allow nothing from apps
if [ -n "$feat_apps" ]; then
  failed=1
  printf 'Policy violation: features must not import apps/*\n%s\n' "$feat_apps" >&2
fi

# API host must not depend on feature provider SDKs.
# Note: argon2 is allowed because webpack externalizes all native npm
# packages via nodeExternals(); the bundle requires argon2 at runtime
# for password hashing and pnpm strict isolation needs it as a direct dep.
if rg -n '"(@aws-sdk/|firebase-admin|nodemailer)"' apps/api/package.json; then
  failed=1
  printf 'Policy violation: apps/api must not depend on feature provider SDKs\n' >&2
fi

if [ "$failed" -ne 0 ]; then
  exit 1
fi

printf 'Source policy checks passed.\n'
node scripts/check-cross-feature-fks.mjs
node scripts/check-error-codes.mjs
# ADR 0001 rule 1: feature `domain/` code stays framework-free (value imports
# from Nest/Drizzle/Express/database-runtime are rejected; type-only is fine).
node scripts/check-domain-purity.mjs
