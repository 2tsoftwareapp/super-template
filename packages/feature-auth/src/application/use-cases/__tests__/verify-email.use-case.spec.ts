import { describe, expect, it, vi } from "vitest";
import { ERROR_CODES } from "@repo/api-runtime";

import { VerifyEmailUseCase } from "../verify-email.use-case";

function buildDependencies() {
  const transactionPort = {
    run: vi.fn().mockImplementation(async (fn: (tx: unknown) => unknown) => fn(null)),
  };

  const usersRepository = {
    update: vi.fn(async () => ({ id: "user-1", status: "ACTIVE" })),
    findById: vi.fn(async () => ({
      id: "user-1",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
    })),
  };

  const authSessionRepository = {
    findValidEmailVerificationToken: vi.fn(),
    consumeEmailVerificationToken: vi.fn(async () => undefined),
  };

  const auditWriter = { log: vi.fn(async () => undefined) };
  const authMailService = {
    sendVerificationEmail: vi.fn(async () => undefined),
    sendWelcomeEmail: vi.fn(async () => undefined),
  };

  const useCase = new VerifyEmailUseCase(
    transactionPort as never,
    usersRepository as never,
    authSessionRepository as never,
    auditWriter as never,
    authMailService as never,
  );

  return { useCase, authSessionRepository, usersRepository, auditWriter };
}

describe("VerifyEmailUseCase", () => {
  it("rejects an invalid or expired verification token", async () => {
    const { useCase, authSessionRepository } = buildDependencies();
    authSessionRepository.findValidEmailVerificationToken.mockResolvedValueOnce(null);

    await expect(useCase.execute({ token: "bad-token" })).rejects.toMatchObject({
      code: ERROR_CODES.AUTH_UNAUTHORIZED,
    });
  });

  it("activates the user, consumes the token, and audits on success", async () => {
    const { useCase, authSessionRepository, usersRepository, auditWriter } = buildDependencies();
    authSessionRepository.findValidEmailVerificationToken.mockResolvedValueOnce({
      id: "token-1",
      userId: "user-1",
      expiresAt: new Date(),
    });

    await useCase.execute({ token: "valid-token" });

    expect(usersRepository.update).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ status: "ACTIVE" }),
      null,
    );
    expect(auditWriter.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: "auth.email_verified" }),
      null,
    );
  });
});
