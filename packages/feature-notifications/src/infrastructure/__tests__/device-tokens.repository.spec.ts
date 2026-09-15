import type { SQL } from "drizzle-orm";

import { getTableName } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { describe, expect, it, vi } from "vitest";

import { tokenLockId } from "../../domain/token-lock";
import { notificationDeliveries, notificationDeviceTokens } from "../persistence";
import { DeviceTokensRepository } from "../device-tokens.repository";

const dialect = new PgDialect();
const TOKENS_TABLE = getTableName(notificationDeviceTokens);
const DELIVERIES_TABLE = getTableName(notificationDeliveries);

const TOKEN = "APA91bExampleFCMToken1234567890abcdef";

const render = (clause: SQL) => dialect.sqlToQuery(clause);

type Awaitable = Promise<unknown[]> & { returning: () => Promise<unknown[]> };

/**
 * Transaction stand-in covering the three shapes this repository uses:
 * `select().from().where().limit()`, `insert().values().returning()`, and
 * `update().set().where()` — the last one both awaited directly and finished
 * with `.returning()`.
 */
function createTx(
  options: { existing?: Record<string, unknown> | null; inserted?: unknown[] } = {},
) {
  const { existing = null, inserted = [{ id: "token-row-new", token: TOKEN }] } = options;

  const limit = vi.fn(async () => (existing ? [existing] : []));
  const selectWhere = vi.fn<(clause: SQL) => { limit: typeof limit }>(() => ({ limit }));
  const selectFrom = vi.fn(() => ({ where: selectWhere }));
  const select = vi.fn(() => ({ from: selectFrom }));

  const insertReturning = vi.fn(async () => inserted);
  const values = vi.fn<(values: Record<string, unknown>) => { returning: typeof insertReturning }>(
    () => ({ returning: insertReturning }),
  );
  const insert = vi.fn(() => ({ values }));

  const updateReturning = vi.fn(async () => (existing ? [existing] : []));
  const updateWhere = vi.fn<(clause: SQL) => Awaitable>(() =>
    Object.assign(Promise.resolve([]), { returning: updateReturning }),
  );
  const set = vi.fn<(values: Record<string, unknown>) => { where: typeof updateWhere }>(() => ({
    where: updateWhere,
  }));
  const update = vi.fn(() => ({ set }));

  return {
    tx: { select, insert, update } as never,
    select,
    selectWhere,
    insert,
    values,
    insertReturning,
    update,
    set,
    updateWhere,
    updateReturning,
  };
}

