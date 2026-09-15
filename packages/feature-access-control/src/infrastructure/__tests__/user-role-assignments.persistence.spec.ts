import type { SQL } from "drizzle-orm";

import { getTableName } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it, vi } from "vitest";

import { roles, userRoles } from "../persistence";
import { UserRoleAssignmentsPersistence } from "../user-role-assignments.persistence";

const dialect = new PgDialect();
const USER_ROLES_TABLE = getTableName(userRoles);
const ROLES_TABLE = getTableName(roles);

const render = (clause: SQL) => dialect.sqlToQuery(clause);

/**
 * Read-chain stand-in for the joined `select().from().innerJoin()...where()`
 * shape every method here uses. The join is recorded so a test can assert the
 * role row (not just the assignment row) is what the tenant filter reaches.
 */
function createReadExecutor(rows: unknown[] = []) {
  const where = vi.fn<(clause: SQL) => Promise<unknown[]>>(async () => rows);
  // Built in two steps: a single literal here would make the chain reference
  // itself in its own initializer.
  const chain: Record<string, unknown> = { where };
  const from = vi.fn(() => chain);
  const innerJoin = vi.fn((table: unknown, condition: SQL) => chain);
  chain.from = from;
  chain.innerJoin = innerJoin;
  const select = vi.fn(() => chain);

  return { select, from, innerJoin, where };
}

/** Captures `delete().where()`, `insert().values().onConflictDoNothing()` and `update().set().where()`. */
function createWriteExecutor(options: { selectRows?: unknown[] } = {}) {
  const { selectRows = [] } = options;

  const insertReturning = vi.fn(async () => []);
  const onConflictDoNothing = vi.fn(() => ({ returning: insertReturning }));
  const insertValues = vi.fn<
    (values: unknown) => { onConflictDoNothing: typeof onConflictDoNothing }
  >(() => ({ onConflictDoNothing }));
  const insert = vi.fn(() => ({ values: insertValues }));

  const deleteWhere = vi.fn<(clause: SQL) => Promise<void>>(async () => undefined);
  const del = vi.fn(() => ({ where: deleteWhere }));

  const where = vi.fn<(clause: SQL) => Promise<unknown[]>>(async () => selectRows);
  const select = vi.fn(() => ({ from: vi.fn(() => ({ where })) }));

  const updateWhere = vi.fn<(clause: SQL) => Promise<void>>(async () => undefined);
  const set = vi.fn(() => ({ where: updateWhere }));
  const update = vi.fn(() => ({ set }));

  return {
    client: { insert, delete: del, select, update },
    insert,
    insertValues,
    onConflictDoNothing,
    delete: del,
    deleteWhere,
    select,
    where,
    update,
    set,
    updateWhere,
  };
}

