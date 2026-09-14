import { TenantContextService } from "@repo/api-kernel";
import { describe, expect, it, vi } from "vitest";

import { OutboxRepository } from "../outbox.repository";

const ORG_A = "11111111-1111-4111-8111-111111111111";

function createInsertExecutor() {
  const values = vi.fn(async () => undefined);
  const insert = vi.fn(() => ({ values }));

  return { client: { insert }, values };
}

const tenantContext = new TenantContextService();

describe("OutboxRepository tenant attribution", () => {
  it("stamps the publisher's tenant on appended events", async () => {
    const executor = createInsertExecutor();
    const repository = new OutboxRepository(executor.client as never);

    await tenantContext.runAsync({ tenantId: ORG_A, userId: "user-1" }, () =>
      repository.append("user.lifecycle.deleted", { userId: "user-1" }),
    );

    expect(executor.values).toHaveBeenCalledWith({
      topic: "user.lifecycle.deleted",
      payload: { userId: "user-1" },
      organizationId: ORG_A,
    });
  });

  it("appends platform-scope events when no tenant context is active", async () => {
    const executor = createInsertExecutor();
    const repository = new OutboxRepository(executor.client as never);

    await repository.append("auth.send-verification-email", { email: "user@example.local" });

    expect(executor.values).toHaveBeenCalledWith({
      topic: "auth.send-verification-email",
      payload: { email: "user@example.local" },
      organizationId: null,
    });
  });
});
