import type { SQL } from "drizzle-orm";

import { getTableName } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it, vi } from "vitest";

import { ROLE_NAMES } from "../../public/role.constants";
import { roles } from "../persistence";
import { AccessControlRolePersistence } from "../access-control-role.persistence";

const dialect = new PgDialect();
const ROLES_TABLE = getTableName(roles);

const render = (clause: SQL) => dialect.sqlToQuery(clause);

const thenable = <T extends object>(rows: unknown[], extra: T) =>
  Object.assign(Promise.resolve(rows), extra);

const isCountProjection = (projection: unknown) =>
  typeof projection === "object" && projection !== null && "total" in projection;

/**
 * Read-chain stand-in. `where()` resolves on its own and carries
 * `.orderBy()/.limit()`; `orderBy()` is awaitable and carries `.limit()`
 * because `findAllRoles` returns the chain directly.
 */
function createReadExecutor(rows: unknown[] = [], total = rows.length) {
  const offset = vi.fn<(count: number) => Promise<unknown[]>>(async () => rows);
  const limit = vi.fn<(count: number) => Promise<unknown[]> & { offset: typeof offset }>(() =>
    thenable(rows, { offset }),
  );
  const orderBy = vi.fn<(...clauses: unknown[]) => Promise<unknown[]> & { limit: typeof limit }>(
    () => thenable(rows, { limit }),
  );
  const forUpdate = vi.fn(() => ({ limit }));
  const where = vi.fn<
    (clause: SQL) => Promise<unknown[]> & {
      orderBy: typeof orderBy;
      limit: typeof limit;
      for: typeof forUpdate;
    }
  >(() => thenable(rows, { orderBy, limit, for: forUpdate }));
  const from = vi.fn(() => ({ where }));
  const countWhere = vi.fn<(clause: SQL) => Promise<Array<{ total: number }>>>(async () => [
    { total },
  ]);
  const countFrom = vi.fn(() => ({ where: countWhere }));

  const select = vi.fn((projection?: unknown) =>
    isCountProjection(projection) ? { from: countFrom } : { from },
  );

  return { select, where, countWhere, orderBy, limit, offset, forUpdate };
}

/** Captures `insert().values()...` and `update().set().where().returning()`. */
function createWriteExecutor(options: { insertRows?: unknown[]; updateRows?: unknown[] } = {}) {
  const { insertRows = [], updateRows = [] } = options;

  const insertReturning = vi.fn(async () => insertRows);
  const onConflictDoNothing = vi.fn(() => ({ returning: insertReturning }));
  const onConflictDoUpdate = vi.fn(() => ({ returning: insertReturning }));
  const insertValues = vi.fn((values: Record<string, unknown>) =>
    Object.assign(Promise.resolve(undefined), {
      onConflictDoNothing,
      onConflictDoUpdate,
      returning: insertReturning,
    }),
  );
  const insert = vi.fn(() => ({ values: insertValues }));

  const returning = vi.fn(async () => updateRows);
  const where = vi.fn<(clause: SQL) => { returning: typeof returning }>(() => ({ returning }));
  const set = vi.fn<(values: Record<string, unknown>) => { where: typeof where }>(() => ({
    where,
  }));
  const update = vi.fn(() => ({ set }));

  const deleteWhere = vi.fn<(clause: SQL) => Promise<void>>(async () => undefined);
  const del = vi.fn(() => ({ where: deleteWhere }));

  return {
    client: { select: vi.fn(), insert, update, delete: del },
    insert,
    insertValues,
    onConflictDoNothing,
    onConflictDoUpdate,
    update,
    set,
    where,
    returning,
    delete: del,
    deleteWhere,
  };
}

