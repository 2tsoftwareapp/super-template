import { describe, expect, it, vi } from "vitest";

import { runInTransaction } from "../transaction";

describe("runInTransaction", () => {
  it("delegates work to the database transaction callback", async () => {
    const transaction = { id: "tx-1" };
    const operation = vi.fn().mockResolvedValue("ok");
    const database = {
      transaction: vi.fn((callback: (value: unknown) => Promise<unknown>) => callback(transaction)),
    };

    await expect(runInTransaction(database as never, operation as never)).resolves.toBe("ok");

    expect(operation).toHaveBeenCalledWith(transaction);
  });
});
