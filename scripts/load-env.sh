#!/usr/bin/env sh
# Load layered env files into the current shell. MUST be sourced, e.g.:
#   APP_ENV=staging . ./scripts/load-env.sh
#
# Mirrors the precedence of the Node loader (@repo/env-loader). Shell `source`
# is last-wins, so files are sourced from lowest to highest precedence. The
# authoritative precedence for the apps themselves is enforced by the Node
# loader (where real process env always wins); this helper exists for local dev
# convenience and for feeding docker compose variable substitution.

APP_ENV="${APP_ENV:-development}"

_load_env_file() {
  if [ -f "$1" ]; then
    set -a
    # shellcheck disable=SC1090
    . "$1"
    set +a
  fi
}

# Lowest precedence first.
_load_env_file ".env.example"
_load_env_file ".env"
_load_env_file ".env.$APP_ENV"
if [ "$APP_ENV" != "test" ]; then
  _load_env_file ".env.local"
fi
_load_env_file ".env.$APP_ENV.local"

export APP_ENV

# Dynamically resolve REDIS_PORT and REDIS_URL if Redis port is already in use
if command -v node >/dev/null 2>&1; then
  eval "$(node scripts/resolve-ports.mjs)"
fi