describe("DeviceTokensRepository.registerOrTransfer", () => {
  it("inserts a brand-new row for an unknown token", async () => {
    const executor = createTx({ existing: null });
    const advisoryLock = { withAdvisoryLock: vi.fn() };
    const repository = new DeviceTokensRepository({} as never, advisoryLock as never);

    await expect(
      repository.registerOrTransfer(
        { userId: "user-1", token: TOKEN, platform: "IOS" },
        executor.tx,
      ),
    ).resolves.toMatchObject({ created: true, transferred: false });

    expect(executor.values).toHaveBeenCalledWith({
      userId: "user-1",
      token: TOKEN,
      platform: "IOS",
      lastUsedAt: expect.any(Date),
    });
    // A caller-supplied executor means the caller owns serialization.
    expect(advisoryLock.withAdvisoryLock).not.toHaveBeenCalled();
  });

  it("touches lastUsedAt for a re-registration by the same owner without transferring", async () => {
    const existing = { id: "token-row-1", userId: "user-1", token: TOKEN };
    const executor = createTx({ existing });
    const repository = new DeviceTokensRepository(
      {} as never,
      { withAdvisoryLock: vi.fn() } as never,
    );

    const result = await repository.registerOrTransfer(
      { userId: "user-1", token: TOKEN, platform: "ANDROID" },
      executor.tx,
    );

    expect(result).toMatchObject({ created: false, transferred: false });
    expect(executor.set).toHaveBeenCalledWith(
      expect.objectContaining({
        platform: "ANDROID",
        lastUsedAt: expect.any(Date),
        disabledAt: null,
        disabledReason: null,
      }),
    );
    // A same-owner refresh must not insert a second row or kill deliveries.
    expect(executor.insert).not.toHaveBeenCalled();
    expect(executor.update).toHaveBeenCalledTimes(1);
  });

  it("transfers a token owned by another account: disable, invalidate in-flight deliveries, insert fresh", async () => {
    const existing = { id: "token-row-1", userId: "user-1", token: TOKEN };
    const executor = createTx({ existing });
    const repository = new DeviceTokensRepository(
      {} as never,
      { withAdvisoryLock: vi.fn() } as never,
    );

    const result = await repository.registerOrTransfer(
      { userId: "user-2", token: TOKEN, platform: "IOS" },
      executor.tx,
    );

    expect(result).toMatchObject({ created: true, transferred: true });

    // Two updates: the old token row, then the deliveries that pointed at it.
    expect(executor.update).toHaveBeenCalledTimes(2);
    const [tokenValues, deliveryValues] = executor.set.mock.calls.map((call) => call[0]);
    expect(tokenValues).toMatchObject({
      disabledAt: expect.any(Date),
      disabledReason: "Token claimed by new account",
    });
    expect(deliveryValues).toMatchObject({
      status: "FAILED",
      lastError: "Device token ownership transferred to another account",
    });

    const tokenClause = render(executor.updateWhere.mock.calls[0]![0]);
    const deliveryClause = render(executor.updateWhere.mock.calls[1]![0]);
    expect(tokenClause.params).toEqual(["token-row-1"]);
    // Only in-flight deliveries are invalidated — SENT history stays intact.
    expect(deliveryClause.sql).toContain(`"${DELIVERIES_TABLE}"."device_token_id" = $1`);
    expect(deliveryClause.sql).toContain(`"${DELIVERIES_TABLE}"."status" in`);
    expect(deliveryClause.params).toEqual(["token-row-1", "PENDING", "PROCESSING"]);

    // A fresh row with a new id keeps the partial unique index satisfied.
    expect(executor.values).toHaveBeenCalledWith({
      userId: "user-2",
      token: TOKEN,
      platform: "IOS",
      lastUsedAt: expect.any(Date),
    });
  });

  it("looks up only the active row for the token", async () => {
    const executor = createTx({ existing: null });
    const repository = new DeviceTokensRepository(
      {} as never,
      { withAdvisoryLock: vi.fn() } as never,
    );

    await repository.registerOrTransfer(
      { userId: "user-1", token: TOKEN, platform: "IOS" },
      executor.tx,
    );

    const { sql: rendered, params } = render(executor.selectWhere.mock.calls[0]![0]);
    expect(rendered).toContain(`"${TOKENS_TABLE}"."token" = $1`);
    expect(rendered).toContain(`"${TOKENS_TABLE}"."disabled_at" is null`);
    expect(params).toEqual([TOKEN]);
  });

  describe("without a caller-supplied executor", () => {
    it("takes the per-token advisory lock and runs the swap in one transaction", async () => {
      const executor = createTx({ existing: null });
      const order: string[] = [];
      const database = {
        transaction: vi.fn(async (run: (tx: unknown) => Promise<unknown>) => {
          order.push("transaction");
          return run(executor.tx);
        }),
      };
      const advisoryLock = {
        withAdvisoryLock: vi.fn(async (lockId: number, run: () => Promise<unknown>) => {
          order.push(`lock:${lockId}`);
          const result = await run();
          order.push("unlock");
          return result;
        }),
      };
      const repository = new DeviceTokensRepository(database as never, advisoryLock as never);

      await repository.registerOrTransfer({ userId: "user-1", token: TOKEN, platform: "IOS" });

      // Same lock id the delivery processor holds while sending to this token.
      const expectedLock = tokenLockId(TOKEN);
      expect(advisoryLock.withAdvisoryLock).toHaveBeenCalledTimes(1);
      expect(advisoryLock.withAdvisoryLock.mock.calls[0]![0]).toBe(expectedLock);
      expect(order).toEqual([`lock:${expectedLock}`, "transaction", "unlock"]);
    });

    it("returns null when the lock is held by an in-flight delivery", async () => {
      const executor = createTx();
      const database = { transaction: vi.fn() };
      const advisoryLock = { withAdvisoryLock: vi.fn(async () => null) };
      const repository = new DeviceTokensRepository(database as never, advisoryLock as never);

      await expect(
        repository.registerOrTransfer({ userId: "user-1", token: TOKEN, platform: "IOS" }),
      ).resolves.toBeNull();

      // No write attempt at all: the caller decides how to surface the conflict.
      expect(database.transaction).not.toHaveBeenCalled();
      expect(executor.insert).not.toHaveBeenCalled();
    });
  });
});

