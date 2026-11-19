#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(dirname "$0")
ROOT_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
cd "$ROOT_DIR"

# Fail closed: without rg the import rule below would silently report a pass.
command -v rg >/dev/null 2>&1 || {
  printf 'check-package-cycles: ripgrep (rg) is required; refusing to report a false pass.\n' >&2
  exit 1
}

failed=0

# Features may only import peer features through public entrypoints:
#   @repo/feature-<id>
#   @repo/feature-<id>/contracts
#   @repo/feature-<id>/schema
#   @repo/feature-<id>/module
#   @repo/feature-<id>/testing
# Deep imports into another feature's internals are forbidden.
deep_feature_imports=$(
  rg -n 'from ["'"'"']@repo/feature-[a-z0-9-]+/' packages/feature-*/src \
    --glob '*.ts' --glob '!**/*.spec.ts' \
    | rg -v '/(contracts|schema|module|testing)["'"'"']' \
    || true
)

if [ -n "$deep_feature_imports" ]; then
  failed=1
  printf 'Cross-feature deep import (use /contracts, /schema, or /module):\n%s\n' \
    "$deep_feature_imports" >&2
fi

# Real cycle detection over workspace runtime dependencies. (The former
# "features must not import apps" grep now lives only in check-source-policy.sh.)
if ! node scripts/check-package-cycles.mjs; then
  failed=1
fi

exit "$failed"
