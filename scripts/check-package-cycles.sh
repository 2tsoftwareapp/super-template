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
  '@platform/.*[Ss]ervice' "$CTX_DIR/identity"
check_ctx 'identity imports platform infrastructure' \
  '@platform/.*infrastructure' "$CTX_DIR/identity"
check_ctx 'identity imports platform controllers/modules' \
  '@platform/(.*controller|.*\.module)' "$CTX_DIR/identity"
check_ctx 'platform imports identity services (unstable surface)' \
  '@identity/.*[Ss]ervice' "$CTX_DIR/platform"
check_ctx 'platform imports identity infrastructure' \
  '@identity/.*infrastructure' "$CTX_DIR/platform"
check_ctx 'platform imports identity controllers/modules' \
  '@identity/(.*controller|.*\.module)' "$CTX_DIR/platform"

exit "$failed"