describe("AccessControlRolePersistence tenant scoping", () => {
  it("matches the platform role when no organization is given", async () => {
    const executor = createReadExecutor([]);
    const persistence = new AccessControlRolePersistence({} as never);

    await persistence.findRoleByName(ROLE_NAMES.SUPER_ADMIN, null, executor as never);

    const { sql: rendered, params } = render(executor.where.mock.calls[0]![0]);
    expect(rendered).toContain(`"${ROLES_TABLE}"."name" = $1`);
    expect(rendered).toContain(`"${ROLES_TABLE}"."organization_id" is null`);
    expect(params).toEqual([ROLE_NAMES.SUPER_ADMIN]);
  });

  it("matches the organization's own role when an organization is given", async () => {
    const executor = createReadExecutor([]);
    const persistence = new AccessControlRolePersistence({} as never);

    await persistence.findRoleByName(ROLE_NAMES.ADMIN, "org-1", executor as never);

    const { sql: rendered, params } = render(executor.where.mock.calls[0]![0]);
    // A tenant role must never be resolved from another tenant's row.
    expect(rendered).toContain(`"${ROLES_TABLE}"."organization_id" = $2`);
    expect(rendered).not.toContain("is null");
    expect(params).toEqual([ROLE_NAMES.ADMIN, "org-1"]);
  });

  it("restricts a platform-scope listing to platform roles", async () => {
    const executor = createReadExecutor([]);
    const persistence = new AccessControlRolePersistence({} as never);

    await persistence.findRolesPaginated(
      { page: 1, limit: 10, scope: "platform" },
      executor as never,
    );

    expect(render(executor.where.mock.calls[0]![0]).sql).toContain(
      `"${ROLES_TABLE}"."organization_id" is null`,
    );
  });

  it("restricts an organization-scope listing to tenant-bound roles", async () => {
    const executor = createReadExecutor([]);
    const persistence = new AccessControlRolePersistence({} as never);

    await persistence.findRolesPaginated(
      { page: 1, limit: 10, scope: "organization" },
      executor as never,
    );

    expect(render(executor.where.mock.calls[0]![0]).sql).toContain(
      `"${ROLES_TABLE}"."organization_id" is not null`,
    );
  });

  it("scopes a paginated listing to one organization when asked", async () => {
    const executor = createReadExecutor([]);
    const persistence = new AccessControlRolePersistence({} as never);

    await persistence.findRolesPaginated(
      { page: 1, limit: 10, organizationId: "org-1" },
      executor as never,
    );

    const { sql: rendered, params } = render(executor.where.mock.calls[0]![0]);
    expect(rendered).toContain(`"${ROLES_TABLE}"."organization_id" = $1`);
    expect(params).toEqual(["org-1"]);
  });

  it("deletes only the organization's roles on purge", async () => {
    const executor = createWriteExecutor();
    const persistence = new AccessControlRolePersistence({} as never);

    await persistence.deleteByOrganizationId("org-1", executor.client as never);

    const { sql: rendered, params } = render(executor.deleteWhere.mock.calls[0]![0]);
    expect(rendered).toContain(`"${ROLES_TABLE}"."organization_id" = $1`);
    expect(params).toEqual(["org-1"]);
  });
});

describe("AccessControlRolePersistence manageable-role filters", () => {
  it("offers only the platform USER role when there is no tenant context", async () => {
    const executor = createReadExecutor([]);
    const persistence = new AccessControlRolePersistence({} as never);

    await persistence.findRolesPaginated(
      { page: 1, limit: 10, manageableByOrg: null },
      executor as never,
    );

    const { sql: rendered, params } = render(executor.where.mock.calls[0]![0]);
    expect(params).toEqual([ROLE_NAMES.USER]);
    expect(rendered).toContain(`"${ROLES_TABLE}"."name" = $1`);
    // ADMIN and custom roles are tenant-bound, so none are offered here.
    expect(rendered).not.toContain(ROLE_NAMES.ADMIN);
    expect(rendered).not.toContain("is_system");
  });

  it("adds the tenant ADMIN role and its custom roles when a tenant is given", async () => {
    const executor = createReadExecutor([]);
    const persistence = new AccessControlRolePersistence({} as never);

    await persistence.findRolesPaginated(
      { page: 1, limit: 10, manageableByOrg: "org-1" },
      executor as never,
    );

    const { params } = render(executor.where.mock.calls[0]![0]);
    expect(params).toEqual([ROLE_NAMES.USER, ROLE_NAMES.ADMIN, "org-1", false, "org-1"]);
  });

  it("offers the fixed platform roles to a platform-scoped actor", async () => {
    const executor = createReadExecutor([]);
    const persistence = new AccessControlRolePersistence({} as never);

    await persistence.findManageableRolesForActor("org-1", true, executor as never);

    const { sql: rendered, params } = render(executor.where.mock.calls[0]![0]);
    expect(rendered).toContain(`"${ROLES_TABLE}"."name" in`);
    expect(rendered).toContain(`"${ROLES_TABLE}"."organization_id" is null`);
    expect(params).toEqual([ROLE_NAMES.SUPER_ADMIN, ROLE_NAMES.ADMIN, ROLE_NAMES.USER]);
  });

  it("offers the tenant roles to an organization-scoped actor", async () => {
    const executor = createReadExecutor([]);
    const persistence = new AccessControlRolePersistence({} as never);

    await persistence.findManageableRolesForActor("org-1", false, executor as never);

    const { sql: rendered, params } = render(executor.where.mock.calls[0]![0]);
    expect(rendered).toContain(`"${ROLES_TABLE}"."is_system" = $4`);
    expect(params).toEqual([ROLE_NAMES.USER, ROLE_NAMES.ADMIN, "org-1", false, "org-1"]);
  });
});

