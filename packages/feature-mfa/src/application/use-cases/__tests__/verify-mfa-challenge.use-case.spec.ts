import { MFA_ERROR_CODES } from "@repo/feature-mfa/contracts";

import { describe, expect, it, vi } from "vitest";

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
    ).rejects.toMatchObject({ code: MFA_ERROR_CODES.MFA_CHALLENGE_INVALID });
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
    ).rejects.toMatchObject({ code: MFA_ERROR_CODES.MFA_TOO_MANY_ATTEMPTS });
  });

  it("counts the attempt through the atomic gate and rejects an invalid code", async () => {
    const mfaRepository = {
      findValidChallengeByTokenHash: vi.fn(async () => ({
        id: "c1",
        userId: "u1",
        attempts: 0,
      })),
      tryIncrementChallengeAttempts: vi.fn(async () => ({ id: "c1", attempts: 1 })),
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
    ).rejects.toMatchObject({ code: MFA_ERROR_CODES.MFA_INVALID_CODE });

    // The threshold travels with the increment: the data layer enforces it.
    expect(mfaRepository.tryIncrementChallengeAttempts).toHaveBeenCalledWith("c1", 5);
    expect(auditWriter.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: "mfa.challenge.failed" }),
    );
  });

  it("throttles instead of counting when the atomic gate refuses the attempt", async () => {
    // The gate refused because the counter already reached the limit — e.g. a
    // concurrent request won the last allowed attempt. Nothing was written, so
    // this request must not be reported as a counted failure.
    const mfaRepository = {
      findValidChallengeByTokenHash: vi.fn(async () => ({
        id: "c1",
        userId: "u1",
        attempts: 4,
      })),
      tryIncrementChallengeAttempts: vi.fn(async () => null),
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
    ).rejects.toMatchObject({ code: MFA_ERROR_CODES.MFA_TOO_MANY_ATTEMPTS });

    expect(mfaRepository.tryIncrementChallengeAttempts).toHaveBeenCalledWith("c1", 5);
    expect(auditWriter.log).not.toHaveBeenCalled();
  });

  it("never lets the attempt counter exceed the limit when N requests race", async () => {
    // Emulates the atomic UPDATE ... WHERE attempts < max RETURNING gate over a
    // single stored counter: 8 concurrent wrong codes must count at most 5
    // attempts, and the 3 losers must be throttled rather than counted.
    let attempts = 0;
    const mfaRepository = {
      findValidChallengeByTokenHash: vi.fn(async () => ({
        id: "c1",
        userId: "u1",
        // Read-through snapshot, as PostgreSQL would return it per request.
        attempts,
      })),
      tryIncrementChallengeAttempts: vi.fn(async (_id: string, maxAttempts: number) => {
        if (attempts >= maxAttempts) {
          return null;
        }
        attempts += 1;
        return { id: "c1", attempts };
      }),
    };
    const auditWriter = { log: vi.fn(async () => undefined) };
    const useCase = new VerifyMfaChallengeUseCase(
      mfaRepository as never,
      { verifyCode: vi.fn(async () => false) } as never,
      auditWriter as never,
    );

    const outcomes = await Promise.allSettled(
      Array.from({ length: 8 }, () =>
        useCase.execute({
          mfaToken: "token",
          code: "000000",
          metadata: { ipAddress: null, userAgent: null },
        }),
      ),
    );

    const codes = outcomes.map((outcome) =>
      outcome.status === "rejected"
        ? (outcome.reason as { code?: string }).code
        : "resolved",
    );

    expect(attempts).toBe(5);
    expect(codes.filter((code) => code === MFA_ERROR_CODES.MFA_INVALID_CODE)).toHaveLength(5);
    expect(codes.filter((code) => code === MFA_ERROR_CODES.MFA_TOO_MANY_ATTEMPTS)).toHaveLength(3);
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
    ).rejects.toMatchObject({ code: MFA_ERROR_CODES.MFA_CHALLENGE_INVALID });

    expect(auditWriter.log).not.toHaveBeenCalled();
  });
});
