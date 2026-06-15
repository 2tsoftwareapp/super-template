#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

./scripts/generate-contracts.sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
(cd apps/mobile && dart format --set-exit-if-changed .)
(cd apps/mobile && flutter analyze)
(cd apps/mobile && flutter test)
