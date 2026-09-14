import type { TenantContext } from "@repo/api-kernel";

import { getTenantContext, TenantContextService } from "@repo/api-kernel";
import { describe, expect, it, vi } from "vitest";

import { OutboxDispatcher } from "./outbox-dispatcher.service";

const ORG_A = "11111111-1111-4111-8111-111111111111";

const logger = { debug: vi.fn(), error: vi.fn(), log: vi.fn(), verbose: vi.fn(), warn: vi.fn() };

const createDispatcher = (repository: unknown, registry: unknown) =>
  new OutboxDispatcher(
    logger as never,
    repository as never,
    registry as never,
    new TenantContextService(),
  );

const message = (id: string, organizationId: string | null, topic: string) => ({
  id,
  organizationId,
  topic,
  payload: {},
  status: "PROCESSING",
  attempts: 1,
  maxAttempts: 5,
});

describe("OutboxDispatcher tenant context", () => {
  it("sweeps under worker bypass, then runs each handler under its own tenant", async () => {
    const sweep: Array<{ phase: string; context: TenantContext | undefined }> = [];
    const handlerContexts = new Map<string, TenantContext | undefined>();
    const repository = {
      recoverStaleProcessing: vi.fn(async () => {
        sweep.push({ phase: "recover", context: getTenantContext() });
      }),
      claimPending: vi.fn(async () => {
        sweep.push({ phase: "claim", context: getTenantContext() });
        return [
          message("m-tenant", ORG_A, "auth.send-verification-email"),
          message("m-platform", null, "user.lifecycle.created"),
        ];
      }),
      markSent: vi.fn(async (id: string) => {
        sweep.push({ phase: `sent:${id}`, context: getTenantContext() });
      }),
      markFailed: vi.fn(async () => undefined),
    };
    const registry = {
      getAll: () => [
        {
          topic: "auth.send-verification-email",
          handle: async (claimed: { id: string }) => {
            handlerContexts.set(claimed.id, getTenantContext());
          },
        },
        {
          topic: "user.lifecycle.created",
          handle: async (claimed: { id: string }) => {
            handlerContexts.set(claimed.id, getTenantContext());
          },
        },
      ],
    };

    await createDispatcher(repository, registry).processPendingMessages();

    // Claim + stale recovery see every tenant's rows.
    for (const phase of ["recover", "claim"]) {
      expect(sweep.find((entry) => entry.phase === phase)?.context).toEqual({
        tenantId: "",
        userId: "",
        bypassRls: true,
      });
    }

    // Handlers and their follow-up status writes are attributed to the message tenant.
    expect(handlerContexts.get("m-tenant")).toEqual({
      tenantId: ORG_A,
      userId: "",
      bypassRls: false,
    });
    expect(sweep.find((entry) => entry.phase === "sent:m-tenant")?.context).toEqual({
      tenantId: ORG_A,
      userId: "",
      bypassRls: false,
    });

    // Platform-scope messages stay non-bypass so they cannot reach tenant rows.
    expect(handlerContexts.get("m-platform")).toEqual({
      tenantId: "",
      userId: "",
      bypassRls: false,
    });
    expect(sweep.find((entry) => entry.phase === "sent:m-platform")?.context).toEqual({
      tenantId: "",
      userId: "",
      bypassRls: false,
    });
  });
});
