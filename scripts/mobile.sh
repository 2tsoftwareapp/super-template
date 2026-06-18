#!/usr/bin/env sh
set -eu

ROOT_DIR=$(git rev-parse --show-toplevel 2>/dev/null || pwd)
MOBILE_DIR="$ROOT_DIR/apps/mobile"
HOME_DIR="${USERPROFILE:-${HOME:-}}"

print_install_hint() {
  if [ "$(uname -s 2>/dev/null | tr '[:upper:]' '[:lower:]')" = "mingw32_nt-10.0" ] || [ -n "${USERPROFILE:-}" ]; then
    printf '%s\n' 'Flutter/Dart is not available on PATH.' >&2
    printf '%s\n' 'Install Flutter SDK, Android Studio, and required Windows toolchain first.' >&2
    printf '%s\n' 'Then reopen PowerShell and rerun `pnpm run mobile:doctor`.' >&2
  else
    printf '%s\n' 'Flutter/Dart is not available on PATH.' >&2
    printf '%s\n' 'Install Flutter SDK and platform toolchains first.' >&2
    printf '%s\n' 'Then rerun `pnpm run mobile:doctor`.' >&2
  fi
}

resolve_flutter() {
  if command -v flutter >/dev/null 2>&1; then
    command -v flutter
    return 0
  fi

  if [ -n "$HOME_DIR" ] && [ -f "$HOME_DIR/scoop/apps/flutter/current/bin/flutter.bat" ]; then
    printf '%s\n' "$HOME_DIR/scoop/apps/flutter/current/bin/flutter.bat"
    return 0
  fi

  return 1
}

resolve_dart() {
  if command -v dart >/dev/null 2>&1; then
    command -v dart
    return 0
  fi

  if [ -n "$HOME_DIR" ] && [ -x "$HOME_DIR/scoop/apps/flutter/current/bin/cache/dart-sdk/bin/dart.exe" ]; then
    printf '%s\n' "$HOME_DIR/scoop/apps/flutter/current/bin/cache/dart-sdk/bin/dart.exe"
    return 0
  fi

  if [ -n "$HOME_DIR" ] && [ -f "$HOME_DIR/scoop/apps/flutter/current/bin/dart.bat" ]; then
    printf '%s\n' "$HOME_DIR/scoop/apps/flutter/current/bin/dart.bat"
    return 0
  fi

  return 1
}

run_cmd() {
  cmd_path=$1
  shift

  if [ "${cmd_path##*.}" = "bat" ] || [ "${cmd_path##*.}" = "cmd" ]; then
    "$cmd_path" "$@"
    return $?
  fi

  "$cmd_path" "$@"
}

run_mobile_cmd() {
  cmd_path=$1
  shift

  (
    cd "$MOBILE_DIR"
    run_cmd "$cmd_path" "$@"
  )
}

resolve_env_file() {
  if [ "$#" -lt 1 ]; then
    printf '%s\n' 'env/dev.json'
    return 0
  fi

  while [ "$#" -gt 0 ]; do
    if [ "$1" = "--env" ]; then
      if [ "$#" -lt 2 ]; then
        printf '%s\n' 'Missing value for --env' >&2
        exit 1
      fi
      printf '%s\n' "$2"
      return 0
    fi
    shift
  done

  printf '%s\n' 'env/dev.json'
}

case "${1:-help}" in
  doctor)
    shift || true
    flutter_cmd=$(resolve_flutter || true)
    dart_cmd=$(resolve_dart || true)

    if [ -z "${flutter_cmd:-}" ] || [ -z "${dart_cmd:-}" ]; then
      print_install_hint
      exit 1
    fi

    run_mobile_cmd "$flutter_cmd" doctor "$@"
    ;;
  setup)
    shift || true
    flutter_cmd=$(resolve_flutter || true)

    if [ -z "${flutter_cmd:-}" ]; then
      print_install_hint
      exit 1
    fi

    run_mobile_cmd "$flutter_cmd" pub get
    ;;
  dev)
    shift || true
    flutter_cmd=$(resolve_flutter || true)

    if [ -z "${flutter_cmd:-}" ]; then
      print_install_hint
      exit 1
    fi

    env_file=$(resolve_env_file "$@")
    run_mobile_cmd "$flutter_cmd" run "--dart-define-from-file=$env_file"
    ;;
  test)
    shift || true
    flutter_cmd=$(resolve_flutter || true)

    if [ -z "${flutter_cmd:-}" ]; then
      print_install_hint
      exit 1
    fi

    run_mobile_cmd "$flutter_cmd" test "$@"
    ;;
  analyze)
    shift || true
    flutter_cmd=$(resolve_flutter || true)

    if [ -z "${flutter_cmd:-}" ]; then
      print_install_hint
      exit 1
    fi

    run_mobile_cmd "$flutter_cmd" analyze "$@"
    ;;
  format)
    shift || true
    dart_cmd=$(resolve_dart || true)

    if [ -z "${dart_cmd:-}" ]; then
      print_install_hint
      exit 1
    fi

    run_mobile_cmd "$dart_cmd" format . "$@"
    ;;
  format-check)
    shift || true
    dart_cmd=$(resolve_dart || true)

    if [ -z "${dart_cmd:-}" ]; then
      print_install_hint
      exit 1
    fi

    run_mobile_cmd "$dart_cmd" format --set-exit-if-changed . "$@"
    ;;
  help|-h|--help)
    cat <<'EOF'
Usage: scripts/mobile.sh <command> [options]

Commands:
  doctor                Check Flutter/Dart availability and run flutter doctor
  setup                 Run flutter pub get in apps/mobile
  dev [--env <file>]    Run flutter app with --dart-define-from-file
  test                  Run flutter test
  analyze               Run flutter analyze
  format                Run dart format and rewrite files in place
  format-check          Run dart format --set-exit-if-changed .
  help                  Show this help

Examples:
  pnpm run mobile:doctor
  pnpm run mobile:setup
  pnpm run mobile:dev
  pnpm run mobile:test
EOF
    ;;
  *)
    printf '%s\n' "Unknown mobile command: ${1:-}" >&2
    "$0" help
    exit 1
    ;;
esac
