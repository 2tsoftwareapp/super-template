#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(dirname "$0")
ROOT_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
cd "$ROOT_DIR"

failed=0

# Features may only import peer features through public entrypoints:
#   @repo/feature-<id>
#   @repo/feature-<id>/contracts
#   @repo/feature-<id>/schema
#   @repo/feature-<id>/module
#   @repo/feature-<id>/testing
# Deep imports into another feature's internals are forbidden.

if command -v rg >/dev/null 2>&1; then
  deep_feature_imports=$(
    rg -n 'from ["'\'']@repo/feature-[a-z0-9-]+/' packages/feature-*/src \
      --glob '*.ts' --glob '!**/*.spec.ts' \
      | rg -v '/(contracts|schema|module|testing)["'\'']' \
      || true
  )
  if [ -n "$deep_feature_imports" ]; then
    failed=1
    printf 'Cross-feature deep import (use /contracts, /schema, or /module):\n%s\n' \
      "$deep_feature_imports" >&2
  fi

  # Features must not import apps/*
  apps_imports=$(
    rg -n 'from ["'\''](@/|apps/)' packages/feature-*/src \
      --glob '*.ts' --glob '!**/*.spec.ts' || true
  )
  if [ -n "$apps_imports" ]; then
    failed=1
    printf 'Features must not import apps/*:\n%s\n' "$apps_imports" >&2
  fi
fi

exit "$failed"
