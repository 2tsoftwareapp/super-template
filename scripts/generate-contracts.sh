#!/usr/bin/env sh
set -eu

ROOT_DIR=$(pwd)
cd "$ROOT_DIR"

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

pnpm --filter api contract:generate
mkdir -p apps/mobile/lib/generated/api
run_step \
  "Generate Dart Dio client" \
  docker run --rm \
  --user "$(id -u):$(id -g)" \
  -v "$ROOT_DIR:/local" \
  openapitools/openapi-generator-cli:v7.16.0 generate \
  -g dart-dio \
  -i /local/apps/api/openapi.json \
  -o /local/apps/mobile/lib/generated/api \
  --additional-properties=pubName=super_template_api,pubAuthor=OpenAI,serializationLibrary=built_value,useEnumExtension=true,nullableFields=true
(
  cd apps/mobile/lib/generated/api
  rm -f lib/src/model/send_notification_dto.dart lib/src/model/send_notification_dto.g.dart
  run_step "Install Dart client dependencies" dart pub get
  run_step "Build generated Dart serializers" dart run build_runner build
  node -e "
const fs = require('fs');
const path = require('path');
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(p);
    else if (entry.name.endsWith('.dart')) {
      let src = fs.readFileSync(p, 'utf8');
      // Remove unused json_object import injected by openapi-generator.
      src = src.replace(/^import 'package:built_value\\/json_object\\.dart';\\n/gm, '');
      // Add explicit language version so library and part files match under
      // Flutter's patched Dart SDK (avoids CFE language-version-override error).
      if (!src.includes('// @dart=')) {
        const lines = src.split('\\n');
        let insert = 0;
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].trim() !== '' && !lines[i].startsWith('//')) {
            insert = i;
            break;
          }
        }
        lines.splice(insert, 0, '// @dart=3.0', '');
        src = lines.join('\\n');
      }
      fs.writeFileSync(p, src);
    }
  }
}
walk('lib');
"
  rm -rf .dart_tool doc test .openapi-generator pubspec.lock
  run_step "Format generated Dart client" dart format .
)
