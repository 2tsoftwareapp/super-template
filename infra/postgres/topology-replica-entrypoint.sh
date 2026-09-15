#!/bin/sh
# Entrypoint for the `topology-replica` service.
#
# First start: wait for the primary to accept replication connections, take a base backup
# with pg_basebackup --write-recovery-conf (which drops standby.signal and writes
# primary_conninfo), then start the server as a hot standby. Later starts: the data
# directory already exists, so it goes straight to standby.
#
# The stock image entrypoint is bypassed on purpose: it would initdb an empty cluster
# instead of restoring one, and `pg_basebackup` has to run before the server does.
set -eu

PGDATA="${PGDATA:-/var/lib/postgresql/18/docker}"
: "${TOPOLOGY_PRIMARY_HOST:?TOPOLOGY_PRIMARY_HOST is required}"
: "${TOPOLOGY_PRIMARY_PORT:?TOPOLOGY_PRIMARY_PORT is required}"
: "${TOPOLOGY_REPLICATION_USER:?TOPOLOGY_REPLICATION_USER is required}"
: "${TOPOLOGY_REPLICATION_PASSWORD:?TOPOLOGY_REPLICATION_PASSWORD is required}"

if [ ! -s "$PGDATA/PG_VERSION" ]; then
  echo "[topology-replica] taking a base backup from ${TOPOLOGY_PRIMARY_HOST}:${TOPOLOGY_PRIMARY_PORT}"
  mkdir -p "$PGDATA"
  chown -R postgres:postgres "$(dirname "$PGDATA")"

  export PGPASSWORD="$TOPOLOGY_REPLICATION_PASSWORD"

  attempts=0
  until gosu postgres pg_basebackup \
    --host="$TOPOLOGY_PRIMARY_HOST" \
    --port="$TOPOLOGY_PRIMARY_PORT" \
    --username="$TOPOLOGY_REPLICATION_USER" \
    --pgdata="$PGDATA" \
    --format=plain \
    --wal-method=stream \
    --write-recovery-conf \
    --checkpoint=fast \
    --progress; do
    attempts=$((attempts + 1))
    if [ "$attempts" -ge 30 ]; then
      echo "[topology-replica] base backup failed after $attempts attempts" >&2
      exit 1
    fi
    echo "[topology-replica] primary not ready yet; retrying ($attempts/30)"
    sleep 2
  done

  unset PGPASSWORD
  echo "[topology-replica] base backup complete; starting standby"
fi

# Postgres refuses to start when the data directory is group/world accessible ("has invalid
# permissions ... should be u=rwx (0700)"), and both mkdir and pg_basebackup leave it 0755.
chown postgres:postgres "$PGDATA"
chmod 0700 "$PGDATA"

exec gosu postgres postgres \
  -c hot_standby=on \
  -c hot_standby_feedback=on \
  -c listen_addresses='*'