describe("UserRoleAssignmentsPersistence tenant scoping", () => {
  it("scopes role names to platform rows for a null organization", async () => {
    const executor = createReadExecutor([]);
    const persistence = new UserRoleAssignmentsPersistence({} as never);

    await persistence.findRoleNamesForUser("user-1", null, executor as never);

    const { sql: rendered } = render(executor.where.mock.calls[0]![0]);
    // Both the assignment and the role row must be platform-scoped.
    expect(rendered).toContain(`"${USER_ROLES_TABLE}"."organization_id" is null`);
    expect(rendered).toContain(`"${ROLES_TABLE}"."organization_id" is null`);
  });

  it("accepts platform rows plus the caller's own organization rows", async () => {
    const executor = createReadExecutor([]);
    const persistence = new UserRoleAssignmentsPersistence({} as never);

    await persistence.findRoleNamesForUser("user-1", "org-1", executor as never);

    const { sql: rendered, params } = render(executor.where.mock.calls[0]![0]);
    expect(rendered).toContain(`"${USER_ROLES_TABLE}"."organization_id" is null`);
    expect(rendered).toContain(`"${USER_ROLES_TABLE}"."organization_id" = $`);
    expect(rendered).toContain(`"${ROLES_TABLE}"."organization_id" = $`);
    expect(params).toContain("org-1");
  });

  it("drops role assignments whose organization was soft-deleted", async () => {
    const executor = createReadExecutor([]);
    const persistence = new UserRoleAssignmentsPersistence({} as never);

    await persistence.findRoleNamesForUser("user-1", "org-1", executor as never);

    const { sql: rendered } = render(executor.where.mock.calls[0]![0]);
    // A deleted organization must not keep granting roles (T-00x).
    expect(rendered).toContain("exists (select 1 from m_organizations o");
    expect(rendered).toContain("o.deleted_at is null");
  });

  it("applies the same deleted-organization guard to permission names", async () => {
    const executor = createReadExecutor([]);
    const persistence = new UserRoleAssignmentsPersistence({} as never);

    await persistence.findPermissionNamesForUser("user-1", "org-1", executor as never);

    const { sql: rendered } = render(executor.where.mock.calls[0]![0]);
    expect(rendered).toContain("o.deleted_at is null");
    expect(rendered).toContain(`"${ROLES_TABLE}"."organization_id" is null`);
  });

  it("joins through roles when resolving role ids for a user", async () => {
    const executor = createReadExecutor([{ roleId: "role-1" }]);
    const persistence = new UserRoleAssignmentsPersistence({} as never);

    await expect(
      persistence.findRoleIdsForUser("user-1", "org-1", executor as never),
    ).resolves.toEqual(["role-1"]);

    expect(executor.innerJoin).toHaveBeenCalledTimes(1);
    const { sql: rendered } = render(executor.where.mock.calls[0]![0]);
    expect(rendered).toContain(`"${USER_ROLES_TABLE}"."user_id" = $1`);
  });

  it("keeps only platform-scoped assignments in platform scope", async () => {
    const executor = createReadExecutor([]);
    const persistence = new UserRoleAssignmentsPersistence({} as never);

    await persistence.findRoleIdsForUser("user-1", null, executor as never);

    const { sql: rendered } = render(executor.where.mock.calls[0]![0]);
    expect(rendered).toContain(`"${USER_ROLES_TABLE}"."organization_id" is null`);
    expect(rendered).not.toContain(`"${USER_ROLES_TABLE}"."organization_id" = `);
  });

  it("short-circuits empty user id lists on every batch lookup", async () => {
    const select = vi.fn();
    const persistence = new UserRoleAssignmentsPersistence({} as never);

    await expect(
      persistence.findRoleNamesForUsers([], "org-1", { select } as never),
    ).resolves.toEqual([]);
    await expect(
      persistence.findRoleIdsForUsers([], "org-1", { select } as never),
    ).resolves.toEqual([]);
    expect(select).not.toHaveBeenCalled();
  });
});

