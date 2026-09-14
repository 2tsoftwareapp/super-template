import type { AuthenticatedRequestUser } from "@repo/api-kernel";

import { beforeAll, describe, expect, it, vi } from "vitest";

import { hashPassword, SYSTEM_SCOPE, verifyPassword } from "@repo/api-kernel";
import { ROLE_NAMES } from "@repo/feature-access-control/contracts";
import { USER_ERROR_CODES, type UpdateUserInput } from "@repo/feature-users/contracts";

import { ChangePasswordUseCase } from "../change-password.use-case";

const ORG_A = "org-a";
const CURRENT_PASSWORD = "Current-Passw0rd";
const NEW_PASSWORD = "New-Passw0rd";

/**
 * Argon2 hashing is not faked: the use case owns password verification, and a
 * stubbed hash would hide a mismatch between `hashPassword` and
 * `verifyPassword` (different parameters, encoding, etc.).
 */
let storedHash: string;

beforeAll(async () => {
  storedHash = await hashPassword(CURRENT_PASSWORD);
});

const actorRecord = {
  id: "user-1",
  email: "user@example.com",
  passwordHash: "",
  displayName: "User",
  avatarUrl: null,
  avatarFileId: null,
  status: "ACTIVE" as const,
  emailVerifiedAt: null,
  mustChangePassword: true,
  deletedAt: null,
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
};

const actor = (overrides: Partial<AuthenticatedRequestUser> = {}): AuthenticatedRequestUser => ({
  userId: "user-1",
  sessionId: "session-1",
  email: "user@example.com",
  displayName: "User",
  status: "ACTIVE",
  roles: [ROLE_NAMES.USER],
  permissions: [],
  organizationId: ORG_A,
  ...overrides,
});

const requestContext = { requestId: "req-1", ipAddress: "203.0.113.10", userAgent: "vitest" };

function buildUseCase(options: { user?: typeof actorRecord | null } = {}) {
  const user =
    options.user === undefined ? { ...actorRecord, passwordHash: storedHash } : options.user;

  const transaction = { id: "tx-1" };
  const transactionPort = {
    run: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn(transaction)),
  };
  const usersRepository = {
    findById: vi.fn(async () => user),
    update: vi.fn(async (_userId: string, _values: UpdateUserInput) => user),
  };
  const outbox = { append: vi.fn(async () => undefined) };
  const auditWriter = { log: vi.fn(async () => undefined) };

  return {
    transaction,
    transactionPort,
    usersRepository,
    outbox,
    auditWriter,
    useCase: new ChangePasswordUseCase(
      transactionPort as never,
      usersRepository as never,
      outbox as never,
      auditWriter as never,
    ),
  };
}

describe("ChangePasswordUseCase", () => {
  it("stores a hash of the new password and clears the change-password flag", async () => {
    const deps = buildUseCase();

    await deps.useCase.execute(actor(), CURRENT_PASSWORD, NEW_PASSWORD);

    const [, values] = deps.usersRepository.update.mock.calls[0]!;

    expect(values.mustChangePassword).toBe(false);
    expect(values.passwordHash).not.toBe(NEW_PASSWORD);
    await expect(verifyPassword(values.passwordHash!, NEW_PASSWORD)).resolves.toBe(true);
    await expect(verifyPassword(values.passwordHash!, CURRENT_PASSWORD)).resolves.toBe(false);
  });

  it("queues a lifecycle event and audits the change inside one transaction", async () => {
    const deps = buildUseCase();

    await deps.useCase.execute(actor(), CURRENT_PASSWORD, NEW_PASSWORD, requestContext);

    expect(deps.usersRepository.update).toHaveBeenCalledWith(
      "user-1",
      expect.anything(),
      deps.transaction,
    );
    expect(deps.outbox.append).toHaveBeenCalledWith(
      "user.lifecycle.password-changed",
      { userId: "user-1" },
      deps.transaction,
    );
    expect(deps.auditWriter.log).toHaveBeenCalledWith(
      {
        actorId: "user-1",
        action: "user.password.changed",
        entityType: "user",
        entityId: "user-1",
        requestContext,
        scope: SYSTEM_SCOPE.ORGANIZATION,
        organizationId: ORG_A,
      },
      deps.transaction,
    );
  });

  it("audits on the platform scope when the actor has no organization context", async () => {
    const deps = buildUseCase();

    await deps.useCase.execute(actor({ organizationId: null }), CURRENT_PASSWORD, NEW_PASSWORD);

    expect(deps.auditWriter.log).toHaveBeenCalledWith(
      expect.objectContaining({ scope: SYSTEM_SCOPE.PLATFORM }),
      deps.transaction,
    );
  });

  it("rejects a wrong current password without writing anything", async () => {
    const deps = buildUseCase();

    await expect(
      deps.useCase.execute(actor(), "wrong-password", NEW_PASSWORD),
    ).rejects.toMatchObject({
      code: "AUTH_INVALID_CREDENTIALS",
      statusCode: 401,
    });
    expect(deps.transactionPort.run).not.toHaveBeenCalled();
    expect(deps.usersRepository.update).not.toHaveBeenCalled();
    expect(deps.outbox.append).not.toHaveBeenCalled();
    expect(deps.auditWriter.log).not.toHaveBeenCalled();
  });

  it("reports a missing actor row as NOT_FOUND", async () => {
    const deps = buildUseCase({ user: null });

    await expect(
      deps.useCase.execute(actor(), CURRENT_PASSWORD, NEW_PASSWORD),
    ).rejects.toMatchObject({ code: USER_ERROR_CODES.USER_NOT_FOUND, statusCode: 404 });
    expect(deps.usersRepository.update).not.toHaveBeenCalled();
  });
});
