import type { SQL } from "drizzle-orm";

import { getTableName } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it, vi } from "vitest";

import { permissions, rolePermissions } from "../persistence";
import { AccessControlPermissionPersistence } from "../access-control-permission.persistence";

const dialect = new PgDialect();
const PERMISSIONS_TABLE = getTableName(permissions);
const ROLE_PERMISSIONS_TABLE = getTableName(rolePermissions);

const render = (clause: SQL) => dialect.sqlToQuery(clause);

function createReadExecutor(rows: unknown[] = []) {
  const limit = vi.fn(async () => rows);
  const orderBy = vi.fn(async () => rows);
  const where = vi.fn<(clause: SQL) => Promise<unknown[]>>(() =>
    Object.assign(Promise.resolve(rows), { limit, orderBy }),
  );
  const from = vi.fn(() => chain);
  const innerJoin = vi.fn(() => chain);
  const chain = { where, orderBy, limit, from, innerJoin };
  const select = vi.fn(() => chain);

  return { select, from, innerJoin, where, orderBy, limit };
}

function createWriteExecutor() {
  const insertReturning = vi.fn(async () => []);
  const onConflictDoUpdate = vi.fn<(config: unknown) => { returning: typeof insertReturning }>(
    () => ({
      returning: insertReturning,
    }),
  );
  const insertValues = vi.fn((values: unknown) =>
    Object.assign(Promise.resolve(undefined), {
      returning: insertReturning,
      onConflictDoUpdate,
    }),
  );
  const insert = vi.fn(() => ({ values: insertValues }));

  const deleteWhere = vi.fn<(clause: SQL) => Promise<void>>(async () => undefined);
  const del = vi.fn(() => ({ where: deleteWhere }));

  const updateReturning = vi.fn(async () => []);
  const updateWhere = vi.fn(() => ({ returning: updateReturning }));
  const set = vi.fn(() => ({ where: updateWhere }));
  const update = vi.fn(() => ({ set }));

  return {
    client: { insert, delete: del, update },
    insert,
    insertValues,
    onConflictDoUpdate,
    delete: del,
    deleteWhere,
    update,
    set,
  };
}

describe("AccessControlPermissionPersistence reads", () => {
  it("short-circuits empty id and name lookups", async () => {
    const select = vi.fn();
    const persistence = new AccessControlPermissionPersistence({} as never);

    await expect(persistence.findPermissionsForRoleIds([], { select } as never)).resolves.toEqual(
      [],
    );
    await expect(persistence.findPermissionsByIds([], { select } as never)).resolves.toEqual([]);
    await expect(persistence.findPermissionsByNames([], { select } as never)).resolves.toEqual([]);
    expect(select).not.toHaveBeenCalled();
  });

  it("joins role permissions through the permission row", async () => {
    const executor = createReadExecutor([{ roleId: "role-1", id: "perm-1", name: "files.read" }]);
    const persistence = new AccessControlPermissionPersistence({} as never);

    await persistence.findPermissionsForRoleIds(["role-1"], executor as never);

    expect(executor.innerJoin).toHaveBeenCalledTimes(1);
    const { sql: rendered, params } = render(executor.where.mock.calls[0]![0]);
    expect(rendered).toContain(`"${ROLE_PERMISSIONS_TABLE}"."role_id" in`);
    expect(params).toEqual(["role-1"]);
  });

  it("maps permission ids for a role", async () => {
    const executor = createReadExecutor([{ permissionId: "perm-1" }, { permissionId: "perm-2" }]);
    const persistence = new AccessControlPermissionPersistence({} as never);

    await expect(
      persistence.findPermissionIdsForRole("role-1", executor as never),
    ).resolves.toEqual(["perm-1", "perm-2"]);

    expect(render(executor.where.mock.calls[0]![0]).params).toEqual(["role-1"]);
  });

  it("returns null when a permission id does not resolve", async () => {
    const executor = createReadExecutor([]);
    const persistence = new AccessControlPermissionPersistence({} as never);

    await expect(persistence.findPermissionById("perm-1", executor as never)).resolves.toBeNull();
  });
});

describe("AccessControlPermissionPersistence.replaceRolePermissions", () => {
  it("clears then rewrites the role's permission set", async () => {
    const executor = createWriteExecutor();
    const persistence = new AccessControlPermissionPersistence({} as never);

    await persistence.replaceRolePermissions(
      "role-1",
      ["perm-1", "perm-2"],
      executor.client as never,
    );

    const { sql: rendered, params } = render(executor.deleteWhere.mock.calls[0]![0]);
    expect(rendered).toContain(`"${ROLE_PERMISSIONS_TABLE}"."role_id" = $1`);
    expect(params).toEqual(["role-1"]);
    expect(executor.insertValues).toHaveBeenCalledWith([
      { roleId: "role-1", permissionId: "perm-1" },
      { roleId: "role-1", permissionId: "perm-2" },
    ]);
  });

  it("does not emit an insert when the new permission set is empty", async () => {
    const executor = createWriteExecutor();
    const persistence = new AccessControlPermissionPersistence({} as never);

    await persistence.replaceRolePermissions("role-1", [], executor.client as never);

    // Clearing every permission must remain a plain delete: Drizzle renders
    // `insert into ... values ` for an empty array, which Postgres rejects.
    expect(executor.deleteWhere).toHaveBeenCalledTimes(1);
    expect(executor.insert).not.toHaveBeenCalled();
  });
});

describe("AccessControlPermissionPersistence.ensurePermissions", () => {
  it("upserts on the permission name and re-reads the rows", async () => {
    const executor = createWriteExecutor();
    const read = createReadExecutor([{ id: "perm-1", name: "files.read" }]);
    const client = { insert: executor.insert, select: read.select };
    const persistence = new AccessControlPermissionPersistence({} as never);

    await expect(
      persistence.ensurePermissions(
        [{ name: "files.read", description: "Read files", scope: "organization" }],
        client as never,
      ),
    ).resolves.toEqual([{ id: "perm-1", name: "files.read" }]);

    const [config] = executor.onConflictDoUpdate.mock.calls[0]! as unknown as [
      { target: unknown; set: { scope: SQL } },
    ];
    expect(config.target).toBe(permissions.name);
    // Scope is refreshed from the incoming row so a re-seed can widen it.
    expect(dialect.sqlToQuery(config.set.scope).sql).toContain("EXCLUDED.scope");
  });
});

describe("AccessControlPermissionPersistence primary-read routing", () => {
  it("reads permissions from the primary client of a replica-aware database", async () => {
    const primary = createReadExecutor([{ id: "perm-1" }]);
    const replica = createReadExecutor([]);
    const database = { $primary: { select: primary.select }, select: replica.select };
    const persistence = new AccessControlPermissionPersistence(database as never);

    await expect(persistence.findAllPermissions()).resolves.toEqual([{ id: "perm-1" }]);

    expect(primary.select).toHaveBeenCalledTimes(1);
    expect(replica.select).not.toHaveBeenCalled();
  });

  it("deletes a permission by id", async () => {
    const executor = createWriteExecutor();
    const persistence = new AccessControlPermissionPersistence({} as never);

    await persistence.deletePermission("perm-1", executor.client as never);

    const { sql: rendered, params } = render(executor.deleteWhere.mock.calls[0]![0]);
    expect(rendered).toContain(`"${PERMISSIONS_TABLE}"."id" = $1`);
    expect(params).toEqual(["perm-1"]);
  });
});
