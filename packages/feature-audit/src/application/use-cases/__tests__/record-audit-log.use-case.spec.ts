import { SYSTEM_SCOPE } from "@repo/api-kernel";
import { describe, expect, it, vi } from "vitest";

import type { AuditLogRecord, CreateAuditLogInput } from "../../ports/audit.repository.port";

import { RecordAuditLogUseCase } from "../record-audit-log.use-case";

/**
 * Marker written by `redactSensitive` (`@repo/api-kernel/src/utils/redact.ts`).
 * Pinned literally so a change to the marker is a visible test failure rather
 * than something the expectation follows silently.
 */
const REDACTED = "[REDACTED]";

const requestContext = {
  requestId: "req-1",
  ipAddress: "203.0.113.10",
  userAgent: "vitest-agent",
};

const platformTx = { id: "platform-tx" };

function buildUseCase() {
  const auditRepository = {
    create: vi.fn(
      async (values: CreateAuditLogInput, executor?: unknown): Promise<AuditLogRecord> => ({
        id: "log-1",
        organizationId: values.scope === SYSTEM_SCOPE.ORGANIZATION ? values.organizationId : null,
        actorId: values.actorId,
        action: values.action,
        entityType: values.entityType,
        entityId: values.entityId,
        metadata: values.metadata ?? null,
        ipAddress: values.ipAddress,
        userAgent: values.userAgent,
        requestId: values.requestId,
        createdAt: new Date("2026-01-02T03:04:05.000Z"),
      }),
    ),
  };
  const platformTransactionPort = {
    run: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(platformTx)),
  };

  return {
    auditRepository,
    platformTransactionPort,
    useCase: new RecordAuditLogUseCase(auditRepository as never, platformTransactionPort as never),
  };
}

/** Metadata of the single row the use case is expected to have written. */
function writtenMetadata(auditRepository: { create: { mock: { calls: unknown[][] } } }) {
  expect(auditRepository.create).toHaveBeenCalledTimes(1);

  return (auditRepository.create.mock.calls[0]![0] as CreateAuditLogInput).metadata;
}