describe("UserRoleAssignmentsPersistence.replaceUserRoles", () => {
  it("clears only platform-scoped assignments when the target scope is platform", async () => {
    const executor = createWriteExecutor();
    const persistence = new UserRoleAssignmentsPersistence({} as never);

    await persistence.replaceUserRoles("user-1", [], null, executor.client as never);

    const { sql: rendered, params } = render(executor.deleteWhere.mock.calls[0]![0]);
    expect(rendered).toContain(`"${USER_ROLES_TABLE}"."user_id" = $1`);
    expect(rendered).toContain(`"${USER_ROLES_TABLE}"."organization_id" is null`);
    expect(params).toEqual(["user-1"]);
  });

  it("clears only the target organization's assignments", async () => {
    const executor = createWriteExecutor();
    const persistence = new UserRoleAssignmentsPersistence({} as never);

    await persistence.replaceUserRoles("user-1", [], "org-1", executor.client as never);

    const { sql: rendered, params } = render(executor.deleteWhere.mock.calls[0]![0]);
    // A replace in one tenant must never clear another tenant's rows.
    expect(rendered).toContain(`"${USER_ROLES_TABLE}"."organization_id" = $2`);
    expect(params).toEqual(["user-1", "org-1"]);
  });

  it("drops role ids that belong to a different organization", async () => {
    const executor = createWriteExecutor({
      selectRows: [
        { id: "role-platform", organizationId: null },
        { id: "role-own", organizationId: "org-1" },
        { id: "role-foreign", organizationId: "org-2" },
      ],
    });
    const persistence = new UserRoleAssignmentsPersistence({} as never);

    await persistence.replaceUserRoles(
      "user-1",
      ["role-platform", "role-own", "role-foreign"],
      "org-1",
      executor.client as never,
    );

    const [inserted] = executor.insertValues.mock.calls[0]!;
    // Cross-tenant escalation is blocked at the persistence boundary.
    expect(inserted).toEqual([
      { userId: "user-1", roleId: "role-platform", organizationId: null },
      { userId: "user-1", roleId: "role-own", organizationId: "org-1" },
    ]);
  });

  it("does not emit an insert when every requested role was filtered out", async () => {
    const executor = createWriteExecutor({
      selectRows: [{ id: "role-foreign", organizationId: "org-2" }],
    });
    const persistence = new UserRoleAssignmentsPersistence({} as never);

    await persistence.replaceUserRoles(
      "user-1",
      ["role-foreign"],
      "org-1",
      executor.client as never,
    );

    // The delete already ran, so the replace still takes effect. But an empty
    // resolved set must not reach the driver: Drizzle renders
    // `insert into ... values ` (no tuples) for an empty array, which Postgres
    // rejects as a syntax error — a 500 where the cross-tenant filter should
    // have been a no-op.
    expect(executor.deleteWhere).toHaveBeenCalledTimes(1);
    expect(executor.insert).not.toHaveBeenCalled();
  });

  it("never binds an empty row set to the insert", async () => {
    const executor = createWriteExecutor({
      selectRows: [{ id: "role-foreign", organizationId: "org-2" }],
    });
    const persistence = new UserRoleAssignmentsPersistence({} as never);

    await persistence.replaceUserRoles(
      "user-1",
      ["role-foreign"],
      "org-1",
      executor.client as never,
    );

    for (const [values] of executor.insertValues.mock.calls) {
      expect(Array.isArray(values) ? values.length : 1).toBeGreaterThan(0);
    }
  });

  it("skips the role lookup entirely for an empty role list", async () => {
    const executor = createWriteExecutor();
    const persistence = new UserRoleAssignmentsPersistence({} as never);

    await persistence.replaceUserRoles("user-1", [], "org-1", executor.client as never);

    expect(executor.insert).not.toHaveBeenCalled();
    expect(executor.select).not.toHaveBeenCalled();
  });
});

describe("UserRoleAssignmentsPersistence assignment writes", () => {
  it("assigns a role idempotently", async () => {
    const executor = createWriteExecutor();
    const persistence = new UserRoleAssignmentsPersistence({} as never);

    await persistence.assignUserRole("user-1", "role-1", "org-1", executor.client as never);

    expect(executor.insertValues).toHaveBeenCalledWith({
      userId: "user-1",
      roleId: "role-1",
      organizationId: "org-1",
    });
    expect(executor.onConflictDoNothing).toHaveBeenCalled();
  });

  it("deduplicates users reached through a permission", async () => {
    const executor = createReadExecutor([{ userId: "user-1" }, { userId: "user-1" }]);
    const persistence = new UserRoleAssignmentsPersistence({} as never);

    await expect(
      persistence.findUserIdsForPermission("perm-1", executor as never),
    ).resolves.toEqual(["user-1"]);
  });

  it("purges only the organization's assignments", async () => {
    const executor = createWriteExecutor();
    const persistence = new UserRoleAssignmentsPersistence({} as never);

    await persistence.deleteByOrganizationId("org-1", executor.client as never);

    const { params } = render(executor.deleteWhere.mock.calls[0]![0]);
    expect(params).toEqual(["org-1"]);
  });
});

describe("UserRoleAssignmentsPersistence primary-read routing", () => {
  it("reads authorization data from the primary client of a replica-aware database", async () => {
    const primary = createReadExecutor([{ roleName: "ADMIN" }]);
    const replica = createReadExecutor([]);
    const database = { $primary: { select: primary.select }, select: replica.select };
    const persistence = new UserRoleAssignmentsPersistence(database as never);

    await expect(persistence.findRoleNamesForUser("user-1", "org-1")).resolves.toEqual(["ADMIN"]);

    expect(primary.where).toHaveBeenCalledTimes(1);
    expect(replica.where).not.toHaveBeenCalled();
  });
});
