import { describe, expect, it } from "vitest";

import type { TenantContext } from "@repo/api-runtime";

import { getTenantContext, TenantContextService } from "@repo/api-runtime";

const context: TenantContext = {
  tenantId: "org-1",
  userId: "user-1",
  bypassRls: false,
};

describe("TenantContextService", () => {
  it("exposes the context only inside a run scope", () => {
    const service = new TenantContextService();

    expect(service.get()).toBeUndefined();
    expect(service.getTenantId()).toBeUndefined();

    const seen = service.run(context, () => {
      expect(service.get()).toEqual(context);
      expect(service.getTenantId()).toBe("org-1");
      // The module-level accessor reads the same AsyncLocalStorage.
      expect(getTenantContext()).toEqual(context);
      return "result";
    });

    expect(seen).toBe("result");
    expect(service.get()).toBeUndefined();
  });

  it("propagates context across an async run scope", async () => {
    const service = new TenantContextService();

    await service.runAsync(context, async () => {
      await Promise.resolve();
      expect(service.getTenantId()).toBe("org-1");
    });

    expect(service.getTenantId()).toBeUndefined();
  });
});