describe("RecordAuditLogUseCase", () => {
  describe("scope selection", () => {
    it("writes a platform row inside a platform transaction when no executor is given", async () => {
      const { useCase, auditRepository, platformTransactionPort } = buildUseCase();

      await useCase.execute({
        actorId: "user-1",
        action: "user.updated",
        entityType: "user",
        entityId: "user-1",
        scope: SYSTEM_SCOPE.PLATFORM,
        requestContext,
      });

      expect(platformTransactionPort.run).toHaveBeenCalledTimes(1);

      const [payload, executor] = auditRepository.create.mock.calls[0]!;

      expect(executor).toBe(platformTx);
      expect(payload).toEqual({
        actorId: "user-1",
        action: "user.updated",
        entityType: "user",
        entityId: "user-1",
        metadata: null,
        ipAddress: requestContext.ipAddress,
        userAgent: requestContext.userAgent,
        requestId: requestContext.requestId,
        scope: SYSTEM_SCOPE.PLATFORM,
      });
      // A platform row must not carry a tenant column value.
      expect(payload).not.toHaveProperty("organizationId");
    });

    it("writes an organization row with the tenant id and no platform transaction", async () => {
      const { useCase, auditRepository, platformTransactionPort } = buildUseCase();

      await useCase.execute({
        actorId: "user-1",
        action: "organization.update",
        entityType: "organization",
        entityId: "org-1",
        scope: SYSTEM_SCOPE.ORGANIZATION,
        organizationId: "org-1",
      });

      expect(platformTransactionPort.run).not.toHaveBeenCalled();

      const [payload] = auditRepository.create.mock.calls[0]!;

      expect(payload).toEqual({
        actorId: "user-1",
        action: "organization.update",
        entityType: "organization",
        entityId: "org-1",
        metadata: null,
        ipAddress: null,
        userAgent: null,
        requestId: null,
        scope: SYSTEM_SCOPE.ORGANIZATION,
        organizationId: "org-1",
      });
    });

    it("reuses the caller executor for an organization row", async () => {
      const { useCase, auditRepository, platformTransactionPort } = buildUseCase();
      const callerTx = { id: "caller-tx" };

      await useCase.execute(
        {
          action: "organization.update",
          entityType: "organization",
          scope: SYSTEM_SCOPE.ORGANIZATION,
          organizationId: "org-1",
        },
        callerTx as never,
      );

      expect(platformTransactionPort.run).not.toHaveBeenCalled();

      const [payload, executor] = auditRepository.create.mock.calls[0]!;

      expect(executor).toBe(callerTx);
      expect(payload).toMatchObject({ actorId: null, entityId: null });
    });

    it("reuses the caller executor instead of a platform transaction for a platform row", async () => {
      const { useCase, auditRepository, platformTransactionPort } = buildUseCase();
      const callerTx = { id: "caller-tx" };

      await useCase.execute(
        {
          actorId: "user-1",
          action: "user.updated",
          entityType: "user",
          scope: SYSTEM_SCOPE.PLATFORM,
        },
        callerTx as never,
      );

      expect(platformTransactionPort.run).not.toHaveBeenCalled();

      const [payload, executor] = auditRepository.create.mock.calls[0]!;

      expect(executor).toBe(callerTx);
      expect(payload).toMatchObject({ scope: SYSTEM_SCOPE.PLATFORM });
    });

    it("returns the created row to the caller", async () => {
      const { useCase } = buildUseCase();

      await expect(
        useCase.execute({
          actorId: "user-1",
          action: "user.updated",
          entityType: "user",
          entityId: "user-1",
          scope: SYSTEM_SCOPE.PLATFORM,
        }),
      ).resolves.toMatchObject({
        id: "log-1",
        actorId: "user-1",
        action: "user.updated",
        entityType: "user",
        entityId: "user-1",
        metadata: null,
        organizationId: null,
      });
    });
  });

  describe("metadata redaction", () => {
    it("redacts every sensitive key before the row reaches the repository", async () => {
      const { useCase, auditRepository } = buildUseCase();

      await useCase.execute({
        action: "user.updated",
        entityType: "user",
        scope: SYSTEM_SCOPE.PLATFORM,
        metadata: {
          email: "user@example.com",
          password: "p4ssw0rd",
          passwordHash: "$argon2id$v=19",
          newPassword: "next",
          oldPassword: "prev",
          passwordConfirmation: "next",
          token: "tok",
          accessToken: "at",
          refreshToken: "rt",
          resetToken: "reset",
          verificationToken: "verify",
          apiKey: "key",
          clientSecret: "cs",
          privateKey: "pk",
          secretAccessKey: "sak",
          secretKey: "sk",
          secret: "s",
          otp: "123456",
          otpSecret: "base32",
          recoveryCodes: ["a", "b"],
          recoveryCode: "c",
          mfaSecret: "mfa",
          mfaStatus: "ENABLED",
          authorization: "Bearer abc",
          cookie: "session=1",
          cookies: "session=2",
        },
      });

      expect(writtenMetadata(auditRepository)).toEqual({
        email: "user@example.com",
        password: REDACTED,
        passwordHash: REDACTED,
        newPassword: REDACTED,
        oldPassword: REDACTED,
        passwordConfirmation: REDACTED,
        token: REDACTED,
        accessToken: REDACTED,
        refreshToken: REDACTED,
        resetToken: REDACTED,
        verificationToken: REDACTED,
        apiKey: REDACTED,
        clientSecret: REDACTED,
        privateKey: REDACTED,
        secretAccessKey: REDACTED,
        secretKey: REDACTED,
        secret: REDACTED,
        otp: REDACTED,
        otpSecret: REDACTED,
        recoveryCodes: REDACTED,
        recoveryCode: REDACTED,
        mfaSecret: REDACTED,
        mfaStatus: REDACTED,
        authorization: REDACTED,
        cookie: REDACTED,
        cookies: REDACTED,
      });
    });

    it("matches sensitive keys regardless of case or separators", async () => {
      const { useCase, auditRepository } = buildUseCase();

      await useCase.execute({
        action: "user.updated",
        entityType: "user",
        scope: SYSTEM_SCOPE.PLATFORM,
        metadata: {
          Access_Token: "at",
          "REFRESH-TOKEN": "rt",
          api_key: "key",
          client_secret: "cs",
        },
      });

      expect(writtenMetadata(auditRepository)).toEqual({
        Access_Token: REDACTED,
        "REFRESH-TOKEN": REDACTED,
        api_key: REDACTED,
        client_secret: REDACTED,
      });
    });

    it("leaves non-sensitive metadata untouched", async () => {
      const { useCase, auditRepository } = buildUseCase();

      await useCase.execute({
        action: "user.updated",
        entityType: "user",
        scope: SYSTEM_SCOPE.PLATFORM,
        metadata: {
          userId: "user-1",
          emailVerified: true,
          sessionId: "session-1",
          attemptCount: 3,
          note: null,
        },
      });

      expect(writtenMetadata(auditRepository)).toEqual({
        userId: "user-1",
        emailVerified: true,
        sessionId: "session-1",
        attemptCount: 3,
        note: null,
      });
    });

    it("redacts sensitive keys nested inside objects and arrays", async () => {
      const { useCase, auditRepository } = buildUseCase();

      await useCase.execute({
        action: "user.updated",
        entityType: "user",
        scope: SYSTEM_SCOPE.PLATFORM,
        metadata: {
          profile: { displayName: "User", password: "p" },
          credentials: [{ token: "t", label: "primary" }],
          labels: ["a", "b"],
        },
      });

      expect(writtenMetadata(auditRepository)).toEqual({
        profile: { displayName: "User", password: REDACTED },
        credentials: [{ token: REDACTED, label: "primary" }],
        labels: ["a", "b"],
      });
    });

    it("stores an empty metadata object as an empty object", async () => {
      const { useCase, auditRepository } = buildUseCase();

      await useCase.execute({
        action: "user.updated",
        entityType: "user",
        scope: SYSTEM_SCOPE.PLATFORM,
        metadata: {},
      });

      expect(writtenMetadata(auditRepository)).toEqual({});
    });

    it("stores null metadata when none is provided", async () => {
      const { useCase, auditRepository } = buildUseCase();

      await useCase.execute({
        action: "user.updated",
        entityType: "user",
        scope: SYSTEM_SCOPE.PLATFORM,
      });

      expect(writtenMetadata(auditRepository)).toBeNull();
    });

    it("drops metadata that is not a JSON object after redaction", async () => {
      const { useCase, auditRepository } = buildUseCase();

      await useCase.execute({
        action: "user.updated",
        entityType: "user",
        scope: SYSTEM_SCOPE.PLATFORM,
        // Runtime-only shape: an array is not a JsonObject, so the guard keeps
        // the column null instead of persisting a non-object payload.
        metadata: [{ token: "t" }] as never,
      });

      expect(writtenMetadata(auditRepository)).toBeNull();
    });
  });
});
