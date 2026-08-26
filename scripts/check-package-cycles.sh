#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(dirname "$0")
ROOT_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
cd "$ROOT_DIR"

failed=0

search_matches() {
  pattern=$1
  shift

  if command -v rg >/dev/null 2>&1; then
    rg -n "$pattern" "$@" \
      --glob '!**/*.spec.ts' \
      --glob '!**/generated/**'
    return
  fi

  find "$@" \
    \( -path '*/generated/*' -o -name '*.spec.ts' \) -prune -o \
    -type f -name '*.ts' -print |
    xargs grep -nE "$pattern"
}

record_violation() {
  name=$1
  message=$2
  shift 2

  output=$(search_matches "$@" || true)

  if [ -n "$output" ]; then
    failed=1
    printf 'Package boundary violation: %s\n' "$name" >&2
    printf '%s\n' "$output" >&2
    printf '%s\n' "$message" >&2
  fi
}

# Bounded contexts live inside apps/api. Cross-context imports use the
# @identity / @platform aliases; the stable surface (application/ports,
# domain, constants files) is allowed — everything else mirrors the ESLint
# ctxForbidden rules.
CTX_DIR="apps/api/src"

check_ctx() {
  label=$1 pattern=$2 dir=$3
  output=$(rg -n "$pattern" "$dir" --glob '*.ts' || true)
  if [ -n "$output" ]; then
    failed=1
    printf 'Cycle/boundary violation: %s\n%s\n' "$label" "$output" >&2
  fi
}

check_ctx 'identity imports platform services (unstable surface)' \
  '@repo/feature-platform/.*[Ss]ervice' "packages/features/identity/src"
check_ctx 'identity imports platform infrastructure' \
  '@repo/feature-platform/.*infrastructure' "packages/features/identity/src"
check_ctx 'identity imports platform controllers/modules' \
  '@repo/feature-platform/(.*controller|.*\.module)' "packages/features/identity/src"
check_ctx 'platform imports identity services (unstable surface)' \
  '@repo/feature-identity/.*[Ss]ervice' "packages/features/platform/src"
check_ctx 'platform imports identity infrastructure' \
  '@repo/feature-identity/.*infrastructure' "packages/features/platform/src"
check_ctx 'platform imports identity controllers/modules' \
  '@repo/feature-identity/(.*controller|.*\.module)' "packages/features/platform/src"

# Feature plugins must consume peer features only through their public package
# barrel (`@repo/feature-<id>`), never a deep subpath into another feature's
# internals. Deep imports into a feature are allowed only from the app
# composition root / tests (apps/api), which are outside packages/features.
if command -v rg >/dev/null 2>&1; then
  deep_feature_imports=$(rg -n 'from "@repo/feature-[a-z-]+/' packages/features \
    --glob '*.ts' --glob '!**/*.spec.ts' || true)
  if [ -n "$deep_feature_imports" ]; then
    failed=1
    printf 'Cross-feature deep import (import the peer feature barrel instead):\n%s\n' \
      "$deep_feature_imports" >&2
  fi
fi

exit "$failed"