describe("DeviceTokensRepository reads", () => {
  it("lists a user's active tokens only", async () => {
    const where = vi.fn<(clause: SQL) => Promise<unknown[]>>(async () => [{ id: "token-row-1" }]);
    const executor = { select: vi.fn(() => ({ from: vi.fn(() => ({ where })) })) };
    const repository = new DeviceTokensRepository({} as never, {} as never);

    await expect(repository.listByUserId("user-1", executor as never)).resolves.toEqual([
      { id: "token-row-1" },
    ]);

    const { sql: rendered, params } = render(where.mock.calls[0]![0]);
    expect(rendered).toContain(`"${TOKENS_TABLE}"."user_id" = $1`);
    expect(rendered).toContain(`"${TOKENS_TABLE}"."disabled_at" is null`);
    expect(params).toEqual(["user-1"]);
  });

  it("short-circuits an empty id list", async () => {
    const select = vi.fn();
    const repository = new DeviceTokensRepository({} as never, {} as never);

    await expect(repository.listByIds([], { select } as never)).resolves.toEqual([]);
    expect(select).not.toHaveBeenCalled();
  });

  it("resolves the active row for a token", async () => {
    const limit = vi.fn(async () => [{ id: "token-row-1" }]);
    const where = vi.fn<(clause: SQL) => { limit: typeof limit }>(() => ({ limit }));
    const executor = { select: vi.fn(() => ({ from: vi.fn(() => ({ where })) })) };
    const repository = new DeviceTokensRepository({} as never, {} as never);

    await expect(repository.listActiveByToken(TOKEN, executor as never)).resolves.toEqual({
      id: "token-row-1",
    });

    const { sql: rendered } = render(where.mock.calls[0]![0]);
    expect(rendered).toContain(`"${TOKENS_TABLE}"."disabled_at" is null`);
  });

  it("returns null when the token has no active row", async () => {
    const executor = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({ where: vi.fn(() => ({ limit: vi.fn(async () => []) })) })),
      })),
    };
    const repository = new DeviceTokensRepository({} as never, {} as never);

    await expect(repository.listActiveByToken(TOKEN, executor as never)).resolves.toBeNull();
  });
});

describe("DeviceTokensRepository disable writes", () => {
  it("scopes unregistration to the caller's own token", async () => {
    const returning = vi.fn(async () => [{ id: "token-row-1" }]);
    const where = vi.fn<(clause: SQL) => { returning: typeof returning }>(() => ({ returning }));
    const set = vi.fn<(values: Record<string, unknown>) => { where: typeof where }>(() => ({
      where,
    }));
    const executor = { update: vi.fn(() => ({ set })) };
    const repository = new DeviceTokensRepository({} as never, {} as never);

    await repository.disableByToken("user-1", TOKEN, "User unregistered device", executor as never);

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        disabledAt: expect.any(Date),
        disabledReason: "User unregistered device",
      }),
    );
    const { sql: rendered, params } = render(where.mock.calls[0]![0]);
    // A user cannot disable someone else's token: both predicates are required.
    expect(rendered).toContain(`"${TOKENS_TABLE}"."user_id" = $1`);
    expect(rendered).toContain(`"${TOKENS_TABLE}"."token" = $2`);
    expect(params).toEqual(["user-1", TOKEN]);
  });

  it("short-circuits disabling an empty token list", async () => {
    const update = vi.fn();
    const repository = new DeviceTokensRepository({} as never, {} as never);

    await expect(
      repository.disableTokens([], "reason", { update } as never),
    ).resolves.toBeUndefined();
    expect(update).not.toHaveBeenCalled();
  });

  it("disables every token in the batch and records the reason", async () => {
    const where = vi.fn<(clause: SQL) => Promise<void>>(async () => undefined);
    const set = vi.fn<(values: Record<string, unknown>) => { where: typeof where }>(() => ({
      where,
    }));
    const executor = { update: vi.fn(() => ({ set })) };
    const repository = new DeviceTokensRepository({} as never, {} as never);

    await repository.disableTokens(
      [TOKEN, "second"],
      "FCM returned INVALID_TOKEN",
      executor as never,
    );

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({ disabledReason: "FCM returned INVALID_TOKEN" }),
    );
    const { sql: rendered, params } = render(where.mock.calls[0]![0]);
    expect(rendered).toContain(`"${TOKENS_TABLE}"."token" in`);
    expect(params).toEqual([TOKEN, "second"]);
  });
});
