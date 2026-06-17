#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(dirname "$0")
ROOT_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
cd "$ROOT_DIR"

failed=0
SEARCH_DIRS="
apps/api/src
apps/api/test
packages/api-core/src
packages/api-database/src
packages/api-identity/src
packages/api-platform/src
packages/api-workspace/src
"

search_matches() {
  pattern=$1

  if command -v rg >/dev/null 2>&1; then
    rg -n "$pattern" \
      apps/api/src \
      apps/api/test \
      packages/api-core/src \
      packages/api-database/src \
      packages/api-identity/src \
      packages/api-platform/src \
      packages/api-workspace/src \
      --glob '!**/*.tsbuildinfo' \
      --glob '!**/generated/**'
    return
  fi

  find \
    apps/api/src \
    apps/api/test \
    packages/api-core/src \
    packages/api-database/src \
    packages/api-identity/src \
    packages/api-platform/src \
    packages/api-workspace/src \
    \( -path '*/generated/*' -o -name '*.tsbuildinfo' \) -prune -o \
    -type f -print |
    xargs grep -nE "$pattern"
}

check_policy() {
  name=$1
  pattern=$2
  message=$3

  output=$(search_matches "$pattern" || true)

  if [ -n "$output" ]; then
    failed=1
    printf 'Policy violation: %s\n' "$name" >&2
    printf '%s\n' "$output" >&2
    printf '%s\n' "$message" >&2
  fi
}

check_policy '@boundaries-ignore' '@boundaries-ignore' 'Remove boundary-ignore comments and fix the underlying import surface.'
check_policy 'explicit any' ':\s*any\b|<\s*any\s*>|\bas\s+any\b' 'Use concrete types instead of explicit any.'

exit "$failed"
