#!/usr/bin/env sh
set -eu

# Verifies that generated contract output is up to date without leaving
# changes in the source tree. Runs generation, then fails if the generated
# paths drifted from what is committed. Any drift is reverted so the working
# tree is left clean (non-mutating in effect).

ROOT_DIR=$(pwd)
cd "$ROOT_DIR"

# Paths owned by the generation pipeline. Dart/Flutter output is checked only
# when its Docker and Dart toolchain is available; otherwise generation keeps
# the committed client intact and the check intentionally excludes that path.
GENERATED_PATHS="apps/api/openapi.json packages/api-contract/src/generated"
if [ "${CI:-}" != "true" ] && command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1 && command -v dart >/dev/null 2>&1; then
  GENERATED_PATHS="$GENERATED_PATHS apps/mobile/lib/generated/api"
fi

cleanup() {
  # Always restore the working tree for the generated paths so the check never
  # leaves changes behind, regardless of pass/fail.
  git checkout -- $GENERATED_PATHS >/dev/null 2>&1 || true
}
trap cleanup EXIT

printf '[generate:check] Regenerating contracts\n'
sh "$ROOT_DIR/scripts/generate-contracts.sh"

printf '[generate:check] Checking for drift in generated output\n'
if ! git diff --exit-code -- $GENERATED_PATHS; then
  printf '[generate:check] Generated output is out of date. Run `make generate` (or `pnpm run generate:contracts`) and commit the result.\n' >&2
  exit 1
fi

printf '[generate:check] Generated output is up to date\n'
