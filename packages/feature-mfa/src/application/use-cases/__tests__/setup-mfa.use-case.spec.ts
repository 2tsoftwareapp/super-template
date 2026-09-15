import { describe, expect, it, vi } from "vitest";

import { EnvironmentService } from "@repo/api-runtime";
import { MFA_ERROR_CODES } from "@repo/feature-mfa/contracts";

import { base32Encode } from "../../../domain/totp";
import { decryptTotpSecret } from "../../../domain/totp-encryption";
import { SetupMfaUseCase } from "../setup-mfa.use-case";

const ENCRYPTION_KEY = "a".repeat(64);
const USER_ID = "u1";
const EMAIL = "user@example.test";

const buildEnvironmentService = () =>
  ({
    values: { MFA_ENCRYPTION_KEY: ENCRYPTION_KEY },
  }) as unknown as EnvironmentService;

function buildHarness(options: { existingSecret?: { enabled: boolean } | null } = {}) {
  const mfaRepository = {
    findSecretByUserId: vi.fn(async () => options.existingSecret ?? null),
    upsertPendingSecret: vi.fn<
      (values: {
        userId: string;
        secretCiphertext: string;
        secretIv: string;
        secretAuthTag: string;
      }) => Promise<null>
    >(async () => null),
    confirmSecret: vi.fn(async () => null),
  };

  const useCase = new SetupMfaUseCase(mfaRepository as never, buildEnvironmentService());

  return { useCase, mfaRepository };
}

describe("SetupMfaUseCase", () => {
  it("refuses to start a second setup once MFA is enabled", async () => {
    const harness = buildHarness({ existingSecret: { enabled: true } });

    await expect(harness.useCase.execute(USER_ID, EMAIL)).rejects.toMatchObject({
      code: MFA_ERROR_CODES.MFA_ALREADY_ENABLED,
    });

    expect(harness.mfaRepository.upsertPendingSecret).not.toHaveBeenCalled();
  });

  it("stores the new secret encrypted and unconfirmed, and returns it to the caller", async () => {
    const harness = buildHarness({ existingSecret: null });

    const result = await harness.useCase.execute(USER_ID, EMAIL);

    expect(harness.mfaRepository.upsertPendingSecret).toHaveBeenCalledTimes(1);
    const [stored] = harness.mfaRepository.upsertPendingSecret.mock.calls[0]!;

    expect(stored.userId).toBe(USER_ID);

    // The secret handed to the user must be exactly the secret that was stored:
    // decrypting the persisted ciphertext reproduces it.
    const decrypted = decryptTotpSecret(
      { ciphertext: stored.secretCiphertext, iv: stored.secretIv, authTag: stored.secretAuthTag },
      ENCRYPTION_KEY,
    );
    expect(base32Encode(decrypted)).toBe(result.secret);

    // ... and it must never be persisted in the clear.
    expect(stored.secretCiphertext).not.toContain(result.secret);
    expect(stored.secretIv.length).toBeGreaterThan(0);
    expect(stored.secretAuthTag.length).toBeGreaterThan(0);

    // Setup must not confirm the secret: confirm-mfa owns that transition.
    expect(harness.mfaRepository.confirmSecret).not.toHaveBeenCalled();
  });

  it("builds an otpauth URI an authenticator app can scan", async () => {
    const harness = buildHarness({ existingSecret: null });

    const result = await harness.useCase.execute(USER_ID, EMAIL);

    const uri = new URL(result.otpauthUrl);
    expect(uri.protocol).toBe("otpauth:");
    expect(uri.hostname).toBe("totp");
    expect(decodeURIComponent(uri.pathname)).toContain(EMAIL);
    expect(uri.searchParams.get("issuer")).toBe("SuperTemplate");
    expect(uri.searchParams.get("secret")).toBe(result.secret);
    expect(uri.searchParams.get("algorithm")).toBe("SHA1");
    expect(uri.searchParams.get("digits")).toBe("6");
    expect(uri.searchParams.get("period")).toBe("30");
  });

  it("re-issues a secret when a previous setup was never confirmed", async () => {
    const harness = buildHarness({ existingSecret: { enabled: false } });

    const result = await harness.useCase.execute(USER_ID, EMAIL);

    expect(result.secret).toHaveLength(32);
    expect(harness.mfaRepository.upsertPendingSecret).toHaveBeenCalledTimes(1);
    expect(harness.mfaRepository.confirmSecret).not.toHaveBeenCalled();
  });
});
