import type { INestApplication } from '@nestjs/common';

import { randomUUID } from 'node:crypto';
import { RoleManagementUseCase } from '@repo/api-identity/modules/access-control/application/use-cases/role-management.use-case';
import { seedDatabase } from '@repo/api-seed';
import { Pool } from 'pg';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { applySqlMigrations } from '../src/cli/migrations';
import {
  bearer,
  createTestApp,
  loginAs,
  resetTestDatabase,
} from './support/test-app';

const requireFirstRow = <T>(rows: T[], message: string): T => {
  const row = rows[0];
  if (!row) {
    throw new Error(message);
  }
  return row;
};

const expectPostgresError = async (
  operation: Promise<unknown>,
  code: string,
): Promise<void> => {
  await expect(operation).rejects.toMatchObject({ code });
};

const createTestUser = async (pool: Pool, label: string): Promise<string> => {
  const suffix = randomUUID();
  const result = await pool.query<{ id: string }>(
    `
      INSERT INTO users (email, password_hash, display_name, status)
      VALUES ($1, $2, $3, 'ACTIVE')
      RETURNING id
    `,
    [`${label}-${suffix}@example.local`, 'not-used', label],
  );

  return requireFirstRow(result.rows, 'Test user was not created').id;
};

const createTestOrganization = async (
  pool: Pool,
  label: string,
): Promise<string> => {
  const suffix = randomUUID();
  const result = await pool.query<{ id: string }>(
    `
      INSERT INTO organizations (name, slug)
      VALUES ($1, $2)
      RETURNING id
    `,
    [label, `${label.toLowerCase().replaceAll(' ', '-')}-${suffix}`],
  );

  return requireFirstRow(result.rows, 'Test organization was not created').id;
};

