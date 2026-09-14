import { of, lastValueFrom } from "rxjs";
import { describe, expect, it, vi } from "vitest";

import type { CallHandler, ExecutionContext } from "@nestjs/common";

import { getTenantContext, TenantContextService } from "@repo/api-kernel";
import { IS_PUBLIC_KEY } from "@repo/api-runtime";

import { ROLE_NAMES } from "../public/role.constants";
import { TenantContextInterceptor } from "../tenant-context.interceptor";

/**
 * The interceptor is testable without a Nest container: it only needs
 * `Reflector.getAllAndOverride`, a context exposing `getHandler`/`getClass`/
 * `switchToHttp().getRequest()`, and a `CallHandler`. The tenant context is the
 * real AsyncLocalStorage-backed service, so the assertion is about what the
 * handler would actually observe.
 */
function build(options: { isPublic?: boolean; user?: unknown; result?: string } = {}) {
  const { isPublic = false, user, result = "handler-result" } = options;

  const request = { user };
  const reflector = {
    getAllAndOverride: vi.fn((key: string) =>
      key === IS_PUBLIC_KEY ? (isPublic ? true : undefined) : undefined,
    ),
  };
  const context = {
    getHandler: vi.fn(() => "handler"),
    getClass: vi.fn(() => "class"),
    switchToHttp: vi.fn(() => ({ getRequest: vi.fn(() => request) })),
  } as unknown as ExecutionContext;

  // The handler reports the tenant context it can see while it runs.
  const observed: ReturnType<typeof getTenantContext>[] = [];
  const next = {
    handle: vi.fn(() => {
      observed.push(getTenantContext());
      return of(result);
    }),
  } as unknown as CallHandler;

  const interceptor = new TenantContextInterceptor(reflector as never, new TenantContextService());

  return { interceptor, context, next, reflector, observed, request };
}

const orgUser = {
  userId: "user-1",
  organizationId: "org-1",
  roles: [ROLE_NAMES.ADMIN],
};

describe("TenantContextInterceptor", () => {
  it("runs the handler inside the caller's tenant context", async () => {
    const { interceptor, context, next, observed } = build({ user: orgUser });

    const value = await lastValueFrom(interceptor.intercept(context, next));

    expect(value).toBe("handler-result");
    expect(observed).toEqual([{ tenantId: "org-1", userId: "user-1", bypassRls: false }]);
    // The context is scoped to the request and must not leak past it.
    expect(getTenantContext()).toBeUndefined();
  });

  it("bypasses RLS for a SUPER_ADMIN and carries their own tenant id", async () => {
    const { interceptor, context, next, observed } = build({
      user: { userId: "root", organizationId: "org-1", roles: [ROLE_NAMES.SUPER_ADMIN] },
    });

    await lastValueFrom(interceptor.intercept(context, next));

    expect(observed[0]).toEqual({ tenantId: "org-1", userId: "root", bypassRls: true });
  });

  it("lets an organization-less SUPER_ADMIN through with an empty tenant and RLS bypass", async () => {
    const { interceptor, context, next, observed } = build({
      user: { userId: "root", organizationId: null, roles: [ROLE_NAMES.SUPER_ADMIN] },
    });

    await lastValueFrom(interceptor.intercept(context, next));

    // Platform-scoped administration reads across tenants, hence bypassRls.
    expect(observed[0]).toEqual({ tenantId: "", userId: "root", bypassRls: true });
  });

  it("does not open a tenant context for a non-super-admin without an organization", async () => {
    const { interceptor, context, next, observed } = build({
      user: { userId: "user-1", organizationId: null, roles: [ROLE_NAMES.USER] },
    });

    await lastValueFrom(interceptor.intercept(context, next));

    expect(observed).toEqual([undefined]);
  });

  it("does not open a tenant context for an unauthenticated request", async () => {
    const { interceptor, context, next, observed } = build({ user: undefined });

    await lastValueFrom(interceptor.intercept(context, next));

    expect(observed).toEqual([undefined]);
  });

  it("honours @Public() without consulting the request", async () => {
    const { interceptor, context, next, observed, reflector } = build({
      isPublic: true,
      user: orgUser,
    });

    await lastValueFrom(interceptor.intercept(context, next));

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, ["handler", "class"]);
    expect(observed).toEqual([undefined]);
    // A public route must not pay for (or depend on) request inspection.
    expect(context.switchToHttp).not.toHaveBeenCalled();
  });

  it("propagates a handler error and still leaves no context behind", async () => {
    const { interceptor, context, observed } = build({ user: orgUser });
    const failure = new Error("handler blew up");
    const next = {
      handle: vi.fn(() => {
        observed.push(getTenantContext());
        throw failure;
      }),
    } as unknown as CallHandler;

    await expect(lastValueFrom(interceptor.intercept(context, next))).rejects.toThrow(
      "handler blew up",
    );
    expect(observed).toEqual([{ tenantId: "org-1", userId: "user-1", bypassRls: false }]);
    expect(getTenantContext()).toBeUndefined();
  });

  it("keeps concurrent requests in their own tenant contexts", async () => {
    const seen: (string | undefined)[] = [];

    const run = async (organizationId: string) => {
      const { interceptor, context } = build({
        user: { userId: `user-${organizationId}`, organizationId, roles: [ROLE_NAMES.USER] },
      });
      // A handler that yields lets the other request interleave.
      const next = {
        handle: () =>
          new ObservableLike(async (emit) => {
            await new Promise((resolve) => setTimeout(resolve, 1));
            seen.push(getTenantContext()?.tenantId);
            emit();
          }),
      } as unknown as CallHandler;

      return lastValueFrom(interceptor.intercept(context, next));
    };

    await Promise.all([run("org-1"), run("org-2")]);

    expect(seen.sort()).toEqual(["org-1", "org-2"]);
  });
});

/** Minimal Observable backed by an async producer, so handlers can await. */
class ObservableLike<T> {
  constructor(private readonly producer: (emit: (value?: T) => void) => Promise<void>) {}

  subscribe(observer: {
    next?: (value: T) => void;
    complete?: () => void;
    error?: (error: unknown) => void;
  }) {
    this.producer((value) => observer.next?.(value as T))
      .then(() => observer.complete?.())
      .catch((error) => observer.error?.(error));

    return { unsubscribe: () => undefined };
  }
}