describe("AccessControlRolePersistence lock and idempotency", () => {
  it("takes a row lock when reading a role for update", async () => {
    const executor = createReadExecutor([{ id: "role-1" }]);
    const persistence = new AccessControlRolePersistence({} as never);

    await persistence.findRoleByIdWithLock("role-1", executor as never);

    // The lock is what serializes concurrent permission rewrites per role.
    expect(executor.forUpdate).toHaveBeenCalledWith("update");
    expect(render(executor.where.mock.calls[0]![0]).params).toEqual(["role-1"]);
  });

  it("returns null when a createRole collides with the name index", async () => {
    const executor = createWriteExecutor({ insertRows: [] });
    const persistence = new AccessControlRolePersistence({} as never);

    await expect(
      persistence.createRole({ name: "ADMIN" } as never, executor.client as never),
    ).resolves.toBeNull();

    expect(executor.onConflictDoNothing).toHaveBeenCalled();
  });

  it("stamps updatedAt on updateRole", async () => {
    const executor = createWriteExecutor({ updateRows: [{ id: "role-1" }] });
    const persistence = new AccessControlRolePersistence({} as never);

    await persistence.updateRole("role-1", { description: "new" }, executor.client as never);

    expect(executor.set).toHaveBeenCalledWith(
      expect.objectContaining({ description: "new", updatedAt: expect.any(Date) }),
    );
  });

  it("falls back to reading the row when the insert did not return one", async () => {
    const executor = createWriteExecutor({ insertRows: [] });
    const read = createReadExecutor([{ id: "role-1", name: ROLE_NAMES.ADMIN }]);
    const client = {
      insert: executor.insert,
      select: read.select,
    };
    const persistence = new AccessControlRolePersistence({} as never);

    await expect(
      persistence.ensureOrganizationSystemRole(
        ROLE_NAMES.ADMIN,
        "Tenant admin",
        "org-1",
        client as never,
      ),
    ).resolves.toMatchObject({ id: "role-1" });
  });

  it("fails loudly when a system role can neither be inserted nor found", async () => {
    const executor = createWriteExecutor({ insertRows: [] });
    const read = createReadExecutor([]);
    const client = { insert: executor.insert, select: read.select };
    const persistence = new AccessControlRolePersistence({} as never);

    await expect(
      persistence.ensureOrganizationSystemRole(
        ROLE_NAMES.ADMIN,
        "Tenant admin",
        "org-1",
        client as never,
      ),
    ).rejects.toThrow(/Failed to resolve system role "ADMIN" for organization org-1/);
  });

  it("short-circuits empty id and name lookups", async () => {
    const select = vi.fn();
    const persistence = new AccessControlRolePersistence({} as never);

    await expect(persistence.findRolesByIds([], { select } as never)).resolves.toEqual([]);
    await expect(persistence.findRolesByNames([], { select } as never)).resolves.toEqual([]);
    expect(select).not.toHaveBeenCalled();
  });
});

describe("AccessControlRolePersistence primary-read routing", () => {
  it("reads a role from the primary client of a replica-aware database", async () => {
    const primary = createReadExecutor([{ id: "role-1" }]);
    const replica = createReadExecutor([]);
    const database = { $primary: { select: primary.select }, select: replica.select };
    const persistence = new AccessControlRolePersistence(database as never);

    await expect(persistence.findRoleById("role-1")).resolves.toEqual({ id: "role-1" });

    // Authorization reads cannot tolerate replica lag.
    expect(primary.where).toHaveBeenCalledTimes(1);
    expect(replica.where).not.toHaveBeenCalled();
  });
});
