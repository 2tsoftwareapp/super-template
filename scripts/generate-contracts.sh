#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

run_step() {
  local label="$1"
  shift

  local log_file
  log_file="$(mktemp)"

  printf '[generate] %s\n' "$label"

  if ! "$@" >"$log_file" 2>&1; then
    cat "$log_file"
    rm -f "$log_file"
    exit 1
  fi

  rm -f "$log_file"
}

pnpm --filter api openapi:generate
pnpm --filter api contract:generate
mkdir -p apps/mobile/lib/generated/api
run_step \
  "Generate Dart Dio client" \
  docker run --rm \
  -v "$ROOT_DIR:/local" \
  openapitools/openapi-generator-cli:v7.16.0 generate \
  -g dart-dio \
  -i /local/apps/api/openapi.json \
  -o /local/apps/mobile/lib/generated/api \
  --additional-properties=pubName=super_template_api,pubAuthor=OpenAI,serializationLibrary=built_value,useEnumExtension=true,nullableFields=true
(
  cd apps/mobile/lib/generated/api
  run_step "Install Dart client dependencies" dart pub get
  run_step "Build generated Dart serializers" dart run build_runner build
  find lib/src/api -name '*.dart' -print0 | xargs -0 sed -i '' "/import 'package:built_value\\/json_object.dart';/d"
  rm -rf .dart_tool doc test .openapi-generator pubspec.lock
  run_step "Format generated Dart client" dart format .
)
