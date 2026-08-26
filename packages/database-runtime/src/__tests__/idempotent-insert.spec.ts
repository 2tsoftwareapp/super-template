import { describe, expect, it, vi } from "vitest";

import { runIdempotentInsert } from "../idempotent-insert";

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
