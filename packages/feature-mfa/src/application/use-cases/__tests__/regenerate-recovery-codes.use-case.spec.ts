import { describe, expect, it, vi } from "vitest";

import { SYSTEM_SCOPE } from "@repo/api-kernel";
import { EnvironmentService } from "@repo/api-runtime";
import { MFA_ERROR_CODES } from "@repo/feature-mfa/contracts";

import { hashRecoveryCode } from "../../../domain/hash-recovery-code";
import { generateRecoveryCodes, normalizeRecoveryCode } from "../../../domain/recovery-codes";
import { encryptTotpSecret } from "../../../domain/totp-encryption";
import { generateTotpCode, generateTotpSecret } from "../../../domain/totp";
import { MfaCodeVerifierService } from "../../services/mfa-code-verifier.service";
import { RegenerateRecoveryCodesUseCase } from "../regenerate-recovery-codes.use-case";

const ENCRYPTION_KEY = "a".repeat(64);
const USER_ID = "u1";
/** Hash of a code from the previous batch: it must not survive regeneration. */
const STALE_CODE_HASH = hashRecoveryCode("ZYXW-VUTS");
const EXPECTED_RECOVERY_CODE_COUNT = generateRecoveryCodes().length;

const buildEnvironmentService = () =>
  ({
    values: { MFA_ENCRYPTION_KEY: ENCRYPTION_KEY },
  }) as unknown as EnvironmentService;

function buildHarness(options: { secretRow?: { enabled: boolean } | null } = {}) {
  const secret = generateTotpSecret();
  const encrypted = encryptTotpSecret(secret, ENCRYPTION_KEY);
  const secretRow =
    options.secretRow === undefined
      ? {
          userId: USER_ID,
          secretCiphertext: encrypted.ciphertext,
          secretIv: encrypted.iv,
          secretAuthTag: encrypted.authTag,
          enabled: true,
          confirmedAt: new Date("2026-09-15T09:00:00.000Z"),
          createdAt: new Date("2026-09-15T08:00:00.000Z"),
          updatedAt: new Date("2026-09-15T09:00:00.000Z"),
        }
      : options.secretRow;

  const mfaRepository = {
    findSecretByUserId: vi.fn(async () => secretRow),
    replaceRecoveryCodes: vi.fn<
      (userId: string, codeHashes: string[], executor?: unknown) => Promise<void>
    >(async () => undefined),
    findUnusedRecoveryCodeByHash: vi.fn(async () => null),
    consumeRecoveryCode: vi.fn(async () => false),
  };

  const codeVerifier = new MfaCodeVerifierService(
    mfaRepository as never,
    buildEnvironmentService(),
  );
  const auditWriter = { log: vi.fn(async () => undefined) };
  const transactionPort = {
    run: vi.fn(async (fn: (tx: unknown) => Promise<unknown>) => fn("tx")),
    withTenant: vi.fn(),
    withSavepoint: vi.fn(),
  };

  const useCase = new RegenerateRecoveryCodesUseCase(
    transactionPort as never,
    mfaRepository as never,
    codeVerifier,
    auditWriter as never,
  );

  return { useCase, mfaRepository, auditWriter, transactionPort, secret };
}

describe("RegenerateRecoveryCodesUseCase", () => {
  it.each([
    ["no secret row", null],
    ["a secret that was never confirmed", { enabled: false }],
  ])("rejects when there is %s", async (_label, secretRow) => {
    const harness = buildHarness({ secretRow });

    await expect(
      harness.useCase.execute({ userId: USER_ID, code: "000000" }),
    ).rejects.toMatchObject({ code: MFA_ERROR_CODES.MFA_NOT_ENABLED });

    expect(harness.mfaRepository.replaceRecoveryCodes).not.toHaveBeenCalled();
    expect(harness.auditWriter.log).not.toHaveBeenCalled();
  });

  it("rejects a wrong code and leaves the existing codes in place", async () => {
    const harness = buildHarness();

    await expect(
      harness.useCase.execute({ userId: USER_ID, code: "000000" }),
    ).rejects.toMatchObject({ code: MFA_ERROR_CODES.MFA_INVALID_CODE });

    expect(harness.mfaRepository.replaceRecoveryCodes).not.toHaveBeenCalled();
    expect(harness.auditWriter.log).not.toHaveBeenCalled();
  });

  it("returns a fresh batch whose stored hashes replace the previous ones", async () => {
    const harness = buildHarness();

    const result = await harness.useCase.execute({
      userId: USER_ID,
      code: generateTotpCode(harness.secret),
    });

    expect(result.recoveryCodes).toHaveLength(EXPECTED_RECOVERY_CODE_COUNT);
    expect(new Set(result.recoveryCodes).size).toBe(EXPECTED_RECOVERY_CODE_COUNT);
    for (const code of result.recoveryCodes) {
      expect(normalizeRecoveryCode(code)).toHaveLength(8);
    }

    // The persisted hashes must be exactly the hashes of the returned codes, so
    // the codes the user was shown are the codes that verify later.
    const storedHashes = harness.mfaRepository.replaceRecoveryCodes.mock.calls[0]?.[1] ?? [];
    expect(storedHashes).toHaveLength(EXPECTED_RECOVERY_CODE_COUNT);
    expect(storedHashes).toEqual(result.recoveryCodes.map((code) => hashRecoveryCode(code)));

    // The whole batch is replaced in one call: every previously issued code is
    // gone, including this stale one.
    expect(storedHashes).not.toContain(STALE_CODE_HASH);
    expect(harness.mfaRepository.replaceRecoveryCodes).toHaveBeenCalledWith(
      USER_ID,
      expect.any(Array),
      "tx",
    );
    expect(harness.transactionPort.run).toHaveBeenCalledTimes(1);
  });

  it("audits the regeneration with the platform scope", async () => {
    const harness = buildHarness();

    await harness.useCase.execute({ userId: USER_ID, code: generateTotpCode(harness.secret) });

    expect(harness.auditWriter.log).toHaveBeenCalledWith({
      actorId: USER_ID,
      action: "mfa.recovery_codes_regenerated",
      entityType: "user",
      entityId: USER_ID,
      requestContext: undefined,
      scope: SYSTEM_SCOPE.PLATFORM,
    });
  });
});
