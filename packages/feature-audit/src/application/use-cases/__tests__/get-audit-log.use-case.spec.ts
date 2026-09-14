import type { AuthenticatedRequestUser } from "@repo/api-kernel";

import { describe, expect, it, vi } from "vitest";

import type { AuditLogRecord } from "../../ports/audit.repository.port";

import { AuditMapper } from "../../audit.mapper";
import { AUDIT_ERROR_CODES } from "../../../public/error-codes";
import { GetAuditLogUseCase } from "../get-audit-log.use-case";

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

const auditRow = (overrides: Partial<AuditLogRecord> = {}): AuditLogRecord => ({
  id: "log-1",
  organizationId: "org-1",
  actorId: "user-1",
  action: "user.updated",
  entityType: "user",
  entityId: "user-1",
  metadata: null,
  ipAddress: null,
  userAgent: null,
  requestId: null,
  createdAt: new Date("2026-01-02T03:04:05.000Z"),
  ...overrides,
});

const buildUseCase = (findById: (id: string) => Promise<AuditLogRecord | null>) => {
  const auditRepository = { findById: vi.fn(findById) };
  const useCase = new GetAuditLogUseCase(auditRepository as never, new AuditMapper());

  return { useCase, auditRepository };
};

describe("GetAuditLogUseCase", () => {
  it("forbids a non-super actor without an organization before reading any row", async () => {
    const { useCase, auditRepository } = buildUseCase(async () => auditRow());

    await expect(
      useCase.execute(actor({ roles: ["ADMIN"], organizationId: null }), "log-1"),
    ).rejects.toMatchObject({ code: "AUTH_FORBIDDEN", statusCode: 403 });
    expect(auditRepository.findById).not.toHaveBeenCalled();
  });

  it("lets SUPER_ADMIN without an organization read a platform-scoped row", async () => {
    const { useCase } = buildUseCase(async () => auditRow({ organizationId: null }));

    await expect(
      useCase.execute(actor({ roles: ["SUPER_ADMIN"], organizationId: null }), "log-1"),
    ).resolves.toMatchObject({ id: "log-1", organizationId: null });
  });

  it("lets an organization actor read their own organization's row", async () => {
    const { useCase } = buildUseCase(async () => auditRow({ organizationId: "org-1" }));

    await expect(useCase.execute(actor({ organizationId: "org-1" }), "log-1")).resolves.toMatchObject(
      { id: "log-1", organizationId: "org-1" },
    );
  });

  it("hides another organization's row behind NOT_FOUND", async () => {
    const { useCase } = buildUseCase(async () => auditRow({ organizationId: "org-2" }));

    await expect(useCase.execute(actor({ organizationId: "org-1" }), "log-1")).rejects.toMatchObject({
      code: AUDIT_ERROR_CODES.AUDIT_LOG_NOT_FOUND,
      statusCode: 404,
    });
  });

  it("hides platform-scoped rows from organization actors", async () => {
    const { useCase } = buildUseCase(async () => auditRow({ organizationId: null }));

    await expect(useCase.execute(actor({ organizationId: "org-1" }), "log-1")).rejects.toMatchObject({
      code: AUDIT_ERROR_CODES.AUDIT_LOG_NOT_FOUND,
      statusCode: 404,
    });
  });

  it("reports a missing row as NOT_FOUND", async () => {
    const { useCase } = buildUseCase(async () => null);

    await expect(useCase.execute(actor(), "log-1")).rejects.toMatchObject({
      code: AUDIT_ERROR_CODES.AUDIT_LOG_NOT_FOUND,
      statusCode: 404,
    });
  });
});
