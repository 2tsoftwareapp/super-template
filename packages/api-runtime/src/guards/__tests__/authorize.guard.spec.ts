import type { ExecutionContext } from "@nestjs/common";

import { Reflector } from "@nestjs/core";
import { describe, expect, it, vi } from "vitest";

import { AppError, PLATFORM_ROLE_NAMES } from "@repo/api-kernel";

import { AuthorizeGuard } from "../authorize.guard";

function makeContext(options: {
  isPublic?: boolean;
  authorize?: { roles?: string[]; permissions?: string[] };
  user?: { roles: string[]; permissions: string[] };
}) {
  const reflector = {
    getAllAndOverride: vi.fn((key: string) => {
      if (key === "isPublic") return options.isPublic ?? false;
      if (key === "authorize") return options.authorize;
      return undefined;
    }),
  } as unknown as Reflector;

  const context = {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user: options.user }),
    }),
  } as unknown as ExecutionContext;

  return { reflector, context };
}

describe("AuthorizeGuard", () => {
  it("allows public routes without checking authorization", () => {
    const { reflector, context } = makeContext({ isPublic: true });
    const guard = new AuthorizeGuard(reflector);

    expect(guard.canActivate(context)).toBe(true);
  });

  it("allows authenticated-only routes when no @Authorize metadata is present", () => {
    const { reflector, context } = makeContext({
      user: { roles: [], permissions: [] },
    });
    const guard = new AuthorizeGuard(reflector);

    expect(guard.canActivate(context)).toBe(true);
  });

  it("throws when no user is present on the request", () => {
    const { reflector, context } = makeContext({
      authorize: { permissions: ["users.read"] },
    });
    const guard = new AuthorizeGuard(reflector);

    expect(() => guard.canActivate(context)).toThrow(AppError);
  });

  it("allows when user has at least one required role", () => {
    const { reflector, context } = makeContext({
      authorize: { roles: ["ADMIN", PLATFORM_ROLE_NAMES.SUPER_ADMIN] },
      user: { roles: ["ADMIN"], permissions: [] },
    });
    const guard = new AuthorizeGuard(reflector);

    expect(guard.canActivate(context)).toBe(true);
  });

  it("blocks when user has none of the required roles", () => {
    const { reflector, context } = makeContext({
      authorize: { roles: [PLATFORM_ROLE_NAMES.SUPER_ADMIN] },
      user: { roles: ["USER"], permissions: [] },
    });
    const guard = new AuthorizeGuard(reflector);

    expect(() => guard.canActivate(context)).toThrow(AppError);
  });

  it("allows super admin to bypass role and permission checks", () => {
    const { reflector, context } = makeContext({
      authorize: { roles: [PLATFORM_ROLE_NAMES.SUPER_ADMIN], permissions: ["users.delete"] },
      user: { roles: [PLATFORM_ROLE_NAMES.SUPER_ADMIN], permissions: [] },
    });
    const guard = new AuthorizeGuard(reflector);

    expect(guard.canActivate(context)).toBe(true);
  });

  it("allows when user has all required permissions", () => {
    const { reflector, context } = makeContext({
      authorize: { permissions: ["users.read", "users.update"] },
      user: { roles: [], permissions: ["users.read", "users.update"] },
    });
    const guard = new AuthorizeGuard(reflector);

    expect(guard.canActivate(context)).toBe(true);
  });

  it("blocks when user is missing one of the required permissions", () => {
    const { reflector, context } = makeContext({
      authorize: { permissions: ["users.read", "users.update"] },
      user: { roles: [], permissions: ["users.read"] },
    });
    const guard = new AuthorizeGuard(reflector);

    expect(() => guard.canActivate(context)).toThrow(AppError);
  });

  it("requires both roles and permissions to pass when both are declared", () => {
    const { reflector, context } = makeContext({
      authorize: { roles: ["ADMIN"], permissions: ["users.delete"] },
      user: { roles: ["ADMIN"], permissions: [] },
    });
    const guard = new AuthorizeGuard(reflector);

    expect(() => guard.canActivate(context)).toThrow(AppError);
  });

  it("allows when both required roles and permissions are satisfied", () => {
    const { reflector, context } = makeContext({
      authorize: { roles: ["ADMIN"], permissions: ["users.delete"] },
      user: { roles: ["ADMIN"], permissions: ["users.delete"] },
    });
    const guard = new AuthorizeGuard(reflector);

    expect(guard.canActivate(context)).toBe(true);
  });
});
