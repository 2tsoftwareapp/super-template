import type { INestApplication } from "@nestjs/common";
import { Pool } from "pg";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { bearer, createTestApp, loginAs, resetTestDatabase } from "./support/test-app";

const enabled =
  process.env.RUN_DATABASE_TOPOLOGY_E2E === "1" &&
  Boolean(process.env.DATABASE_URL_TEST) &&
  Boolean(process.env.DATABASE_URL_TEST_READ_REPLICA);

describe.skipIf(!enabled)("Database topology (e2e)", () => {
  let app: INestApplication;
  let primary: Pool;
  let replica: Pool;

  beforeAll(async () => {
    await resetTestDatabase();
    app = await createTestApp();
    primary = new Pool({ connectionString: process.env.DATABASE_URL_TEST });
    replica = new Pool({ connectionString: process.env.DATABASE_URL_TEST_READ_REPLICA });
  });

  afterAll(async () => {
    await app?.close();
    await Promise.all([primary?.end(), replica?.end()]);
  });

  it("connects to primary and replica with restricted non-BYPASSRLS roles", async () => {
    for (const pool of [primary, replica]) {
      const result = await pool.query<{ user: string; superuser: boolean; bypassrls: boolean }>(`
        select current_user as user, rolsuper as superuser, rolbypassrls as bypassrls
        from pg_roles where rolname = current_user
      `);
      expect(result.rows[0]).toMatchObject({ superuser: false, bypassrls: false });
    }
  });

  it("keeps tenant A/B visibility isolated on both configured endpoints", async () => {
    const userSession = await loginAs(app, "user@example.local", "ChangeMe123!");
    const adminSession = await loginAs(app, "admin@example.local", "ChangeMe123!");
    const [userMe, adminMe] = await Promise.all([
      request(app.getHttpServer()).get("/api/v1/auth/me").set(bearer(userSession.accessToken)),
      request(app.getHttpServer()).get("/api/v1/auth/me").set(bearer(adminSession.accessToken)),
    ]);
    const tenantA = userMe.body.data.organizationId as string;
    const tenantB = adminMe.body.data.organizationId as string;
    expect(tenantA).not.toBe(tenantB);

    // m_organizations carries no tenant policy, so isolation has to be asserted on
    // an RLS-protected table. Seed one row per tenant and read it back under each
    // tenant context, so the check does not depend on pre-existing seed rows.
    for (const pool of [primary, replica]) {
      const client = await pool.connect();
      try {
        await client.query("begin");
        await client.query("select set_config('app.bypass_rls', 'false', true)");
        await client.query("select set_config('app.user_id', $1, true)", [userSession.userId]);

        await client.query("select set_config('app.tenant_id', $1, true)", [tenantA]);
        await client.query(
          `insert into t_notifications (user_id, type, title, body, organization_id)
           values ($1, 'TOPOLOGY_ISOLATION', $2, $2, $3)`,
          [userSession.userId, "tenant-a", tenantA],
        );

        await client.query("select set_config('app.tenant_id', $1, true)", [tenantB]);
        await client.query(
          `insert into t_notifications (user_id, type, title, body, organization_id)
           values ($1, 'TOPOLOGY_ISOLATION', $2, $2, $3)`,
          [adminSession.userId, "tenant-b", tenantB],
        );

        await client.query("select set_config('app.tenant_id', $1, true)", [tenantA]);
        const tenantARows = await client.query<{ title: string }>(
          "select title from t_notifications where type = 'TOPOLOGY_ISOLATION' order by title",
        );
        expect(tenantARows.rows.map((row) => row.title)).toEqual(["tenant-a"]);

        await client.query("select set_config('app.tenant_id', $1, true)", [tenantB]);
        const tenantBRows = await client.query<{ title: string }>(
          "select title from t_notifications where type = 'TOPOLOGY_ISOLATION' order by title",
        );
        expect(tenantBRows.rows.map((row) => row.title)).toEqual(["tenant-b"]);
      } finally {
        await client.query("rollback");
        client.release();
      }
    }
  });
});
