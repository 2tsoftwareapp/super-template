import "reflect-metadata";

import { describe, expect, it, vi } from "vitest";

import { SESSION_ISSUER } from "../../public/session-issuer.port";
import { AuthModule } from "../../auth.module";
import type { IssueSessionUseCase } from "../use-cases/issue-session.use-case";
import { SessionIssuerAdapter } from "../session-issuer.adapter";

const user = {
  id: "user-1",
  email: "user@example.com",
  displayName: "User",
  avatarUrl: null,
  status: "ACTIVE",
  emailVerifiedAt: new Date("2026-01-01T00:00:00Z"),
  mustChangePassword: false,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

describe("SessionIssuerAdapter", () => {
  it("delegates to IssueSessionUseCase and returns its result", async () => {
    const result = {
      accessToken: "access",
      refreshToken: "refresh",
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: null,
        status: user.status,
        emailVerifiedAt: "2026-01-01T00:00:00.000Z",
        mustChangePassword: false,
        roles: ["USER"],
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      },
      permissions: ["notifications:read"],
      organizationId: null,
      mustChangePassword: false,
      session: { id: "session-1" },
    } as never;
    const issueSessionUseCase = {
      execute: vi.fn(async () => result),
    } as unknown as IssueSessionUseCase;
    const adapter = new SessionIssuerAdapter(issueSessionUseCase);

    const issued = await adapter.issue(user);

    expect(issueSessionUseCase.execute).toHaveBeenCalledWith(user, undefined, undefined);
    expect(issued).toBe(result);
  });

  it("passes the request context and options through", async () => {
    const requestContext = { ipAddress: "127.0.0.1", userAgent: "vitest" };
    const issueSessionUseCase = {
      execute: vi.fn(async () => ({})),
    } as unknown as IssueSessionUseCase;
    const adapter = new SessionIssuerAdapter(issueSessionUseCase);

    await adapter.issue(user, requestContext as never, { mustChangePassword: true });

    expect(issueSessionUseCase.execute).toHaveBeenCalledWith(user, requestContext, {
      mustChangePassword: true,
    });
  });
});

describe("SESSION_ISSUER binding", () => {
  it("is exported by AuthModule and backed by SessionIssuerAdapter", () => {
    const providers = (Reflect.getMetadata("providers", AuthModule) as Array<unknown>) ?? [];
    const exported = (Reflect.getMetadata("exports", AuthModule) as Array<unknown>) ?? [];

    expect(exported).toContain(SESSION_ISSUER);
    const binding = providers
      .filter(
        (provider): provider is { provide: unknown; useExisting: unknown } =>
          typeof provider === "object" && provider !== null && "provide" in provider,
      )
      .find((provider) => provider.provide === SESSION_ISSUER);

    // useExisting keeps a single implementation: the adapter projecting
    // IssueSessionUseCase (ADR 0004 invariant 1).
    expect(binding).toBeDefined();
    expect(binding?.useExisting).toBe(SessionIssuerAdapter);
  });
});
