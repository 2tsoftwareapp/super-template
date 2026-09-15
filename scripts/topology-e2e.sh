#!/usr/bin/env bash
# Opt-in primary + streaming read-replica pair for the database topology e2e suite
# (`apps/api/test/database-topology.e2e.spec.ts`).
#
# What it does, in order:
#   1. starts `topology-primary` + `topology-replica` (docker compose profile `topology`),
#   2. creates the test database on the primary and applies migrations with the repo's own
#      `pnpm --filter api db:migrate` (which also creates the restricted app role and grants),
#   3. seeds it with `pnpm --filter api db:seed`,
#   4. waits for the replica to replay both,
#   5. runs the topology spec with the four DATABASE_TOPOLOGY_* variables set.
#
# Usage:
#   scripts/topology-e2e.sh              # topology spec only
#   scripts/topology-e2e.sh --all        # whole API e2e suite against the pair
#   scripts/topology-e2e.sh --skip-up    # reuse an already running pair
#   scripts/topology-e2e.sh --down       # stop the pair and delete its data volumes
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

COMPOSE=(docker compose -f infra/docker-compose.yml --env-file .env --profile topology)
PRIMARY_SERVICE="topology-primary"
REPLICA_SERVICE="topology-replica"

# Same database/role the rest of the e2e suite uses; migration 0007/0008 create the role and
# its grants, so nothing here hardcodes privileges.
TEST_DATABASE_NAME="fullstack_starter_test"
APP_ROLE="fullstack_starter_app"
APP_ROLE_PASSWORD="fullstack_starter_app"

suite_scope="topology"
start_stack=1
teardown=0

for arg in "$@"; do
  case "$arg" in
    --all) suite_scope="all" ;;
    --skip-up) start_stack=0 ;;
    --down) teardown=1 ;;
    -h | --help)
      sed -n '2,14p' "${BASH_SOURCE[0]}" | sed 's/^#\{1,2\} \{0,1\}//'
      exit 0
      ;;
    *)
      printf 'Unknown argument: %s\n' "$arg" >&2
      exit 2
      ;;
  esac
done

if [ "$teardown" -eq 1 ]; then
  echo "[topology] removing the primary + replica pair and its data volumes"
  "${COMPOSE[@]}" down -v
  exit 0
fi

# shellcheck disable=SC1091
. ./scripts/load-env.sh

primary_port="${TOPOLOGY_PRIMARY_PORT:-65434}"
replica_port="${TOPOLOGY_REPLICA_PORT:-65435}"
postgres_user="${POSTGRES_USER:-postgres}"
postgres_password="${POSTGRES_PASSWORD:-postgres}"

admin_url="postgresql://${postgres_user}:${postgres_password}@localhost:${primary_port}/${TEST_DATABASE_NAME}"
app_url="postgresql://${APP_ROLE}:${APP_ROLE_PASSWORD}@localhost:${primary_port}/${TEST_DATABASE_NAME}"
replica_app_url="postgresql://${APP_ROLE}:${APP_ROLE_PASSWORD}@localhost:${replica_port}/${TEST_DATABASE_NAME}"
privileged_replica_url="postgresql://${postgres_user}:${postgres_password}@localhost:${replica_port}/${TEST_DATABASE_NAME}"

# Scoped to the commands that talk to the pair, never exported into the shell:
#
#   * POSTGRES_EXPOSED_PORT / POSTGRES_PORT pin @repo/env-loader at the topology primary.
#     Without them it rewrites every DATABASE_* URL to the port compose reports for the
#     running *dev* `postgres` service, so `db:migrate` and the e2e run-scope advisory lock
#     would target the wrong instance.
#   * They must not be exported, because `docker compose` substitutes the same names and a
#     shell value overrides `--env-file`: exporting POSTGRES_EXPOSED_PORT makes compose
#     remap the dev postgres service to that port and try to recreate it.
pair_env=(
  "POSTGRES_EXPOSED_PORT=${primary_port}"
  "POSTGRES_PORT=${primary_port}"
  "DATABASE_URL_TEST=${app_url}"
  "DATABASE_URL_TEST_ADMIN=${admin_url}"
  "DATABASE_TOPOLOGY_PRIMARY_URL=${app_url}"
  "DATABASE_TOPOLOGY_REPLICA_URL=${replica_app_url}"
  "DATABASE_TOPOLOGY_ADMIN_URL=${admin_url}"
  # The optional negative test asserts that this endpoint really is privileged (superuser or
  # BYPASSRLS) - the replica's `postgres` role is exactly the value that test documents.
  "DATABASE_TOPOLOGY_PRIVILEGED_REPLICA_URL=${privileged_replica_url}"
)

