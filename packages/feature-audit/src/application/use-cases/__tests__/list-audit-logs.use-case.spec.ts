import type { AuthenticatedRequestUser } from "@repo/api-kernel";

import { PLATFORM_ROLE_NAMES } from "@repo/api-kernel";
import { describe, expect, it, vi } from "vitest";

import { AuditMapper } from "../../audit.mapper";
import { ListAuditLogsUseCase } from "../list-audit-logs.use-case";

const actor = (overrides: Partial<AuthenticatedRequestUser> = {}): AuthenticatedRequestUser => ({
  userId: "user-1",
  sessionId: "session-1",
  email: "user@test.com",
  displayName: "User",
  status: "ACTIVE",
  roles: ["USER"],
  permissions: [],
  organizationId: "org-1",
  ...overrides,
});

const query = { page: 1, limit: 20, sortOrder: "desc" as const };

const buildUseCase = () => {
  const auditRepository = {
    list: vi.fn(async () => ({ rows: [], total: 0 })),
  };
  const useCase = new ListAuditLogsUseCase(auditRepository as never, new AuditMapper());

  return { useCase, auditRepository };
};

describe("ListAuditLogsUseCase", () => {
  it("forbids a non-super actor without an organization", async () => {
    const { useCase, auditRepository } = buildUseCase();

    await expect(
      useCase.execute(actor({ roles: ["ADMIN"], organizationId: null }), query),
    ).rejects.toMatchObject({ code: "AUTH_FORBIDDEN", statusCode: 403 });
    expect(auditRepository.list).not.toHaveBeenCalled();
  });

  it("scopes a non-super actor to their organization", async () => {
    const { useCase, auditRepository } = buildUseCase();

    await useCase.execute(actor({ roles: ["ADMIN"], organizationId: "org-1" }), query);

    expect(auditRepository.list).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: "org-1" }),
    );
  });

  it("does not scope SUPER_ADMIN, even without an organization", async () => {
    const { useCase, auditRepository } = buildUseCase();

    await useCase.execute(
      actor({ roles: [PLATFORM_ROLE_NAMES.SUPER_ADMIN], organizationId: null }),
      query,
    );

    expect(auditRepository.list).toHaveBeenCalledWith(
      expect.not.objectContaining({ organizationId: expect.anything() }),
    );
  });
});
