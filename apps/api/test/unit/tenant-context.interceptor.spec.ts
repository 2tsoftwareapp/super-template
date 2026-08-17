import type { CallHandler, ExecutionContext } from "@nestjs/common";
import type { Reflector } from "@nestjs/core";
import type { TenantContextService } from "@repo/api-core";

import { lastValueFrom, of } from "rxjs";
import { describe, expect, it, vi } from "vitest";

import { TenantContextInterceptor } from "../../src/shell/tenant-context.interceptor";

interface RequestStub {
  user?: {
    userId: string;
    roles: string[];
    organizationId: string | null;
  };
}

function createContext(request: RequestStub): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

function createInterceptor(options: { isPublic: boolean }) {
  const reflector = {
    getAllAndOverride: vi.fn().mockReturnValue(options.isPublic),
  } as unknown as Reflector;
  const run = vi.fn((_context: unknown, callback: () => void) => {
    callback();
  });
  const tenantContextService = {
    run,
  } as unknown as TenantContextService;

  return {
    interceptor: new TenantContextInterceptor(reflector, tenantContextService),
    run,
  };
}

const nextHandler: CallHandler = { handle: () => of("payload") };

describe("TenantContextInterceptor", () => {
  it("skips tenant scoping for public routes", async () => {
    const { interceptor, run } = createInterceptor({ isPublic: true });

    const result = await lastValueFrom(interceptor.intercept(createContext({}), nextHandler));

    expect(result).toBe("payload");
    expect(run).not.toHaveBeenCalled();
  });

  it("skips tenant scoping when the user has no organization", async () => {
    const { interceptor, run } = createInterceptor({ isPublic: false });
    const request: RequestStub = {
      user: { userId: "u1", roles: ["USER"], organizationId: null },
    };

    const result = await lastValueFrom(interceptor.intercept(createContext(request), nextHandler));

    expect(result).toBe("payload");
    expect(run).not.toHaveBeenCalled();
  });

  it("runs the handler inside the tenant context for org users", async () => {
    const { interceptor, run } = createInterceptor({ isPublic: false });
    const request: RequestStub = {
      user: { userId: "u1", roles: ["ADMIN"], organizationId: "org-1" },
    };

    const result = await lastValueFrom(interceptor.intercept(createContext(request), nextHandler));

    expect(result).toBe("payload");
    expect(run).toHaveBeenCalledWith(
      { tenantId: "org-1", userId: "u1", bypassRls: false },
      expect.any(Function),
    );
  });

  it("grants RLS bypass only to SUPER_ADMIN", async () => {
    const { interceptor, run } = createInterceptor({ isPublic: false });
    const request: RequestStub = {
      user: {
        userId: "root",
        roles: ["SUPER_ADMIN"],
        organizationId: "org-1",
      },
    };

    await lastValueFrom(interceptor.intercept(createContext(request), nextHandler));

    expect(run).toHaveBeenCalledWith(
      expect.objectContaining({ bypassRls: true }),
      expect.any(Function),
    );
  });
});
