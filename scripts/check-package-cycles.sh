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

record_violation \
  'identity must not import platform application services' \
  'Depend on api-core ports instead of concrete platform services.' \
  "from '@repo/api-platform/modules/.+/application/" \
  packages/api-identity/src

record_violation \
  'identity must not import platform infrastructure' \
  'Depend on api-core ports instead of concrete platform repositories.' \
  "from '@repo/api-platform/modules/.+/infrastructure/" \
  packages/api-identity/src

record_violation \
  'platform must not import identity application services' \
  'Depend on api-core ports instead of concrete identity services.' \
  "from '@repo/api-identity/modules/.+/application/" \
  packages/api-platform/src

record_violation \
  'platform must not import identity infrastructure' \
  'Depend on api-core ports instead of concrete identity repositories.' \
  "from '@repo/api-identity/modules/.+/infrastructure/" \
  packages/api-platform/src

record_violation \
  'identity must not import cross-context Nest modules' \
  'Register providers via global *PortsModule and depend on api-core port tokens.' \
  "from '@repo/api-platform/modules/.+\\.module'" \
  packages/api-identity/src

record_violation \
  'platform must not import cross-context Nest modules' \
  'Register providers via global *PortsModule and depend on api-core port tokens.' \
  "from '@repo/api-identity/modules/.+\\.module'" \
  packages/api-platform/src

exit "$failed"
