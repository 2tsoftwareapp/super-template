import { describe, expect, it, vi } from "vitest";

import { ERROR_CODES, EnvironmentService } from "@repo/api-runtime";

import { encryptTotpSecret } from "../../../domain/totp-encryption";
import { generateTotpCode, generateTotpSecret } from "../../../domain/totp";
import { ConfirmMfaUseCase } from "../confirm-mfa.use-case";

const ENCRYPTION_KEY = "a".repeat(64);

const buildEnvironmentService = () =>
  ({
    values: { MFA_ENCRYPTION_KEY: ENCRYPTION_KEY },
  }) as unknown as EnvironmentService;

const buildTransactionPort = () => ({
  run: vi.fn().mockImplementation(async (fn: any) => fn("tx")),
});

describe("ConfirmMfaUseCase", () => {
  it("rejects when setup was never started", async () => {
    const mfaRepository = {
      findSecretByUserId: vi.fn(async () => null),
    };
    const useCase = new ConfirmMfaUseCase(
      buildTransactionPort() as never,
      mfaRepository as never,
      buildEnvironmentService(),
      { log: vi.fn() } as never,
    );

    await expect(useCase.execute({ userId: "u1", code: "000000" })).rejects.toMatchObject({
      code: ERROR_CODES.MFA_SETUP_REQUIRED,
    });
  });

  it("rejects when already enabled", async () => {
    const mfaRepository = {
      findSecretByUserId: vi.fn(async () => ({ enabled: true })),
    };
    const useCase = new ConfirmMfaUseCase(
      buildTransactionPort() as never,
      mfaRepository as never,
      buildEnvironmentService(),
      { log: vi.fn() } as never,
    );

    await expect(useCase.execute({ userId: "u1", code: "000000" })).rejects.toMatchObject({
      code: ERROR_CODES.MFA_ALREADY_ENABLED,
    });
  });

  it("rejects an invalid code", async () => {
    const secret = generateTotpSecret();
    const encrypted = encryptTotpSecret(secret, ENCRYPTION_KEY);
    const mfaRepository = {
      findSecretByUserId: vi.fn(async () => ({
        enabled: false,
        secretCiphertext: encrypted.ciphertext,
        secretIv: encrypted.iv,
        secretAuthTag: encrypted.authTag,
      })),
    };
    const useCase = new ConfirmMfaUseCase(
      buildTransactionPort() as never,
      mfaRepository as never,
      buildEnvironmentService(),
      { log: vi.fn() } as never,
    );

    await expect(useCase.execute({ userId: "u1", code: "000000" })).rejects.toMatchObject({
      code: ERROR_CODES.MFA_INVALID_CODE,
    });
  });

  it("enables MFA and returns recovery codes for a valid code", async () => {
    const secret = generateTotpSecret();
    const encrypted = encryptTotpSecret(secret, ENCRYPTION_KEY);
    const code = generateTotpCode(secret);
    const mfaRepository = {
      findSecretByUserId: vi.fn(async () => ({
        enabled: false,
        secretCiphertext: encrypted.ciphertext,
        secretIv: encrypted.iv,
        secretAuthTag: encrypted.authTag,
      })),
      confirmSecret: vi.fn(async () => undefined),
      replaceRecoveryCodes: vi.fn(async () => undefined),
    };
    const auditWriter = { log: vi.fn(async () => undefined) };
    const useCase = new ConfirmMfaUseCase(
      buildTransactionPort() as never,
      mfaRepository as never,
      buildEnvironmentService(),
      auditWriter as never,
    );

    const result = await useCase.execute({ userId: "u1", code });

    expect(result.recoveryCodes).toHaveLength(8);
    expect(mfaRepository.confirmSecret).toHaveBeenCalledWith("u1", "tx");
    expect(mfaRepository.replaceRecoveryCodes).toHaveBeenCalledWith(
      "u1",
      expect.arrayContaining([expect.any(String)]),
      "tx",
    );
    expect(auditWriter.log).toHaveBeenCalledWith(
      expect.objectContaining({ action: "mfa.enabled" }),
    );
  });
});
