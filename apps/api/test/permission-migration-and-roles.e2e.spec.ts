import type { INestApplication } from "@nestjs/common";

import { randomUUID } from "node:crypto";
import { ACCESS_CONTROL_REPOSITORY, type AccessControlRepositoryPort } from "@repo/feature-identity";
import { RoleManagementUseCase } from "@repo/feature-identity/modules/access-control/application/use-cases/role-management.use-case";
import { seedDatabase } from "../src/cli/seeds/seed-data";
import { Pool } from "pg";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { applySqlMigrations } from "../src/cli/migrations";
import { bearer, createTestApp, loginAs, resetTestDatabase } from "./support/test-app";

interface RoleDto {
  id: string;
  name: string;
  organizationId: string | null;
}

interface AuthMeDto {
  organizationId: string;
}

interface CreatedUserDto {
  id: string;
  roles: string[];
}

interface PaginatedRolesResponse {
  data: RoleDto[];
  meta: {
    total: number;
    totalPages: number;
  };
}

interface ErrorResponse {
  error: {
    code: string;
  };
}

const firstRow = <T>(rows: T[], message: string): T => {
  const row = rows[0];
  if (!row) {
    throw new Error(message);
  }
  return row;
};

const expectPostgresError = async (operation: Promise<unknown>, code: string): Promise<void> => {
  await expect(operation).rejects.toMatchObject({ code });
};

const createOrganization = async (pool: Pool, label: string): Promise<string> => {
  const suffix = randomUUID();
  const result = await pool.query<{ id: string }>(
    `
      INSERT INTO m_organizations (name, slug)
      VALUES ($1, $2)
      RETURNING id
    `,
    [label, `${label.toLowerCase().replaceAll(" ", "-")}-${suffix}`],
  );

  return firstRow(result.rows, "Organization fixture was not created").id;
};

const createUser = async (pool: Pool, label: string): Promise<string> => {
  const suffix = randomUUID();
  const result = await pool.query<{ id: string }>(
    `
      INSERT INTO m_users (email, password_hash, display_name, status)
      VALUES ($1, $2, $3, 'ACTIVE')
      RETURNING id
    `,
    [`${label}-${suffix}@example.local`, "not-used", label],
  );

  return firstRow(result.rows, "User fixture was not created").id;
};

