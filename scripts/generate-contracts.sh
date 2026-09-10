#!/usr/bin/env sh
set -eu

ROOT_DIR=$(pwd)
cd "$ROOT_DIR"

has_command() {
  command -v "$1" >/dev/null 2>&1
}

run_step() {
  label=$1
  shift

  log_file=$(mktemp)

  printf '[generate] %s\n' "$label"

  if ! "$@" >"$log_file" 2>&1; then
    cat "$log_file"
    rm -f "$log_file"
    exit 1
  fi

  rm -f "$log_file"
}

run_step "Generate shared config artifacts" pnpm --filter @repo/config generate

pnpm --filter api openapi:generate
pnpm --filter api contract:generate

if [ "${SKIP_FLUTTER_GENERATION:-}" = "1" ]; then
  printf '[generate] Skip Flutter/Dart client generation\n'
  exit 0
fi

if ! docker info >/dev/null 2>&1; then
  printf '[generate] warning: Docker unavailable; keeping committed Dart client at apps/mobile/lib/generated/api (run again with Docker to regenerate)\n' >&2
  exit 0
fi

if ! has_command dart; then
  printf '[generate] warning: Dart unavailable; keeping committed Dart client at apps/mobile/lib/generated/api (install Dart to regenerate)\n' >&2
  exit 0
fi

TMP_GEN_DIR="$ROOT_DIR/apps/mobile/lib/generated/.api-tmp"
rm -rf "$TMP_GEN_DIR"
mkdir -p "$TMP_GEN_DIR"
run_step \
  "Generate Dart Dio client" \
  docker run --rm \
  --user "$(id -u):$(id -g)" \
  -v "$ROOT_DIR:/local" \
  openapitools/openapi-generator-cli:v7.16.0 generate \
  -g dart-dio \
  -i /local/apps/api/openapi.json \
  -o /local/apps/mobile/lib/generated/.api-tmp \
  --additional-properties=pubName=super_template_api,pubAuthor=OpenAI,serializationLibrary=built_value,useEnumExtension=true,nullableFields=true
(
  cd "$TMP_GEN_DIR"
  run_step "Install Dart client dependencies" dart pub get
  run_step "Build generated Dart serializers" dart run build_runner build
  rm -rf .dart_tool doc test .openapi-generator pubspec.lock
  run_step "Format generated Dart client" dart format .
)

rm -rf apps/mobile/lib/generated/api
mv "$TMP_GEN_DIR" apps/mobile/lib/generated/api
run_step \
  "Patch generated Dart client" \
  node "$ROOT_DIR/scripts/patch-dart-openapi-client.mjs" apps/mobile/lib/generated/api
if has_command dart; then
  run_step "Format generated Dart client in app" dart format apps/mobile/lib/generated/api
fi
