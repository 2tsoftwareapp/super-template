import { describe, expect, it, vi } from "vitest";

import type { RequestContext } from "@repo/api-kernel";

import { SYSTEM_SCOPE } from "@repo/api-kernel";
import { EnvironmentService } from "@repo/api-runtime";
import { MFA_ERROR_CODES } from "@repo/feature-mfa/contracts";

import { hashRecoveryCode } from "../../../domain/hash-recovery-code";
import { encryptTotpSecret } from "../../../domain/totp-encryption";
import { generateTotpCode, generateTotpSecret } from "../../../domain/totp";
import { MfaCodeVerifierService } from "../../services/mfa-code-verifier.service";
import { DisableMfaUseCase } from "../disable-mfa.use-case";

const ENCRYPTION_KEY = "a".repeat(64);
const USER_ID = "u1";
/** 8 base32 characters once normalized, i.e. a valid recovery-code shape. */
const RECOVERY_CODE = "ABCD-EFGH";
const RECOVERY_CODE_ROW_ID = "rc-1";

const buildEnvironmentService = () =>
  ({
    values: { MFA_ENCRYPTION_KEY: ENCRYPTION_KEY },
  }) as unknown as EnvironmentService;

/**
 * Uses the real MfaCodeVerifierService with a fake repository, so the code gate
 * under test is production code, not a stub.
 */
function buildHarness(
  options: {
    secretRow?: { enabled: boolean } | null;
    /** Last write wins in the fake, so the returned code must match this flag. */
    recoveryCodeConsumed?: boolean;
  } = {},
) {
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
    deleteSecret: vi.fn(async () => undefined),
    replaceRecoveryCodes: vi.fn(async () => undefined),
    findUnusedRecoveryCodeByHash: vi.fn(async (_userId: string, codeHash: string) =>
      codeHash === hashRecoveryCode(RECOVERY_CODE)
        ? {
            id: RECOVERY_CODE_ROW_ID,
            userId: USER_ID,
            codeHash,
            usedAt: null,
            createdAt: new Date("2026-09-15T08:00:00.000Z"),
          }
        : null,
    ),
    consumeRecoveryCode: vi.fn(async () => options.recoveryCodeConsumed ?? true),
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

  const useCase = new DisableMfaUseCase(
    transactionPort as never,
    mfaRepository as never,
    codeVerifier,
    auditWriter as never,
  );

  return { useCase, mfaRepository, auditWriter, transactionPort, secret };
}

describe("DisableMfaUseCase", () => {
  it.each([
    ["no secret row", null],
    ["a secret that was never confirmed", { enabled: false }],
  ])("rejects when there is %s", async (_label, secretRow) => {
    const harness = buildHarness({ secretRow });

    await expect(
      harness.useCase.execute({ userId: USER_ID, code: "000000" }),
    ).rejects.toMatchObject({ code: MFA_ERROR_CODES.MFA_NOT_ENABLED });

    expect(harness.mfaRepository.deleteSecret).not.toHaveBeenCalled();
    expect(harness.auditWriter.log).not.toHaveBeenCalled();
  });

  it("rejects a wrong code and deletes nothing", async () => {
    const harness = buildHarness();

    await expect(
      harness.useCase.execute({ userId: USER_ID, code: "000000" }),
    ).rejects.toMatchObject({ code: MFA_ERROR_CODES.MFA_INVALID_CODE });

    expect(harness.mfaRepository.deleteSecret).not.toHaveBeenCalled();
    expect(harness.mfaRepository.replaceRecoveryCodes).not.toHaveBeenCalled();
    expect(harness.auditWriter.log).not.toHaveBeenCalled();
  });

  it("deletes the secret and recovery codes in one transaction for a valid TOTP code", async () => {
    const harness = buildHarness();
    const code = generateTotpCode(harness.secret);

    await harness.useCase.execute({ userId: USER_ID, code });

    expect(harness.mfaRepository.deleteSecret).toHaveBeenCalledWith(USER_ID, "tx");
    expect(harness.mfaRepository.replaceRecoveryCodes).toHaveBeenCalledWith(USER_ID, [], "tx");
    expect(harness.transactionPort.run).toHaveBeenCalledTimes(1);
  });

  it("audits the disable with the platform scope", async () => {
    const harness = buildHarness();
    const requestContext: RequestContext = {
      requestId: "req-1",
      ipAddress: "203.0.113.10",
      userAgent: "vitest",
    };

    await harness.useCase.execute(
      { userId: USER_ID, code: generateTotpCode(harness.secret) },
      requestContext,
    );

    expect(harness.auditWriter.log).toHaveBeenCalledTimes(1);
    expect(harness.auditWriter.log).toHaveBeenCalledWith({
      actorId: USER_ID,
      action: "mfa.disabled",
      entityType: "user",
      entityId: USER_ID,
      requestContext,
      scope: SYSTEM_SCOPE.PLATFORM,
    });
  });

  it("accepts an unused recovery code as proof of possession", async () => {
    const harness = buildHarness();

    await harness.useCase.execute({ userId: USER_ID, code: RECOVERY_CODE });

    // The verifier normalizes before hashing and CAS-consumes the row.
    expect(harness.mfaRepository.findUnusedRecoveryCodeByHash).toHaveBeenCalledWith(
      USER_ID,
      hashRecoveryCode(RECOVERY_CODE),
      undefined,
    );
    expect(harness.mfaRepository.consumeRecoveryCode).toHaveBeenCalledWith(
      RECOVERY_CODE_ROW_ID,
      undefined,
    );
    expect(harness.mfaRepository.deleteSecret).toHaveBeenCalledWith(USER_ID, "tx");
  });

  it("rejects a recovery code that a concurrent request already consumed", async () => {
    const harness = buildHarness({ recoveryCodeConsumed: false });

    await expect(
      harness.useCase.execute({ userId: USER_ID, code: RECOVERY_CODE }),
    ).rejects.toMatchObject({ code: MFA_ERROR_CODES.MFA_INVALID_CODE });

    expect(harness.mfaRepository.deleteSecret).not.toHaveBeenCalled();
  });
});
