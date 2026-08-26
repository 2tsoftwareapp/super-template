import { describe, expect, it, vi } from "vitest";

import { ERROR_CODES } from "@repo/api-runtime";

import { VerifyMfaChallengeUseCase } from "../verify-mfa-challenge.use-case";

describe("VerifyMfaChallengeUseCase", () => {
  it("rejects an unknown or expired challenge", async () => {
    const mfaRepository = {
      findValidChallengeByTokenHash: vi.fn(async () => null),
    };
    const useCase = new VerifyMfaChallengeUseCase(
      mfaRepository as never,
      { verifyCode: vi.fn() } as never,
      { log: vi.fn() } as never,
    );

    await expect(
      useCase.execute({
        mfaToken: "bad-token",
        code: "000000",
        metadata: { ipAddress: null, userAgent: null },
      }),
    ).rejects.toMatchObject({ code: ERROR_CODES.MFA_CHALLENGE_INVALID });
  });

  it("rejects once max attempts are exceeded", async () => {
    const mfaRepository = {
      findValidChallengeByTokenHash: vi.fn(async () => ({
        id: "c1",
        userId: "u1",
        attempts: 5,
      })),
    };
    const useCase = new VerifyMfaChallengeUseCase(
      mfaRepository as never,
      { verifyCode: vi.fn() } as never,
      { log: vi.fn() } as never,
    );

    await expect(
      useCase.execute({
        mfaToken: "token",
        code: "000000",
        metadata: { ipAddress: null, userAgent: null },
      }),
    ).rejects.toMatchObject({ code: ERROR_CODES.MFA_TOO_MANY_ATTEMPTS });
  });

  it("increments attempts and rejects an invalid code", async () => {
    const mfaRepository = {
      findValidChallengeByTokenHash: vi.fn(async () => ({
        id: "c1",
        userId: "u1",
        attempts: 0,
      })),
      incrementChallengeAttempts: vi.fn(async () => undefined),
    };
    const auditWriter = { log: vi.fn(async () => undefined) };
    const useCase = new VerifyMfaChallengeUseCase(
      mfaRepository as never,
      { verifyCode: vi.fn(async () => false) } as never,
      auditWriter as never,
    );

    await expect(
      useCase.execute({
        mfaToken: "token",
        code: "000000",
        metadata: { ipAddress: null, userAgent: null },
      }),
    ).rejects.toMatchObject({ code: ERROR_CODES.MFA_INVALID_CODE });

    expect(mfaRepository.incrementChallengeAttempts).toHaveBeenCalledWith("c1");
    expect(auditWriter.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: "mfa.challenge.failed" }),
    );
  });

  it("consumes the challenge and returns the user id on success", async () => {
    const mfaRepository = {
      findValidChallengeByTokenHash: vi.fn(async () => ({
        id: "c1",
        userId: "u1",
        attempts: 0,
      })),
      consumeChallenge: vi.fn(async () => true),
    };
    const auditWriter = { log: vi.fn(async () => undefined) };
    const useCase = new VerifyMfaChallengeUseCase(
      mfaRepository as never,
      { verifyCode: vi.fn(async () => true) } as never,
      auditWriter as never,
    );

    const result = await useCase.execute({
      mfaToken: "token",
      code: "123456",
      metadata: { ipAddress: null, userAgent: null },
    });

    expect(result).toEqual({ userId: "u1" });
    expect(mfaRepository.consumeChallenge).toHaveBeenCalledWith("c1");
    expect(auditWriter.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: "mfa.challenge.succeeded" }),
    );
  });

  it("rejects a challenge a concurrent request already consumed (no double login)", async () => {
    const mfaRepository = {
      findValidChallengeByTokenHash: vi.fn(async () => ({
        id: "c1",
        userId: "u1",
        attempts: 0,
      })),
      consumeChallenge: vi.fn(async () => false),
    };
    const auditWriter = { log: vi.fn(async () => undefined) };
    const useCase = new VerifyMfaChallengeUseCase(
      mfaRepository as never,
      { verifyCode: vi.fn(async () => true) } as never,
      auditWriter as never,
    );

    // The CAS consume lost the race: the same mfaToken + code was already
    // used by another request, so this one must NOT authenticate.
    await expect(
      useCase.execute({
        mfaToken: "token",
        code: "123456",
        metadata: { ipAddress: null, userAgent: null },
      }),
    ).rejects.toMatchObject({ code: ERROR_CODES.MFA_CHALLENGE_INVALID });

    expect(auditWriter.log).not.toHaveBeenCalled();
  });
});
