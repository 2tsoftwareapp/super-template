import { describe, expect, it, vi } from "vitest";

import { runIdempotentInsert, runIdempotentInsertMany } from "../idempotent-insert";

describe("runIdempotentInsert", () => {
  it("returns inserted value when the insert succeeds", async () => {
    const insert = vi.fn().mockResolvedValue({ id: "job-1" });
    const findExisting = vi.fn();

    await expect(runIdempotentInsert(insert, findExisting)).resolves.toEqual({
      value: { id: "job-1" },
      created: true,
    });
    expect(findExisting).not.toHaveBeenCalled();
  });

  it("returns the existing row when a unique violation occurs", async () => {
    const insert = vi.fn().mockRejectedValue({ code: "23505" });
    const findExisting = vi.fn().mockResolvedValue({ id: "job-1" });

    await expect(runIdempotentInsert(insert, findExisting)).resolves.toEqual({
      value: { id: "job-1" },
      created: false,
    });
    expect(findExisting).toHaveBeenCalledTimes(1);
  });

  it("returns null when the insert loses the race and no row is visible yet", async () => {
    const insert = vi.fn().mockResolvedValue(undefined);
    const findExisting = vi.fn().mockResolvedValue(null);

    await expect(runIdempotentInsert(insert, findExisting)).resolves.toBeNull();
  });

  it("rethrows non-unique errors", async () => {
    const error = new Error("database unavailable");

    await expect(
      runIdempotentInsert(vi.fn().mockRejectedValue(error), vi.fn().mockResolvedValue(null)),
    ).rejects.toBe(error);
  });
});

describe("runIdempotentInsertMany", () => {
  type Row = { userId: string; id: string };

  it("returns only the created rows when the insert covers every expected key", async () => {
    const insert = vi.fn().mockResolvedValue([
      { userId: "user-a", id: "n-1" },
      { userId: "user-b", id: "n-2" },
    ]);
    const findExisting = vi.fn();

    const result = await runIdempotentInsertMany({
      expectedKeys: ["user-a", "user-b"],
      keyOf: (row: Row) => row.userId,
      insert,
      findExisting,
    });

    expect(result.rows).toEqual([
      { userId: "user-a", id: "n-1" },
      { userId: "user-b", id: "n-2" },
    ]);
    expect(result.created).toBe(true);
    expect(findExisting).not.toHaveBeenCalled();
  });

  it("retries with one row per key", async () => {
    // The unique index absorbed the previous attempt: the insert creates nothing.
    const insert = vi.fn().mockResolvedValue([]);
    const findExisting = vi.fn().mockResolvedValue([{ userId: "user-a", id: "n-1" }]);

    const result = await runIdempotentInsertMany({
      expectedKeys: ["user-a"],
      keyOf: (row: Row) => row.userId,
      insert,
      findExisting,
    });

    expect(result.rows).toEqual([{ userId: "user-a", id: "n-1" }]);
    expect(result.created).toBe(false);
    expect(findExisting).toHaveBeenCalledWith(["user-a"]);
  });

  it("converges after a partial failure: created keys are not re-read, missing keys are replayed", async () => {
    const insert = vi.fn().mockResolvedValue([{ userId: "user-a", id: "n-1" }]);
    const findExisting = vi.fn().mockResolvedValue([{ userId: "user-b", id: "n-2" }]);

    const result = await runIdempotentInsertMany({
      expectedKeys: ["user-a", "user-b"],
      keyOf: (row: Row) => row.userId,
      insert,
      findExisting,
    });

    expect(result.rows).toEqual([
      { userId: "user-a", id: "n-1" },
      { userId: "user-b", id: "n-2" },
    ]);
    expect(findExisting).toHaveBeenCalledWith(["user-b"]);
  });

  it("absorbs duplicate expected keys and duplicate existing rows into one row per key", async () => {
    const result = await runIdempotentInsertMany({
      expectedKeys: ["user-a", "user-a", "user-b"],
      keyOf: (row: Row) => row.userId,
      insert: vi.fn().mockResolvedValue([{ userId: "user-a", id: "n-1" }]),
      findExisting: vi.fn().mockResolvedValue([
        { userId: "user-b", id: "n-2" },
        { userId: "user-b", id: "n-2" },
      ]),
    });

    expect(result.rows).toEqual([
      { userId: "user-a", id: "n-1" },
      { userId: "user-b", id: "n-2" },
    ]);
  });

  it("returns empty rows for an empty batch without touching the database", async () => {
    const insert = vi.fn();
    const findExisting = vi.fn();

    const result = await runIdempotentInsertMany({
      expectedKeys: [],
      keyOf: (row: { userId: string }) => row.userId,
      insert,
      findExisting,
    });

    expect(result).toEqual({ rows: [], created: false });
    expect(insert).not.toHaveBeenCalled();
    expect(findExisting).not.toHaveBeenCalled();
  });

  it("rethrows non-unique errors", async () => {
    const error = new Error("database unavailable");

    await expect(
      runIdempotentInsertMany({
        expectedKeys: ["user-a"],
        keyOf: (row: { userId: string }) => row.userId,
        insert: vi.fn().mockRejectedValue(error),
        findExisting: vi.fn(),
      }),
    ).rejects.toBe(error);
  });
});
