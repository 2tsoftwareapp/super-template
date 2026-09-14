import { describe, expect, it, vi } from "vitest";

import type { UserOrganizationScope } from "../public/user-organization-scope.port";

import { UsersRepository } from "./users.repository";

const userRow = { id: "user-1", email: "user@example.local" };

/**
 * Minimal Drizzle stand-in for `select().from().where().limit()`. Every step is a
 * spy, so a test can prove which client actually served the query.
 */
function createExecutor(rows: unknown[]) {
  const limit = vi.fn().mockResolvedValue(rows);
  const where = vi.fn(() => ({ limit }));
  const from = vi.fn(() => ({ where }));
  const select = vi.fn(() => ({ from }));

  return { client: { select }, select, from, where, limit };
}

/**
 * Same stand-in, but `where()` is itself awaitable so `select().from().where()`
 * resolves without the `.limit()` tail the org-scoped lookups omit.
 */
function createAwaitableExecutor(rows: unknown[]) {
  const limit = vi.fn(async () => rows);
  const where = vi.fn(() => {
    const query = Promise.resolve(rows) as Promise<unknown[]> & { limit: typeof limit };
    query.limit = limit;
    return query;
  });
  const from = vi.fn(() => ({ where }));
  const select = vi.fn(() => ({ from }));

  return { client: { select }, select, from, where, limit };
}

function buildOrganizationScope(
  overrides: Partial<UserOrganizationScope> = {},
): UserOrganizationScope {
  return {
    isMember: vi.fn(async () => true),
    filterMemberUserIds: vi.fn(async (userIds: string[]) => userIds),
    listMemberUserIds: vi.fn(async () => []),
    ...overrides,
  };
}

describe("UsersRepository strong reads", () => {
  it("routes findByIdStrong to the primary client of a replica-aware database", async () => {
    const primary = createExecutor([userRow]);
    const replica = createExecutor([]);
    const database = { $primary: primary.client, ...replica.client };

    const repository = new UsersRepository(database as never);

    await expect(repository.findByIdStrong("user-1")).resolves.toEqual(userRow);
    expect(primary.limit).toHaveBeenCalledTimes(1);
    expect(replica.limit).not.toHaveBeenCalled();
  });

  it("keeps the default read path on the injected client", async () => {
    const primary = createExecutor([]);
    const replica = createExecutor([userRow]);
    const database = { $primary: primary.client, ...replica.client };

    const repository = new UsersRepository(database as never);

    await expect(repository.findById("user-1")).resolves.toEqual(userRow);
    expect(replica.limit).toHaveBeenCalledTimes(1);
    expect(primary.limit).not.toHaveBeenCalled();
  });
});

describe("UsersRepository organization-scoped lookups (USER_LOOKUP)", () => {
  it("returns the user when the organization scope reports membership", async () => {
    const executor = createAwaitableExecutor([userRow]);
    const organizationScope = buildOrganizationScope();
    const repository = new UsersRepository(executor.client as never, organizationScope);

    await expect(
      repository.findActiveUserInOrganization("user-1", "org-1", executor.client as never),
    ).resolves.toEqual(userRow);

    expect(organizationScope.isMember).toHaveBeenCalledWith("user-1", "org-1", executor.client);
    expect(executor.select).toHaveBeenCalledTimes(1);
  });

  it("returns null without querying users when the scope reports no membership", async () => {
    const executor = createAwaitableExecutor([userRow]);
    const organizationScope = buildOrganizationScope({ isMember: vi.fn(async () => false) });
    const repository = new UsersRepository(executor.client as never, organizationScope);

    await expect(
      repository.findActiveUserInOrganization("user-1", "org-1", executor.client as never),
    ).resolves.toBeNull();

    expect(executor.select).not.toHaveBeenCalled();
  });

  it("intersects the requested ids with the organization members", async () => {
    const executor = createAwaitableExecutor([{ id: "user-2" }]);
    const organizationScope = buildOrganizationScope({
      filterMemberUserIds: vi.fn(async () => ["user-2"]),
    });
    const repository = new UsersRepository(executor.client as never, organizationScope);

    await expect(
      repository.filterActiveUserIdsInOrganization(
        ["user-2", "user-3"],
        "org-1",
        executor.client as never,
      ),
    ).resolves.toEqual(["user-2"]);

    expect(organizationScope.filterMemberUserIds).toHaveBeenCalledWith(
      ["user-2", "user-3"],
      "org-1",
      executor.client,
    );
  });

  it("short-circuits an empty id list without consulting the scope", async () => {
    const executor = createAwaitableExecutor([]);
    const organizationScope = buildOrganizationScope();
    const repository = new UsersRepository(executor.client as never, organizationScope);

    await expect(
      repository.filterActiveUserIdsInOrganization([], "org-1", executor.client as never),
    ).resolves.toEqual([]);

    expect(organizationScope.filterMemberUserIds).not.toHaveBeenCalled();
    expect(executor.select).not.toHaveBeenCalled();
  });

  it("returns deliverable ids by narrowing organization members to active accounts", async () => {
    const executor = createAwaitableExecutor([{ id: "user-1" }]);
    const organizationScope = buildOrganizationScope({
      listMemberUserIds: vi.fn(async () => ["user-1", "user-2"]),
    });
    const repository = new UsersRepository(executor.client as never, organizationScope);

    await expect(
      repository.listDeliverableUserIdsInOrganization("org-1", executor.client as never),
    ).resolves.toEqual(["user-1"]);

    expect(organizationScope.listMemberUserIds).toHaveBeenCalledWith("org-1", executor.client);
  });

  it("fails closed when the organization scope port is not bound", async () => {
    const repository = new UsersRepository(createAwaitableExecutor([]).client as never);

    await expect(repository.listDeliverableUserIdsInOrganization("org-1")).rejects.toThrow(
      expect.objectContaining({ code: "USER_ORGANIZATION_SCOPE_UNAVAILABLE" }),
    );
  });
});
