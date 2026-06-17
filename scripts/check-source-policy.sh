#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(dirname "$0")
ROOT_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
cd "$ROOT_DIR"

failed=0

check_policy() {
  name=$1
  pattern=$2
  message=$3

  output=$(rg -n "$pattern" \
    apps/api/src \
    apps/api/test \
    packages/api-core/src \
    packages/api-database/src \
    packages/api-identity/src \
    packages/api-platform/src \
    packages/api-workspace/src \
    --glob '!**/*.tsbuildinfo' \
    --glob '!**/generated/**' || true)

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
