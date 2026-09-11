import { describe, expect, it, vi } from "vitest";

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
