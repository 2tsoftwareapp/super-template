#!/usr/bin/env sh
set -eu

SCRIPT_DIR=$(dirname "$0")
ROOT_DIR=$(cd "$SCRIPT_DIR/.." && pwd)
cd "$ROOT_DIR"

# `turbo boundaries` inspects local workspace files, so ignored build outputs
# can create false boundary violations after a previous build.
find packages -mindepth 2 -maxdepth 2 -type d -name dist -prune -exec rm -rf {} +