describe('Roles migration and provisioning (e2e)', () => {
  let app: INestApplication;
  let adminPool: Pool;
  let roleManagement: RoleManagementUseCase;

  beforeAll(async () => {
    await resetTestDatabase();
    adminPool = new Pool({
      connectionString: process.env.DATABASE_URL_TEST_ADMIN,
    });
    app = await createTestApp();
    roleManagement = app.get(RoleManagementUseCase);
  }, 120_000);

  afterAll(async () => {
    await app?.close();
    await adminPool?.end();
  });

  it('repairs a broken 0033 upgrade and fails closed for unknown permissions', async () => {
    const organizationRole = requireFirstRow(
      (
        await adminPool.query<{ id: string }>(
          `SELECT id FROM roles WHERE organization_id IS NOT NULL LIMIT 1`,
        )
      ).rows,
      'Expected a seeded organization role',
    );

    const unknownPermission = requireFirstRow(
      (
        await adminPool.query<{ id: string }>(
          `
            INSERT INTO permissions (name, description, is_system, scope)
            VALUES ('billing.read', 'Legacy unknown permission', true, 'organization')
            ON CONFLICT (name)
            DO UPDATE SET scope = 'organization'
            RETURNING id
          `,
        )
      ).rows,
      'Unknown permission fixture was not created',
    );

    await adminPool.query(
      `UPDATE permissions SET scope = 'platform' WHERE name = 'users.read'`,
    );
    await adminPool.query(
      `
        INSERT INTO role_permissions (role_id, permission_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `,
      [organizationRole.id, unknownPermission.id],
    );
    await adminPool.query(
      `DELETE FROM public.__app_migrations WHERE filename = '0035_repair_permission_scopes.sql'`,
    );

    await applySqlMigrations(adminPool);

    const scopeRows = await adminPool.query<{
      name: string;
      scope: string;
    }>(
      `
        SELECT name, scope
        FROM permissions
        WHERE name = ANY($1::text[])
      `,
      [['users.read', 'billing.read']],
    );
    const scopes = Object.fromEntries(
      scopeRows.rows.map(({ name, scope }) => [name, scope]),
    );

    expect(scopes['users.read']).toBe('organization');
    expect(scopes['billing.read']).toBe('platform');

    const invalidGrantCount = requireFirstRow(
      (
        await adminPool.query<{ count: number }>(
          `
            SELECT COUNT(*)::int AS count
            FROM role_permissions
            WHERE role_id = $1 AND permission_id = $2
          `,
          [organizationRole.id, unknownPermission.id],
        )
      ).rows,
      'Invalid grant count was not returned',
    );
    expect(invalidGrantCount.count).toBe(0);

    const ledgerEntry = requireFirstRow(
      (
        await adminPool.query<{ exists: boolean }>(
          `
            SELECT EXISTS (
              SELECT 1
              FROM public.__app_migrations
              WHERE filename = '0035_repair_permission_scopes.sql'
            ) AS exists
          `,
        )
      ).rows,
      'Migration ledger state was not returned',
    );
    expect(ledgerEntry.exists).toBe(true);
  }, 120_000);

  it('replays access-control seed data without duplicating roles or permissions', async () => {
    await seedDatabase(app);
    const afterFirstSeed = requireFirstRow(
      (
        await adminPool.query<{ roles: number; permissions: number }>(
          `
            SELECT
              (SELECT COUNT(*)::int FROM roles) AS roles,
              (SELECT COUNT(*)::int FROM permissions) AS permissions
          `,
        )
      ).rows,
      'Seed counts were not returned',
    );

    await seedDatabase(app);
    const afterSecondSeed = requireFirstRow(
      (
        await adminPool.query<{ roles: number; permissions: number }>(
          `
            SELECT
              (SELECT COUNT(*)::int FROM roles) AS roles,
              (SELECT COUNT(*)::int FROM permissions) AS permissions
          `,
        )
      ).rows,
      'Seed counts were not returned',
    );

    expect(afterSecondSeed).toEqual(afterFirstSeed);

    const duplicateSystemRoles = await adminPool.query(
      `
        SELECT organization_id, LOWER(name), COUNT(*)
        FROM roles
        WHERE is_system = true
        GROUP BY organization_id, LOWER(name)
        HAVING COUNT(*) > 1
      `,
    );
    expect(duplicateSystemRoles.rows).toEqual([]);
  }, 120_000);

  it('enforces the complete user-role scope matrix', async () => {
    const userId = await createTestUser(adminPool, 'Trigger Matrix User');
    const organizationAId = await createTestOrganization(
      adminPool,
      'Trigger Matrix A',
    );
    const organizationBId = await createTestOrganization(
      adminPool,
      'Trigger Matrix B',
    );

    try {
      const platformRole = requireFirstRow(
        (
          await adminPool.query<{ id: string }>(
            `
              SELECT id
              FROM roles
              WHERE organization_id IS NULL AND name = 'USER'
              LIMIT 1
            `,
          )
        ).rows,
        'Expected the platform USER role',
      );
      const organizationRole = requireFirstRow(
        (
          await adminPool.query<{ id: string }>(
            `
              INSERT INTO roles (organization_id, name, description, is_system)
              VALUES ($1, 'TRIGGER TEST ROLE', 'Trigger matrix role', false)
              RETURNING id
            `,
            [organizationAId],
          )
        ).rows,
        'Organization role fixture was not created',
      );

      await adminPool.query(
        `
          INSERT INTO user_roles (user_id, role_id, organization_id)
          VALUES ($1, $2, NULL)
        `,
        [userId, platformRole.id],
      );
      await adminPool.query(
        `
          INSERT INTO user_roles (user_id, role_id, organization_id)
          VALUES ($1, $2, $3)
        `,
        [userId, organizationRole.id, organizationAId],
      );

      await expectPostgresError(
        adminPool.query(
          `
            UPDATE user_roles
            SET organization_id = $3
            WHERE user_id = $1 AND role_id = $2
          `,
          [userId, platformRole.id, organizationAId],
        ),
        '23503',
      );
      await expectPostgresError(
        adminPool.query(
          `
            UPDATE user_roles
            SET organization_id = NULL
            WHERE user_id = $1 AND role_id = $2
          `,
          [userId, organizationRole.id],
        ),
        '23503',
      );
      await expectPostgresError(
        adminPool.query(
          `
            UPDATE user_roles
            SET organization_id = $3
            WHERE user_id = $1 AND role_id = $2
          `,
          [userId, organizationRole.id, organizationBId],
        ),
        '23503',
      );
      await expectPostgresError(
        adminPool.query(
          `
            INSERT INTO user_roles (user_id, role_id, organization_id)
            VALUES ($1, $2, NULL)
          `,
          [userId, randomUUID()],
        ),
        '23503',
      );
    } finally {
      await adminPool.query(`DELETE FROM users WHERE id = $1`, [userId]);
      await adminPool.query(`DELETE FROM organizations WHERE id = ANY($1::uuid[])`, [
        [organizationAId, organizationBId],
      ]);
    }
  });

  it('provisions one organization ADMIN role under concurrent requests', async () => {
    const userId = await createTestUser(adminPool, 'Concurrent Admin User');
    const organizationId = await createTestOrganization(
      adminPool,
      'Concurrent Admin Organization',
    );

    try {
      await Promise.all(
        Array.from({ length: 10 }, () =>
          roleManagement.ensureOrganizationAdminRole(organizationId, userId),
        ),
      );

      const organizationRoles = await adminPool.query<{ id: string }>(
        `
          SELECT id
          FROM roles
          WHERE organization_id = $1
            AND is_system = true
            AND UPPER(name) = 'ADMIN'
        `,
        [organizationId],
      );
      expect(organizationRoles.rows).toHaveLength(1);

      const roleId = requireFirstRow(
        organizationRoles.rows,
        'Organization ADMIN role was not created',
      ).id;
      const assignment = requireFirstRow(
        (
          await adminPool.query<{ count: number }>(
            `
              SELECT COUNT(*)::int AS count
              FROM user_roles
              WHERE user_id = $1
                AND role_id = $2
                AND organization_id = $3
            `,
            [userId, roleId, organizationId],
          )
        ).rows,
        'Organization ADMIN assignment count was not returned',
      );
      expect(assignment.count).toBe(1);

      const platformGrant = requireFirstRow(
        (
          await adminPool.query<{ count: number }>(
            `
              SELECT COUNT(*)::int AS count
              FROM role_permissions rp
              JOIN permissions p ON p.id = rp.permission_id
              WHERE rp.role_id = $1 AND p.scope = 'platform'
            `,
            [roleId],
          )
        ).rows,
        'Platform grant count was not returned',
      );
      expect(platformGrant.count).toBe(0);
    } finally {
      await adminPool.query(`DELETE FROM users WHERE id = $1`, [userId]);
      await adminPool.query(`DELETE FROM organizations WHERE id = $1`, [
        organizationId,
      ]);
    }
  }, 120_000);

  it('maps a concurrent same-name role rename to one success and one conflict', async () => {
    const token = await loginAs(
      app,
      'admin@example.local',
      'ChangeMe123!',
    );
    const organization = requireFirstRow(
      (
        await adminPool.query<{ id: string }>(
          `SELECT id FROM organizations ORDER BY created_at LIMIT 1`,
        )
      ).rows,
      'Expected a seeded organization',
    );
    const permission = requireFirstRow(
      (
        await adminPool.query<{ id: string }>(
          `
            SELECT id
            FROM permissions
            WHERE scope = 'organization'
            ORDER BY name
            LIMIT 1
          `,
        )
      ).rows,
      'Expected an organization permission',
    );
    const suffix = randomUUID().slice(0, 8).toUpperCase();

    const createRole = async (name: string): Promise<string> => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/admin/roles')
        .set(bearer(token.accessToken))
        .send({
          name,
          organizationId: organization.id,
          permissionIds: [permission.id],
        })
        .expect(201);

      return response.body.data.id as string;
    };

    const firstRoleId = await createRole(`RENAME SOURCE A ${suffix}`);
    const secondRoleId = await createRole(`RENAME SOURCE B ${suffix}`);
    const targetName = `RENAME TARGET ${suffix}`;

    try {
      const responses = await Promise.all([
        request(app.getHttpServer())
          .patch(`/api/v1/admin/roles/${firstRoleId}`)
          .set(bearer(token.accessToken))
          .send({ name: targetName }),
        request(app.getHttpServer())
          .patch(`/api/v1/admin/roles/${secondRoleId}`)
          .set(bearer(token.accessToken))
          .send({ name: targetName }),
      ]);

      expect(responses.map(({ status }) => status).sort()).toEqual([200, 409]);
      const conflict = responses.find(({ status }) => status === 409);
      expect(conflict?.body.error.code).toBe('RESOURCE_CONFLICT');

      const targetCount = requireFirstRow(
        (
          await adminPool.query<{ count: number }>(
            `
              SELECT COUNT(*)::int AS count
              FROM roles
              WHERE organization_id = $1 AND LOWER(name) = LOWER($2)
            `,
            [organization.id, targetName],
          )
        ).rows,
        'Target role count was not returned',
      );
      expect(targetCount.count).toBe(1);
    } finally {
      await adminPool.query(`DELETE FROM roles WHERE id = ANY($1::uuid[])`, [
        [firstRoleId, secondRoleId],
      ]);
    }
  }, 120_000);

  it('paginates and filters more than fifty roles without page overlap', async () => {
    const token = await loginAs(
      app,
      'admin@example.local',
      'ChangeMe123!',
    );
    const organization = requireFirstRow(
      (
        await adminPool.query<{ id: string }>(
          `SELECT id FROM organizations ORDER BY created_at LIMIT 1`,
        )
      ).rows,
      'Expected a seeded organization',
    );
    const prefix = `PAGINATION ${randomUUID().slice(0, 8).toUpperCase()}`;

    await adminPool.query(
      `
        INSERT INTO roles (organization_id, name, description, is_system)
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
      const pageOne = await request(app.getHttpServer())
        .get('/api/v1/admin/roles')
        .set(bearer(token.accessToken))
        .query({
          page: 1,
          limit: 50,
          organizationId: organization.id,
          search: prefix,
          scope: 'organization',
        })
        .expect(200);
      const pageTwo = await request(app.getHttpServer())
        .get('/api/v1/admin/roles')
        .set(bearer(token.accessToken))
        .query({
          page: 2,
          limit: 50,
          organizationId: organization.id,
          search: prefix,
          scope: 'organization',
        })
        .expect(200);

      expect(pageOne.body.data).toHaveLength(50);
      expect(pageTwo.body.data).toHaveLength(10);
      expect(pageOne.body.meta.total).toBe(60);
      expect(pageOne.body.meta.totalPages).toBe(2);

      const firstPageIds = new Set<string>(
        pageOne.body.data.map((role: { id: string }) => role.id),
      );
      expect(
        pageTwo.body.data.some((role: { id: string }) =>
          firstPageIds.has(role.id),
        ),
      ).toBe(false);

      const platformScope = await request(app.getHttpServer())
        .get('/api/v1/admin/roles')
        .set(bearer(token.accessToken))
        .query({
          page: 1,
          limit: 50,
          organizationId: organization.id,
          search: prefix,
          scope: 'platform',
        })
        .expect(200);
      expect(platformScope.body.meta.total).toBe(0);
    } finally {
      await adminPool.query(
        `DELETE FROM roles WHERE organization_id = $1 AND name LIKE $2`,
        [organization.id, `${prefix}%`],
      );
    }
  }, 120_000);
});