describe("Roles migration and provisioning (e2e)", () => {
  let app: INestApplication;
  let pool: Pool;
  let repository: AccessControlRepositoryPort;
  let roleManagement: RoleManagementUseCase;

  beforeAll(async () => {
    await resetTestDatabase();
    app = await createTestApp();

    const connectionString = process.env.DATABASE_URL_TEST_ADMIN ?? process.env.DATABASE_URL_TEST;
    if (!connectionString) {
      throw new Error("A PostgreSQL test connection string is required");
    }

    pool = new Pool({ connectionString });
    repository = app.get<AccessControlRepositoryPort>(ACCESS_CONTROL_REPOSITORY);
    roleManagement = app.get(RoleManagementUseCase);
  }, 120_000);

  afterAll(async () => {
    await app?.close();
    await pool?.end();
  });

  it("repairs the broken 0033 state through the migration ledger", async () => {
    const organizationRole = firstRow(
      (
        await pool.query<{ id: string }>(
          `
            SELECT id
            FROM m_roles
            WHERE organization_id IS NOT NULL
            ORDER BY created_at
            LIMIT 1
          `,
        )
      ).rows,
      "Expected a seeded organization role",
    );

    const unknownPermission = firstRow(
      (
        await pool.query<{ id: string }>(
          `
            INSERT INTO m_permissions (name, description, is_system, scope)
            VALUES ('billing.read', 'Legacy unknown permission', true, 'organization')
            ON CONFLICT (name)
            DO UPDATE SET scope = 'organization'
            RETURNING id
          `,
        )
      ).rows,
      "Unknown permission fixture was not created",
    );

    await pool.query(`UPDATE m_permissions SET scope = 'platform' WHERE name = 'users.read'`);
    await pool.query(
      `
        INSERT INTO r_role_permissions (role_id, permission_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `,
      [organizationRole.id, unknownPermission.id],
    );
    await pool.query(
      `
        DELETE FROM public.__app_migrations
        WHERE filename = '0035_repair_permission_scopes.sql'
      `,
    );

    await applySqlMigrations(pool);

    const scopeRows = await pool.query<{ name: string; scope: string }>(
      `
        SELECT name, scope
        FROM m_permissions
        WHERE name = ANY($1::text[])
      `,
      [["users.read", "billing.read"]],
    );
    const scopes = Object.fromEntries(scopeRows.rows.map(({ name, scope }) => [name, scope]));

    expect(scopes["users.read"]).toBe("organization");
    expect(scopes["billing.read"]).toBe("platform");

    const invalidGrant = firstRow(
      (
        await pool.query<{ count: number }>(
          `
            SELECT COUNT(*)::int AS count
            FROM r_role_permissions
            WHERE role_id = $1 AND permission_id = $2
          `,
          [organizationRole.id, unknownPermission.id],
        )
      ).rows,
      "Invalid grant count was not returned",
    );
    expect(invalidGrant.count).toBe(0);

    const ledger = firstRow(
      (
        await pool.query<{ exists: boolean }>(
          `
            SELECT EXISTS (
              SELECT 1
              FROM public.__app_migrations
              WHERE filename = '0035_repair_permission_scopes.sql'
            ) AS exists
          `,
        )
      ).rows,
      "Migration ledger result was not returned",
    );
    expect(ledger.exists).toBe(true);
  }, 120_000);

  it("replays seed data without duplicating roles or permissions", async () => {
    const readCounts = async () =>
      firstRow(
        (
          await pool.query<{ roles: number; permissions: number }>(
            `
              SELECT
                (SELECT COUNT(*)::int FROM m_roles) AS roles,
                (SELECT COUNT(*)::int FROM m_permissions) AS permissions
            `,
          )
        ).rows,
        "Seed counts were not returned",
      );

    const before = await readCounts();
    await seedDatabase(app);
    await seedDatabase(app);
    const after = await readCounts();

    expect(after).toEqual(before);

    const duplicateSystemRoles = await pool.query(
      `
        SELECT organization_id, LOWER(name), COUNT(*)
        FROM m_roles
        WHERE is_system = true
        GROUP BY organization_id, LOWER(name)
        HAVING COUNT(*) > 1
      `,
    );
    expect(duplicateSystemRoles.rows).toEqual([]);
  }, 120_000);

  it("enforces the complete user-role scope matrix", async () => {
    const userId = await createUser(pool, "trigger-matrix-user");
    const organizationAId = await createOrganization(pool, "Trigger Matrix Organization A");
    const organizationBId = await createOrganization(pool, "Trigger Matrix Organization B");
    const suffix = randomUUID().slice(0, 8).toUpperCase();

    try {
      const platformRole = firstRow(
        (
          await pool.query<{ id: string }>(
            `
              INSERT INTO m_roles (name, description, is_system)
              VALUES ($1, 'Trigger matrix platform role', true)
              RETURNING id
            `,
            [`TRIGGER PLATFORM ${suffix}`],
          )
        ).rows,
        "Platform role fixture was not created",
      );
      const organizationRole = firstRow(
        (
          await pool.query<{ id: string }>(
            `
              INSERT INTO m_roles (
                organization_id,
                name,
                description,
                is_system
              )
              VALUES ($1, $2, 'Trigger matrix organization role', false)
              RETURNING id
            `,
            [organizationAId, `TRIGGER ORGANIZATION ${suffix}`],
          )
        ).rows,
        "Organization role fixture was not created",
      );

      await pool.query(
        `
          INSERT INTO r_user_roles (user_id, role_id, organization_id)
          VALUES ($1, $2, NULL)
        `,
        [userId, platformRole.id],
      );
      await pool.query(
        `
          INSERT INTO r_user_roles (user_id, role_id, organization_id)
          VALUES ($1, $2, $3)
        `,
        [userId, organizationRole.id, organizationAId],
      );

      await expectPostgresError(
        pool.query(
          `
            UPDATE r_user_roles
            SET organization_id = $3
            WHERE user_id = $1 AND role_id = $2
          `,
          [userId, platformRole.id, organizationAId],
        ),
        "23503",
      );
      await expectPostgresError(
        pool.query(
          `
            UPDATE r_user_roles
            SET organization_id = NULL
            WHERE user_id = $1 AND role_id = $2
          `,
          [userId, organizationRole.id],
        ),
        "23503",
      );
      await expectPostgresError(
        pool.query(
          `
            UPDATE r_user_roles
            SET organization_id = $3
            WHERE user_id = $1 AND role_id = $2
          `,
          [userId, organizationRole.id, organizationBId],
        ),
        "23503",
      );
      await expectPostgresError(
        pool.query(
          `
            INSERT INTO r_user_roles (user_id, role_id, organization_id)
            VALUES ($1, $2, NULL)
          `,
          [userId, randomUUID()],
        ),
        "23503",
      );
    } finally {
      await pool.query(`DELETE FROM m_users WHERE id = $1`, [userId]);
      await pool.query(`DELETE FROM m_organizations WHERE id = ANY($1::uuid[])`, [
        [organizationAId, organizationBId],
      ]);
    }
  });

  it("resolves one organization system role under concurrent requests", async () => {
    const organizationId = await createOrganization(pool, "Concurrent System Role Organization");
    const userId = await createUser(pool, "concurrent-system-role-user");

    try {
      const resolvedRoles = await Promise.all(
        Array.from({ length: 10 }, () =>
          repository.ensureOrganizationSystemRole(
            "ADMIN",
            "Organization administrator role",
            organizationId,
          ),
        ),
      );

      expect(new Set(resolvedRoles.map((role: { id: string }) => role.id)).size).toBe(1);

      const roleRows = await pool.query<{ id: string }>(
        `
          SELECT id
          FROM m_roles
          WHERE organization_id = $1
            AND is_system = true
            AND UPPER(name) = 'ADMIN'
        `,
        [organizationId],
      );
      expect(roleRows.rows).toHaveLength(1);

      await roleManagement.ensureOrganizationAdminRole(organizationId, userId);

      const roleId = firstRow(roleRows.rows, "Organization ADMIN role was not created").id;
      const assignment = firstRow(
        (
          await pool.query<{ count: number }>(
            `
              SELECT COUNT(*)::int AS count
              FROM r_user_roles
              WHERE user_id = $1
                AND role_id = $2
                AND organization_id = $3
            `,
            [userId, roleId, organizationId],
          )
        ).rows,
        "ADMIN assignment count was not returned",
      );
      expect(assignment.count).toBe(1);

      const platformGrant = firstRow(
        (
          await pool.query<{ count: number }>(
            `
              SELECT COUNT(*)::int AS count
              FROM r_role_permissions rp
              JOIN m_permissions p ON p.id = rp.permission_id
              WHERE rp.role_id = $1 AND p.scope = 'platform'
            `,
            [roleId],
          )
        ).rows,
        "Platform grant count was not returned",
      );
      expect(platformGrant.count).toBe(0);
    } finally {
      await pool.query(`DELETE FROM m_users WHERE id = $1`, [userId]);
      await pool.query(`DELETE FROM m_organizations WHERE id = $1`, [organizationId]);
    }
  }, 120_000);

  it("maps concurrent same-name role creation to conflicts", async () => {
    const session = await loginAs(app, "admin@example.local", "ChangeMe123!");
    const organization = firstRow(
      (await pool.query<{ id: string }>(`SELECT id FROM m_organizations ORDER BY created_at LIMIT 1`))
        .rows,
      "Expected a seeded organization",
    );
    const permission = firstRow(
      (
        await pool.query<{ id: string }>(
          `
            SELECT id
            FROM m_permissions
            WHERE scope = 'organization'
            ORDER BY name
            LIMIT 1
          `,
        )
      ).rows,
      "Expected an organization permission",
    );
    const roleName = `CONCURRENT CREATE ${randomUUID().slice(0, 8)}`;

    const responses = await Promise.all(
      Array.from({ length: 10 }, () =>
        request(app.getHttpServer())
          .post("/api/v1/admin/roles")
          .set(bearer(session.accessToken))
          .send({
            name: roleName,
            organizationId: organization.id,
            permissionIds: [permission.id],
          }),
      ),
    );

    try {
      const statuses = responses.map(({ status }) => status);
      expect(statuses.filter((status) => status === 201)).toHaveLength(1);
      expect(statuses.filter((status) => status === 409)).toHaveLength(9);

      for (const response of responses.filter(({ status }) => status === 409)) {
        expect((response.body as ErrorResponse).error.code).toBe("RESOURCE_CONFLICT");
      }

      const roleCount = firstRow(
        (
          await pool.query<{ count: number }>(
            `
              SELECT COUNT(*)::int AS count
              FROM m_roles
              WHERE organization_id = $1 AND LOWER(name) = LOWER($2)
            `,
            [organization.id, roleName],
          )
        ).rows,
        "Concurrent role count was not returned",
      );
      expect(roleCount.count).toBe(1);
    } finally {
      await pool.query(`DELETE FROM m_roles WHERE organization_id = $1 AND LOWER(name) = LOWER($2)`, [
        organization.id,
        roleName,
      ]);
    }
  }, 120_000);

  it("maps a concurrent same-target rename to one conflict", async () => {
    const session = await loginAs(app, "admin@example.local", "ChangeMe123!");
    const organization = firstRow(
      (await pool.query<{ id: string }>(`SELECT id FROM m_organizations ORDER BY created_at LIMIT 1`))
        .rows,
      "Expected a seeded organization",
    );
    const permission = firstRow(
      (
        await pool.query<{ id: string }>(
          `
            SELECT id
            FROM m_permissions
            WHERE scope = 'organization'
            ORDER BY name
            LIMIT 1
          `,
        )
      ).rows,
      "Expected an organization permission",
    );
    const suffix = randomUUID().slice(0, 8).toUpperCase();

    const createRole = async (name: string): Promise<string> => {
      const response = await request(app.getHttpServer())
        .post("/api/v1/admin/roles")
        .set(bearer(session.accessToken))
        .send({
          name,
          organizationId: organization.id,
          permissionIds: [permission.id],
        })
        .expect(201);

      return (response.body as { data: RoleDto }).data.id;
    };

    const firstRoleId = await createRole(`RENAME SOURCE A ${suffix}`);
    const secondRoleId = await createRole(`RENAME SOURCE B ${suffix}`);
    const targetName = `RENAME TARGET ${suffix}`;

    try {
      const responses = await Promise.all([
        request(app.getHttpServer())
          .patch(`/api/v1/admin/roles/${firstRoleId}`)
          .set(bearer(session.accessToken))
          .send({ name: targetName }),
        request(app.getHttpServer())
          .patch(`/api/v1/admin/roles/${secondRoleId}`)
          .set(bearer(session.accessToken))
          .send({ name: targetName }),
      ]);

      expect(responses.map(({ status }) => status).sort()).toEqual([200, 409]);
      const conflict = responses.find(({ status }) => status === 409);
      expect((conflict?.body as ErrorResponse).error.code).toBe("RESOURCE_CONFLICT");
    } finally {
      await pool.query(`DELETE FROM m_roles WHERE id = ANY($1::uuid[])`, [
        [firstRoleId, secondRoleId],
      ]);
    }
  }, 120_000);

  it("paginates and filters more than fifty roles without overlap", async () => {
    const session = await loginAs(app, "admin@example.local", "ChangeMe123!");
    const organization = firstRow(
      (await pool.query<{ id: string }>(`SELECT id FROM m_organizations ORDER BY created_at LIMIT 1`))
        .rows,
      "Expected a seeded organization",
    );
    const prefix = `PAGINATION ${randomUUID().slice(0, 8).toUpperCase()}`;

    await pool.query(
      `
        INSERT INTO m_roles (organization_id, name, description, is_system)
        SELECT
          $1,
          $2 || ' ' || LPAD(sequence::text, 3, '0'),
          'Pagination integration fixture',
          false
        FROM generate_series(1, 60) AS sequence
      `,
      [organization.id, prefix],
    );

    try {
      const listPage = async (page: number) => {
        const response = await request(app.getHttpServer())
          .get("/api/v1/admin/roles")
          .set(bearer(session.accessToken))
          .query({
            page,
            limit: 50,
            organizationId: organization.id,
            search: prefix,
            scope: "organization",
          })
          .expect(200);

        return response.body as PaginatedRolesResponse;
      };

      const pageOne = await listPage(1);
      const pageTwo = await listPage(2);

      expect(pageOne.data).toHaveLength(50);
      expect(pageTwo.data).toHaveLength(10);
      expect(pageOne.meta.total).toBe(60);
      expect(pageOne.meta.totalPages).toBe(2);

      const pageOneIds = new Set(pageOne.data.map(({ id }) => id));
      expect(pageTwo.data.some(({ id }) => pageOneIds.has(id))).toBe(false);

      const searchResponse = await request(app.getHttpServer())
        .get("/api/v1/admin/roles")
        .set(bearer(session.accessToken))
        .query({
          organizationId: organization.id,
          search: `${prefix} 060`,
          scope: "organization",
        })
        .expect(200);
      expect((searchResponse.body as PaginatedRolesResponse).data).toHaveLength(1);
    } finally {
      await pool.query(`DELETE FROM m_roles WHERE organization_id = $1 AND name LIKE $2`, [
        organization.id,
        `${prefix}%`,
      ]);
    }
  }, 120_000);

  it("rejects a cross-tenant organization filter for an org ADMIN", async () => {
    const superAdminSession = await loginAs(app, "admin@example.local", "ChangeMe123!");
    const regularUserSession = await loginAs(app, "user@example.local", "ChangeMe123!");
    const superAdminMe = await request(app.getHttpServer())
      .get("/api/v1/auth/me")
      .set(bearer(superAdminSession.accessToken))
      .expect(200);
    const regularUserMe = await request(app.getHttpServer())
      .get("/api/v1/auth/me")
      .set(bearer(regularUserSession.accessToken))
      .expect(200);

    const organizationAId = (superAdminMe.body as { data: AuthMeDto }).data.organizationId;
    const organizationBId = (regularUserMe.body as { data: AuthMeDto }).data.organizationId;

    const rolesResponse = await request(app.getHttpServer())
      .get("/api/v1/admin/roles")
      .set(bearer(superAdminSession.accessToken))
      .expect(200);
    const platformAdminRole = (rolesResponse.body as PaginatedRolesResponse).data.find(
      ({ name, organizationId }) => name === "ADMIN" && organizationId === null,
    );
    if (!platformAdminRole) {
      throw new Error("Platform ADMIN role was not found");
    }

    const suffix = randomUUID().slice(0, 8);
    const email = `role-list-admin-${suffix}@example.local`;
    const initialPassword = "OrgAdminPass123!";
    const changedPassword = "NewPassword123!";

    const createdUserResponse = await request(app.getHttpServer())
      .post("/api/v1/admin/users")
      .set(bearer(superAdminSession.accessToken))
      .send({
        email,
        password: initialPassword,
        displayName: "Role List Organization Admin",
        status: "ACTIVE",
        roleId: platformAdminRole.id,
        organizationId: organizationAId,
      })
      .expect(201);
    const createdUser = (createdUserResponse.body as { data: CreatedUserDto }).data;

    try {
      const initialSession = await loginAs(app, email, initialPassword);
      await request(app.getHttpServer())
        .patch("/api/v1/users/me/password")
        .set(bearer(initialSession.accessToken))
        .send({
          currentPassword: initialPassword,
          newPassword: changedPassword,
        })
        .expect(200);

      const organizationAdminSession = await loginAs(app, email, changedPassword);

      const ownScope = await request(app.getHttpServer())
        .get("/api/v1/admin/roles")
        .set(bearer(organizationAdminSession.accessToken))
        .set("x-organization-id", organizationAId)
        .expect(200);
      const ownScopeBody = ownScope.body as PaginatedRolesResponse;
      expect(
        ownScopeBody.data.every(
          ({ organizationId }) => organizationId === null || organizationId === organizationAId,
        ),
      ).toBe(true);

      const forbidden = await request(app.getHttpServer())
        .get("/api/v1/admin/roles")
        .set(bearer(organizationAdminSession.accessToken))
        .set("x-organization-id", organizationAId)
        .query({ organizationId: organizationBId })
        .expect(403);
      expect((forbidden.body as ErrorResponse).error.code).toBe("AUTH_FORBIDDEN");
      expect(createdUser.roles).toContain("ADMIN");
    } finally {
      await pool.query(`DELETE FROM m_users WHERE id = $1`, [createdUser.id]);
    }
  }, 120_000);
});
