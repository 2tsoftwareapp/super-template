import { randomUUID } from "node:crypto";

import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

/**
 * Opt-in against a real primary/read-replica pair. The pair must be migrated
 * and reachable through DATABASE_TOPOLOGY_PRIMARY_URL and
 * DATABASE_TOPOLOGY_REPLICA_URL; DATABASE_TOPOLOGY_ADMIN_URL must target the
 * primary database for temporary probe-table cleanup. A privileged negative
 * endpoint may be supplied through DATABASE_TOPOLOGY_PRIVILEGED_REPLICA_URL.
 */
const primaryUrl = process.env.DATABASE_TOPOLOGY_PRIMARY_URL;
const replicaUrl = process.env.DATABASE_TOPOLOGY_REPLICA_URL;
const adminUrl = process.env.DATABASE_TOPOLOGY_ADMIN_URL;
const topologyEnabled = Boolean(primaryUrl && replicaUrl && adminUrl);
const configuredPrimaryUrl = primaryUrl ?? "";
const configuredReplicaUrl = replicaUrl ?? "";
const configuredAdminUrl = adminUrl ?? "";

const quoteIdentifier = (value: string): string => `"${value.replaceAll('"', '""')}"`;

describe.skipIf(!topologyEnabled)("Database topology (real PostgreSQL pair)", () => {
  const tableName = `topology_probe_${process.pid}_${Date.now()}`;
  const policyName = `${tableName}_tenant_policy`;
  let primary: Client;
  let replica: Client;
  let admin: Client;

  const setTenant = async (client: Client, tenantId: string) => {
    await client.query(
      "select set_config('app.tenant_id', $1, false), set_config('app.user_id', '', false), set_config('app.bypass_rls', 'false', false)",
      [tenantId],
    );
  };

  const readTenantValues = async (client: Client, tenantId: string): Promise<string[]> => {
    await setTenant(client, tenantId);
    const result = await client.query<{ value: string }>(
      `select value from ${quoteIdentifier(tableName)} order by value`,
    );
    return result.rows.map((row) => row.value);
  };

  const waitForReplica = async (check: () => Promise<boolean>): Promise<void> => {
    const deadline = Date.now() + 15_000;
    let lastError: unknown;
    while (Date.now() < deadline) {
      try {
        if (await check()) return;
      } catch (error) {
        lastError = error;
      }
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    throw lastError instanceof Error
      ? lastError
      : new Error("Read replica did not converge before the integration-test timeout");
  };

  beforeAll(async () => {
    primary = new Client({ connectionString: configuredPrimaryUrl });
    replica = new Client({ connectionString: configuredReplicaUrl });
    admin = new Client({ connectionString: configuredAdminUrl });
    await Promise.all([primary.connect(), replica.connect(), admin.connect()]);

    const roles = await Promise.all(
      [primary, replica].map(async (client) => {
        const result = await client.query<{
          currentUser: string;
          isSuperuser: boolean;
          bypassesRls: boolean;
        }>(
          'select current_user as "currentUser", rolsuper as "isSuperuser", rolbypassrls as "bypassesRls" from pg_roles where rolname = current_user',
        );
        return result.rows[0];
      }),
    );
    for (const role of roles) {
      expect(role).toBeDefined();
      expect(role?.isSuperuser).toBe(false);
      expect(role?.bypassesRls).toBe(false);
    }

    await admin.query(
      `create table ${quoteIdentifier(tableName)} (tenant_id uuid not null, value text not null)`,
    );
    await admin.query(`alter table ${quoteIdentifier(tableName)} enable row level security`);
    await admin.query(`alter table ${quoteIdentifier(tableName)} force row level security`);
    await admin.query(
      `create policy ${quoteIdentifier(policyName)} on ${quoteIdentifier(tableName)} as permissive for all to public using (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid) with check (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)`,
    );

    const primaryRole = await primary.query<{ currentUser: string }>(
      'select current_user as "currentUser"',
    );
    const replicaRole = await replica.query<{ currentUser: string }>(
      'select current_user as "currentUser"',
    );
    for (const role of [primaryRole.rows[0]?.currentUser, replicaRole.rows[0]?.currentUser]) {
      if (role) {
        await admin.query(
          `grant select, insert, update, delete on table ${quoteIdentifier(tableName)} to ${quoteIdentifier(role)}`,
        );
      }
    }

    await waitForReplica(async () => {
      await replica.query(`select 1 from ${quoteIdentifier(tableName)} limit 1`);
      return true;
    });
  });

  afterAll(async () => {
    await admin?.query(`drop table if exists ${quoteIdentifier(tableName)}`).catch(() => undefined);
    await Promise.all([primary?.end(), replica?.end(), admin?.end()]);
  });

  it("keeps tenant A and tenant B isolated on both endpoints", async () => {
    const tenantA = randomUUID();
    const tenantB = randomUUID();

    await setTenant(primary, tenantA);
    await primary.query(
      `insert into ${quoteIdentifier(tableName)} (tenant_id, value) values ($1, $2)`,
      [tenantA, "tenant-a"],
    );
    await setTenant(primary, tenantB);
    await primary.query(
      `insert into ${quoteIdentifier(tableName)} (tenant_id, value) values ($1, $2)`,
      [tenantB, "tenant-b"],
    );

    expect(await readTenantValues(primary, tenantA)).toEqual(["tenant-a"]);
    expect(await readTenantValues(primary, tenantB)).toEqual(["tenant-b"]);

    await waitForReplica(async () => {
      const valuesA = await readTenantValues(replica, tenantA);
      const valuesB = await readTenantValues(replica, tenantB);
      return valuesA.length === 1 && valuesB.length === 1;
    });
    expect(await readTenantValues(replica, tenantA)).toEqual(["tenant-a"]);
    expect(await readTenantValues(replica, tenantB)).toEqual(["tenant-b"]);
  });

  it("uses independent primary and replica endpoints", () => {
    const primaryEndpoint = new URL(configuredPrimaryUrl).host;
    const replicaEndpoint = new URL(configuredReplicaUrl).host;
    expect(replicaEndpoint).not.toBe(primaryEndpoint);
  });

  it("observes auth rotation and revocation immediately through the primary", async () => {
    const user = await primary.query<{ id: string }>("select id from m_users limit 1");
    const userId = user.rows[0]?.id;
    expect(userId).toBeDefined();
    if (!userId) return;

    const sessionId = randomUUID();
    await primary.query(
      "insert into t_auth_sessions (id, user_id, refresh_token_hash, expires_at) values ($1, $2, $3, now() + interval '1 hour')",
      [sessionId, userId, "rotation-before"],
    );
    await primary.query(
      "update t_auth_sessions set refresh_token_hash = $1, updated_at = now() where id = $2 and refresh_token_hash = $3",
      ["rotation-after", sessionId, "rotation-before"],
    );
    const rotated = await primary.query<{ refresh_token_hash: string; revoked_at: Date | null }>(
      "select refresh_token_hash, revoked_at from t_auth_sessions where id = $1",
      [sessionId],
    );
    expect(rotated.rows[0]).toMatchObject({
      refresh_token_hash: "rotation-after",
      revoked_at: null,
    });

    await primary.query(
      "update t_auth_sessions set revoked_at = now(), updated_at = now() where id = $1",
      [sessionId],
    );
    const revoked = await primary.query<{ revoked_at: Date | null }>(
      "select revoked_at from t_auth_sessions where id = $1",
      [sessionId],
    );
    expect(revoked.rows[0]?.revoked_at).not.toBeNull();
    await primary.query("delete from t_auth_sessions where id = $1", [sessionId]);
  });

  it.skipIf(!process.env.DATABASE_TOPOLOGY_PRIVILEGED_REPLICA_URL)(
    "fails the RLS guard for a privileged replica role",
    async () => {
      const privileged = new Client({
        connectionString: process.env.DATABASE_TOPOLOGY_PRIVILEGED_REPLICA_URL,
      });
      await privileged.connect();
      try {
        const result = await privileged.query<{ isSuperuser: boolean; bypassesRls: boolean }>(
          'select rolsuper as "isSuperuser", rolbypassrls as "bypassesRls" from pg_roles where rolname = current_user',
        );
        expect(result.rows[0]?.isSuperuser || result.rows[0]?.bypassesRls).toBe(true);
      } finally {
        await privileged.end();
      }
    },
  );
});
