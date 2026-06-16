#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
DEMO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

ANDROID_TARGET="$ROOT_DIR/apps/mobile/android/app/google-services.json"
ANDROID_SOURCE="$DEMO_DIR/config/google-services.json"

if [[ ! -f "$ANDROID_SOURCE" ]]; then
  echo "Missing $ANDROID_SOURCE"
  exit 1
fi

mkdir -p "$(dirname "$ANDROID_TARGET")"
cp "$ANDROID_SOURCE" "$ANDROID_TARGET"

echo "Linked Android config:"
echo "  $ANDROID_SOURCE"
echo "  -> $ANDROID_TARGET"
