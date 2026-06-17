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
      --glob '!**/*.module.ts' \
      --glob '!**/generated/**'
    return
  fi

  find "$@" \
    \( -path '*/generated/*' -o -name '*.spec.ts' -o -name '*.module.ts' \) -prune -o \
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
  'identity must not import platform/workspace application services' \
  'Depend on api-core ports instead of concrete platform/workspace services.' \
  "from '@repo/api-platform/modules/.+/application/" \
  packages/api-identity/src

record_violation \
  'identity must not import platform/workspace infrastructure' \
  'Depend on api-core ports instead of concrete platform/workspace repositories.' \
  "from '@repo/api-platform/modules/.+/infrastructure/" \
  packages/api-identity/src

record_violation \
  'identity must not import workspace services' \
  'Depend on api-core ports instead of concrete workspace services.' \
  "from '@repo/api-workspace/" \
  packages/api-identity/src

record_violation \
  'platform must not import workspace services' \
  'Depend on api-core ports instead of concrete workspace services.' \
  "from '@repo/api-workspace/modules/.+/application/" \
  packages/api-platform/src

record_violation \
  'workspace must not import identity/platform application services' \
  'Depend on api-core ports instead of concrete identity/platform services.' \
  "from '@repo/api-identity/modules/.+/application/" \
  packages/api-workspace/src

record_violation \
  'workspace must not import identity/platform infrastructure' \
  'Depend on api-core ports instead of concrete identity/platform repositories.' \
  "from '@repo/api-identity/modules/.+/infrastructure/" \
  packages/api-workspace/src

record_violation \
  'workspace must not import platform application services' \
  'Depend on api-core ports instead of concrete platform services.' \
  "from '@repo/api-platform/modules/.+/application/" \
  packages/api-workspace/src

record_violation \
  'workspace must not import platform infrastructure' \
  'Depend on api-core ports instead of concrete platform repositories.' \
  "from '@repo/api-platform/modules/.+/infrastructure/" \
  packages/api-workspace/src

exit "$failed"