if [ "$start_stack" -eq 1 ]; then
  echo "[topology] starting $PRIMARY_SERVICE + $REPLICA_SERVICE"
  # Named explicitly: the profile is not the only thing in this compose file, and `--wait`
  # fails the whole command when it sees the dev stack's run-to-completion `minio-init`.
  "${COMPOSE[@]}" up -d --wait --wait-timeout 180 "$PRIMARY_SERVICE" "$REPLICA_SERVICE"
fi

echo "[topology] ensuring database ${TEST_DATABASE_NAME} exists on the primary"
database_exists="$("${COMPOSE[@]}" exec -T "$PRIMARY_SERVICE" psql -At -U "$postgres_user" -d postgres -c "select 1 from pg_database where datname = '${TEST_DATABASE_NAME}'")"
if [ "$database_exists" != "1" ]; then
  "${COMPOSE[@]}" exec -T "$PRIMARY_SERVICE" psql -v ON_ERROR_STOP=1 -U "$postgres_user" -d postgres -c "create database \"${TEST_DATABASE_NAME}\""
fi

echo "[topology] applying migrations on the primary"
env "${pair_env[@]}" DATABASE_MIGRATE_URL="$admin_url" pnpm --filter api db:migrate

echo "[topology] seeding the pair"
# The spec reads one user row through the primary (auth rotation/revocation test), so the
# database needs the same seed every other e2e file gets via `seedDatabase`. Seeding runs
# through the restricted app role, like a normal `pnpm --filter api db:seed`.
env "${pair_env[@]}" DATABASE_URL="$app_url" DATABASE_MIGRATE_URL="$admin_url" pnpm --filter api db:seed

echo "[topology] waiting for the replica to replay the migrated schema"
replica_ready=""
for _ in $(seq 1 60); do
  # 'ready'/'waiting' instead of a cast boolean: an explicit ::text cast renders booleans as
  # true/false, while psql's own format is t/f.
  replica_ready="$("${COMPOSE[@]}" exec -T "$REPLICA_SERVICE" psql -At -U "$postgres_user" -d "$TEST_DATABASE_NAME" -c "select case when pg_is_in_recovery() and to_regclass('public.m_users') is not null then 'ready' else 'waiting' end" 2>/dev/null || true)"
  if [ "$replica_ready" = "ready" ]; then
    break
  fi
  sleep 2
done

if [ "$replica_ready" != "ready" ]; then
  echo "[topology] the replica never caught up with the primary." >&2
  echo "[topology] If the pair was previously started against a different primary, reset it:" >&2
  echo "[topology]   scripts/topology-e2e.sh --down && scripts/topology-e2e.sh" >&2
  exit 1
fi

echo "[topology] replica state:"
"${COMPOSE[@]}" exec -T "$REPLICA_SERVICE" psql -U "$postgres_user" -d "$TEST_DATABASE_NAME" -c \
  "select pg_is_in_recovery() as in_recovery, pg_last_wal_receive_lsn() as received_lsn, pg_last_wal_replay_lsn() as replayed_lsn"

if [ "$suite_scope" = "all" ]; then
  echo "[topology] running the full API e2e suite against the pair"
  env "${pair_env[@]}" pnpm --filter api test:e2e
else
  echo "[topology] running the database topology spec against the pair"
  env "${pair_env[@]}" pnpm --filter api exec vitest run --config vitest.e2e.config.ts test/database-topology.e2e.spec.ts --maxWorkers=1
fi
