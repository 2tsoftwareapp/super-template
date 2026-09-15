#!/bin/sh
# Runs once on the topology primary's first start (docker-entrypoint-initdb.d), as the
# `postgres` OS user, while the image entrypoint's temporary server is up.
#
# Its only job is to make streaming replication reachable from the compose network:
#   1. a replication role the replica container can authenticate as, and
#   2. the matching pg_hba.conf rule (the stock image only allows replication from
#      loopback, and the replica connects from a different container).
set -eu

: "${TOPOLOGY_REPLICATION_USER:?TOPOLOGY_REPLICATION_USER is required}"
: "${TOPOLOGY_REPLICATION_PASSWORD:?TOPOLOGY_REPLICATION_PASSWORD is required}"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<SQL
CREATE ROLE "$TOPOLOGY_REPLICATION_USER"
  WITH REPLICATION LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS
  PASSWORD '$TOPOLOGY_REPLICATION_PASSWORD';
SQL

cat >> "$PGDATA/pg_hba.conf" <<EOF

# Topology profile only: allow physical streaming replication from the compose network.
host replication $TOPOLOGY_REPLICATION_USER all scram-sha-256
EOF

echo "[topology-primary] replication role '$TOPOLOGY_REPLICATION_USER' ready"
