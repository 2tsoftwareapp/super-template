import type { SQL } from "drizzle-orm";

import { getTableName } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it, vi } from "vitest";

import {
  softDeleteUserAccount,
  USER_ACCOUNT_SOFT_DELETE_MARKER,
  USER_ACCOUNT_STATUS,
} from "../domain/user-account.policy";
import type { UserOrganizationScope } from "../public/user-organization-scope.port";

import { users } from "./persistence";
import { UsersRepository } from "./users.repository";

const dialect = new PgDialect();
const USERS_TABLE = getTableName(users);
/** Rendered form of the live-account predicate, from the column the policy names. */
const ACTIVE_ACCOUNT_SQL = `"${USERS_TABLE}"."deleted_at" is null`;

const userRow = { id: "user-1", email: "user@example.local" };

function render(clause: SQL) {
  return dialect.sqlToQuery(clause);
}

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
  const where = vi.fn<(clause: SQL) => Promise<unknown[]> & { limit: typeof limit }>(() => {
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

/* ------------------------------------------------------------------------- *
 * Read/write chain stand-ins for the paths that render real SQL.
 * ------------------------------------------------------------------------- */

/** Resolves to `rows` while still carrying the next chain step, like Drizzle's
 * query builders — the repository awaits some steps and chains off others. */
const thenable = <T extends object>(rows: unknown[], extra: T) =>
  Object.assign(Promise.resolve(rows), extra);

/**
 * Thenable stand-in for a Drizzle read chain: it resolves like `await
 * select().from().where()` (the id lookups) and still exposes
 * `.orderBy()/.limit()/.offset()` for the paginated list path.
 */
function createQuery(rows: unknown[]) {
  const offset = vi.fn<(count: number) => Promise<unknown[]>>(async () => rows);
  const limit = vi.fn<(count: number) => Promise<unknown[]> & { offset: typeof offset }>(() =>
    thenable(rows, { offset }),
  );
  const orderBy = vi.fn<(...clauses: SQL[]) => { limit: typeof limit }>(() => ({ limit }));
  const query = thenable(rows, { orderBy, limit });

  return { query, orderBy, limit, offset };
}

/** The list path's `select({ total: count() })` projection, distinguished from
 * `select({ id: users.id })` so the count query can resolve independently. */
const isCountProjection = (projection: unknown) =>
  typeof projection === "object" && projection !== null && "total" in projection;

/**
 * Read executor that renders both branches of `list()`: the row query (which
 * ends in `.orderBy().limit().offset()`) and the parallel count query.
 */
function createReadExecutor(rows: unknown[] = [], total = rows.length) {
  const rowQuery = createQuery(rows);
  const rowWhere = vi.fn<(clause: SQL) => typeof rowQuery.query>(() => rowQuery.query);
  const rowFrom = vi.fn(() => ({ where: rowWhere }));

  const countWhere = vi.fn<(clause: SQL) => Promise<Array<{ total: number }>>>(async () => [
    { total },
  ]);
  const countFrom = vi.fn(() => ({ where: countWhere }));

  const select = vi.fn((projection?: unknown) =>
    isCountProjection(projection) ? { from: countFrom } : { from: rowFrom },
  );

  return { client: { select }, select, rowWhere, countWhere, rowQuery };
}

/** Captures the `insert().values().returning()` and `update().set().where().returning()` chains. */
function createWriteExecutor(rows: unknown[] = []) {
  const returning = vi.fn(async () => rows);
  const where = vi.fn<(condition: SQL) => { returning: typeof returning }>(() => ({ returning }));
  const set = vi.fn<(values: Record<string, unknown>) => { where: typeof where }>(() => ({
    where,
  }));
  const update = vi.fn(() => ({ set }));

  const values = vi.fn<(values: Record<string, unknown>) => { returning: typeof returning }>(
    () => ({ returning }),
  );
  const insert = vi.fn(() => ({ values }));

  return { client: { insert, update }, insert, values, update, set, where, returning };
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

describe("UsersRepository writes", () => {
  it("creates the account from the supplied values and returns the inserted row", async () => {
    const executor = createWriteExecutor([userRow]);
    const repository = new UsersRepository(executor.client as never);
    const values = {
      email: "user@example.local",
      passwordHash: "hash",
      displayName: "User",
    };

    await expect(repository.create(values, executor.client as never)).resolves.toEqual(userRow);

    expect(executor.values).toHaveBeenCalledWith(values);
  });

  it("refuses to report success when the insert returned no rows", async () => {
    const executor = createWriteExecutor([]);
    const repository = new UsersRepository(executor.client as never);

    await expect(
      repository.create({ email: "user@example.local" } as never, executor.client as never),
    ).rejects.toThrow("User insert returned no rows");
  });

  it("stamps updatedAt on update and returns null when nothing matched", async () => {
    const executor = createWriteExecutor([]);
    const repository = new UsersRepository(executor.client as never);

    await expect(
      repository.update("user-1", { displayName: "Renamed" }, executor.client as never),
    ).resolves.toBeNull();

    expect(executor.set).toHaveBeenCalledWith(
      expect.objectContaining({ displayName: "Renamed", updatedAt: expect.any(Date) }),
    );
    expect(render(executor.where.mock.calls[0]![0]).params).toEqual(["user-1"]);
  });

  it("soft-deletes through the domain policy: deleted_at stamped AND status parked in BLOCKED", async () => {
    const executor = createWriteExecutor([{ ...userRow, status: USER_ACCOUNT_STATUS.BLOCKED }]);
    const repository = new UsersRepository(executor.client as never);

    await repository.softDelete("user-1", executor.client as never);

    const values = executor.set.mock.calls[0]![0];
    const policy = softDeleteUserAccount(new Date());

    // Expectations come from the policy, not a hand-copied literal: the marker
    // field and the parked status are one decision, made in the domain file.
    expect(values[USER_ACCOUNT_SOFT_DELETE_MARKER]).toBeInstanceOf(Date);
    expect(values.status).toBe(policy.status);
    expect(values.status).toBe(USER_ACCOUNT_STATUS.BLOCKED);
    // A soft-deleted account must not stay ACTIVE or PENDING, or the deliverable
    // fan-out would keep targeting it.
    expect(values.status).not.toBe(USER_ACCOUNT_STATUS.ACTIVE);
    expect(values.status).not.toBe(USER_ACCOUNT_STATUS.PENDING);
    expect(render(executor.where.mock.calls[0]![0]).params).toEqual(["user-1"]);
  });

  it("returns the soft-deleted row on a second soft delete of a still-present row", async () => {
    const executor = createWriteExecutor([{ ...userRow, status: USER_ACCOUNT_STATUS.BLOCKED }]);
    const repository = new UsersRepository(executor.client as never);

    await expect(repository.softDelete("user-1", executor.client as never)).resolves.toMatchObject({
      id: "user-1",
    });
  });
});

describe("UsersRepository soft-delete scoping", () => {
  it("excludes soft-deleted accounts from the by-id read", async () => {
    const executor = createReadExecutor([userRow]);
    const repository = new UsersRepository(executor.client as never);

    await repository.findById("user-1", executor.client as never);

    const { sql: rendered, params } = render(executor.rowWhere.mock.calls[0]![0]);
    expect(rendered).toContain(ACTIVE_ACCOUNT_SQL);
    expect(params).toContain("user-1");
  });

  it("excludes soft-deleted accounts from the by-email read", async () => {
    const executor = createReadExecutor([userRow]);
    const repository = new UsersRepository(executor.client as never);

    await repository.findByEmail("user@example.local", executor.client as never);

    const { sql: rendered, params } = render(executor.rowWhere.mock.calls[0]![0]);
    expect(rendered).toContain(`"${USERS_TABLE}"."email" = $1`);
    expect(rendered).toContain(ACTIVE_ACCOUNT_SQL);
    expect(params).toEqual(["user@example.local"]);
  });

  it("returns null when the by-email read finds no live account", async () => {
    const executor = createReadExecutor([]);
    const repository = new UsersRepository(executor.client as never);

    await expect(
      repository.findByEmail("gone@example.local", executor.client as never),
    ).resolves.toBeNull();
  });

  it("short-circuits the existence filter on an empty id list", async () => {
    const executor = createReadExecutor([]);
    const repository = new UsersRepository(executor.client as never);

    await expect(repository.filterExistingUserIds([], executor.client as never)).resolves.toEqual(
      [],
    );
    expect(executor.select).not.toHaveBeenCalled();
  });

  it("excludes soft-deleted accounts from the existence filter", async () => {
    const executor = createReadExecutor([{ id: "user-1" }]);
    const repository = new UsersRepository(executor.client as never);

    await expect(
      repository.filterExistingUserIds(["user-1", "user-2"], executor.client as never),
    ).resolves.toEqual(["user-1"]);

    const { sql: rendered, params } = render(executor.rowWhere.mock.calls[0]![0]);
    expect(rendered).toContain(ACTIVE_ACCOUNT_SQL);
    expect(rendered).toContain(`"${USERS_TABLE}"."id" in`);
    expect(params).toEqual(["user-1", "user-2"]);
  });

  it("narrows the deliverable fan-out to live ACTIVE accounts", async () => {
    const executor = createReadExecutor([{ id: "user-1" }]);
    const repository = new UsersRepository(executor.client as never);

    await expect(repository.listDeliverableUserIds(executor.client as never)).resolves.toEqual([
      "user-1",
    ]);

    const { sql: rendered, params } = render(executor.rowWhere.mock.calls[0]![0]);
    expect(rendered).toContain(ACTIVE_ACCOUNT_SQL);
    expect(rendered).toContain(`"${USERS_TABLE}"."status" = $1`);
    expect(params).toEqual([USER_ACCOUNT_STATUS.ACTIVE]);
  });

  it("applies the identical live-account predicate to the list rows and the count", async () => {
    const executor = createReadExecutor([userRow], 1);
    const repository = new UsersRepository(executor.client as never);

    await repository.list(
      { page: 1, limit: 10, sort: [{ field: "createdAt", order: "desc" }] },
      executor.client as never,
    );

    const rowClause = executor.rowWhere.mock.calls[0]![0];
    const countClause = executor.countWhere.mock.calls[0]![0];

    // A count that disagreed with the rows would make pages lie about the total.
    expect(render(rowClause).sql).toBe(render(countClause).sql);
    expect(render(rowClause).sql).toContain(ACTIVE_ACCOUNT_SQL);
  });
});

describe("UsersRepository list", () => {
  const baseQuery = { page: 1, limit: 20, sort: [{ field: "createdAt", order: "desc" }] } as const;

  it("filters the search term across email and display name", async () => {
    const executor = createReadExecutor([userRow], 1);
    const repository = new UsersRepository(executor.client as never);

    await repository.list({ ...baseQuery, search: "ada" }, executor.client as never);

    const { sql: rendered, params } = render(executor.rowWhere.mock.calls[0]![0]);
    expect(rendered).toContain(`"${USERS_TABLE}"."email" ilike $1`);
    expect(rendered).toContain(`"${USERS_TABLE}"."display_name" ilike $2`);
    expect(rendered).toContain(ACTIVE_ACCOUNT_SQL);
    expect(params).toEqual(["%ada%", "%ada%"]);
  });

  it("applies the status filter", async () => {
    const executor = createReadExecutor([userRow], 1);
    const repository = new UsersRepository(executor.client as never);

    await repository.list(
      { ...baseQuery, status: USER_ACCOUNT_STATUS.PENDING },
      executor.client as never,
    );

    const { sql: rendered, params } = render(executor.rowWhere.mock.calls[0]![0]);
    expect(rendered).toContain(`"${USERS_TABLE}"."status" = $1`);
    expect(params).toEqual([USER_ACCOUNT_STATUS.PENDING]);
  });

  it("omits the search and status predicates when the query does not ask for them", async () => {
    const executor = createReadExecutor([], 0);
    const repository = new UsersRepository(executor.client as never);

    await repository.list({ ...baseQuery }, executor.client as never);

    const { sql: rendered, params } = render(executor.rowWhere.mock.calls[0]![0]);
    expect(rendered).not.toContain("ilike");
    expect(rendered).not.toContain(`"${USERS_TABLE}"."status"`);
    expect(params).toEqual([]);
  });

  it("restricts to the candidate ids and ignores an empty candidate list", async () => {
    const executor = createReadExecutor([userRow], 1);
    const repository = new UsersRepository(executor.client as never);

    await repository.list(
      { ...baseQuery, candidateUserIds: ["user-1", "user-2"] },
      executor.client as never,
    );
    const { sql: withCandidates, params } = render(executor.rowWhere.mock.calls[0]![0]);
    expect(withCandidates).toContain(`"${USERS_TABLE}"."id" in`);
    expect(params).toEqual(["user-1", "user-2"]);

    executor.rowWhere.mockClear();
    await repository.list({ ...baseQuery, candidateUserIds: [] }, executor.client as never);
    // An empty candidate list means "no restriction", not "match nothing".
    expect(render(executor.rowWhere.mock.calls[0]![0]).sql).not.toContain("in (");
  });

  it("orders by the requested field and direction", async () => {
    const executor = createReadExecutor([], 0);
    const repository = new UsersRepository(executor.client as never);

    await repository.list(
      {
        page: 1,
        limit: 10,
        sort: [
          { field: "displayName", order: "asc" },
          { field: "email", order: "desc" },
        ],
      },
      executor.client as never,
    );

    const clauses = executor.rowQuery.orderBy.mock.calls[0]!;
    expect(render(clauses[0]!).sql).toBe(`"${USERS_TABLE}"."display_name" asc`);
    expect(render(clauses[1]!).sql).toBe(`"${USERS_TABLE}"."email" desc`);
  });

  it("derives the offset from the page and forwards the limit", async () => {
    const executor = createReadExecutor([], 0);
    const repository = new UsersRepository(executor.client as never);

    await repository.list({ ...baseQuery, page: 3, limit: 25 }, executor.client as never);

    expect(executor.rowQuery.limit).toHaveBeenCalledWith(25);
    expect(executor.rowQuery.offset).toHaveBeenCalledWith(50);
  });

  it("rejects an unknown sort field before touching the database", async () => {
    const executor = createReadExecutor([], 0);
    const repository = new UsersRepository(executor.client as never);

    await expect(
      repository.list(
        { ...baseQuery, sort: [{ field: "passwordHash", order: "asc" }] },
        executor.client as never,
      ),
    ).rejects.toThrow("Invalid sort field: passwordHash");

    expect(executor.select).not.toHaveBeenCalled();
  });

  it("returns the total from the count query rather than the page length", async () => {
    const executor = createReadExecutor([userRow], 137);
    const repository = new UsersRepository(executor.client as never);

    await expect(repository.list(baseQuery, executor.client as never)).resolves.toEqual({
      rows: [userRow],
      total: 137,
    });
  });

  it("reports zero when the count query returns no bucket row", async () => {
    const executor = createReadExecutor([], 0);
    executor.countWhere.mockResolvedValueOnce([]);
    const repository = new UsersRepository(executor.client as never);

    await expect(repository.list(baseQuery, executor.client as never)).resolves.toEqual({
      rows: [],
      total: 0,
    });
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

  it("still requires a live ACTIVE account inside the organization", async () => {
    const executor = createAwaitableExecutor([
      { id: "user-1", email: "u@example.local", displayName: "U", status: "ACTIVE" },
    ]);
    const repository = new UsersRepository(executor.client as never, buildOrganizationScope());

    await repository.findActiveUserInOrganization("user-1", "org-1", executor.client as never);

    const { sql: rendered, params } = render(executor.where.mock.calls[0]![0]);
    expect(rendered).toContain(ACTIVE_ACCOUNT_SQL);
    expect(rendered).toContain(`"${USERS_TABLE}"."status" = $2`);
    expect(params).toEqual(["user-1", USER_ACCOUNT_STATUS.ACTIVE]);
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

  it("queries only the member ids the scope returned, scoped to live ACTIVE accounts", async () => {
    const executor = createAwaitableExecutor([{ id: "user-2" }]);
    const organizationScope = buildOrganizationScope({
      filterMemberUserIds: vi.fn(async () => ["user-2"]),
    });
    const repository = new UsersRepository(executor.client as never, organizationScope);

    await repository.filterActiveUserIdsInOrganization(
      ["user-2", "user-3"],
      "org-1",
      executor.client as never,
    );

    const { sql: rendered, params } = render(executor.where.mock.calls[0]![0]);
    expect(rendered).toContain(ACTIVE_ACCOUNT_SQL);
    expect(rendered).toContain(`"${USERS_TABLE}"."status" = $2`);
    // Only the members survive into the query — non-members never reach users.
    expect(params).toEqual(["user-2", USER_ACCOUNT_STATUS.ACTIVE]);
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

  it("skips the user query when the scope reports no members at all", async () => {
    const executor = createAwaitableExecutor([{ id: "user-1" }]);
    const organizationScope = buildOrganizationScope({
      filterMemberUserIds: vi.fn(async () => []),
    });
    const repository = new UsersRepository(executor.client as never, organizationScope);

    await expect(
      repository.filterActiveUserIdsInOrganization(["user-1"], "org-1", executor.client as never),
    ).resolves.toEqual([]);

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

  it("queries only the members the scope returned, scoped to live ACTIVE accounts", async () => {
    const executor = createAwaitableExecutor([{ id: "user-1" }]);
    const organizationScope = buildOrganizationScope({
      listMemberUserIds: vi.fn(async () => ["user-1", "user-2"]),
    });
    const repository = new UsersRepository(executor.client as never, organizationScope);

    await repository.listDeliverableUserIdsInOrganization("org-1", executor.client as never);

    const { sql: rendered, params } = render(executor.where.mock.calls[0]![0]);
    expect(rendered).toContain(ACTIVE_ACCOUNT_SQL);
    expect(rendered).toContain(`"${USERS_TABLE}"."status" = $3`);
    expect(params).toEqual(["user-1", "user-2", USER_ACCOUNT_STATUS.ACTIVE]);
  });

  it("skips the user query when the organization has no members", async () => {
    const executor = createAwaitableExecutor([{ id: "user-1" }]);
    const organizationScope = buildOrganizationScope({ listMemberUserIds: vi.fn(async () => []) });
    const repository = new UsersRepository(executor.client as never, organizationScope);

    await expect(
      repository.listDeliverableUserIdsInOrganization("org-1", executor.client as never),
    ).resolves.toEqual([]);

    expect(executor.select).not.toHaveBeenCalled();
  });

  it.each([
    [
      "findActiveUserInOrganization",
      (repository: UsersRepository) => repository.findActiveUserInOrganization("user-1", "org-1"),
    ],
    [
      "filterActiveUserIdsInOrganization",
      (repository: UsersRepository) =>
        repository.filterActiveUserIdsInOrganization(["user-1"], "org-1"),
    ],
    [
      "listDeliverableUserIdsInOrganization",
      (repository: UsersRepository) => repository.listDeliverableUserIdsInOrganization("org-1"),
    ],
  ])("fails closed when the organization scope port is not bound (%s)", async (_name, call) => {
    const repository = new UsersRepository(createAwaitableExecutor([]).client as never);

    await expect(call(repository)).rejects.toThrow(
      expect.objectContaining({ code: "USER_ORGANIZATION_SCOPE_UNAVAILABLE" }),
    );
  });
});
