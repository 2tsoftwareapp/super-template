import { describe, expect, it, vi } from 'vitest';

import { EnvironmentService } from '@repo/api-core';

import { hashRecoveryCode } from '../../../domain/hash-recovery-code';
import { generateTotpCode, generateTotpSecret } from '../../../domain/totp';
import { encryptTotpSecret } from '../../../domain/totp-encryption';
import { MfaCodeVerifierService } from '../mfa-code-verifier.service';

const ENCRYPTION_KEY = 'a'.repeat(64);

const buildEnvironmentService = () =>
  ({
    values: { MFA_ENCRYPTION_KEY: ENCRYPTION_KEY },
  }) as unknown as EnvironmentService;

describe('MfaCodeVerifierService', () => {
  it('returns false when the user has no secret', async () => {
    const mfaRepository = { findSecretByUserId: vi.fn(async () => null) };
    const service = new MfaCodeVerifierService(
      mfaRepository as never,
      buildEnvironmentService(),
    );

    expect(await service.verifyCode('u1', '123456')).toBe(false);
  });

  it('accepts a valid TOTP code', async () => {
    const secret = generateTotpSecret();
    const encrypted = encryptTotpSecret(secret, ENCRYPTION_KEY);
    const mfaRepository = {
      findSecretByUserId: vi.fn(async () => ({
        secretCiphertext: encrypted.ciphertext,
        secretIv: encrypted.iv,
        secretAuthTag: encrypted.authTag,
      })),
    };
    const service = new MfaCodeVerifierService(
      mfaRepository as never,
      buildEnvironmentService(),
    );

    expect(await service.verifyCode('u1', generateTotpCode(secret))).toBe(
      true,
    );
  });

  it('accepts and consumes a valid recovery code', async () => {
    const secret = generateTotpSecret();
    const encrypted = encryptTotpSecret(secret, ENCRYPTION_KEY);
    const recoveryCode = 'ABCD-EFGH';
    const mfaRepository = {
      findSecretByUserId: vi.fn(async () => ({
        secretCiphertext: encrypted.ciphertext,
        secretIv: encrypted.iv,
        secretAuthTag: encrypted.authTag,
      })),
      findUnusedRecoveryCodeByHash: vi.fn(async (_userId, hash) =>
        hash === hashRecoveryCode(recoveryCode) ? { id: 'rc1' } : null,
      ),
      consumeRecoveryCode: vi.fn(async () => true),
    };
    const service = new MfaCodeVerifierService(
      mfaRepository as never,
      buildEnvironmentService(),
    );

    expect(await service.verifyCode('u1', recoveryCode)).toBe(true);
    expect(mfaRepository.consumeRecoveryCode).toHaveBeenCalledWith('rc1', undefined);
  });

  it('rejects a recovery code that a concurrent request already consumed', async () => {
    const secret = generateTotpSecret();
    const encrypted = encryptTotpSecret(secret, ENCRYPTION_KEY);
    const recoveryCode = 'ABCD-EFGH';
    const mfaRepository = {
      findSecretByUserId: vi.fn(async () => ({
        secretCiphertext: encrypted.ciphertext,
        secretIv: encrypted.iv,
        secretAuthTag: encrypted.authTag,
      })),
      findUnusedRecoveryCodeByHash: vi.fn(async () => ({ id: 'rc1' })),
      consumeRecoveryCode: vi.fn(async () => false),
    };
    const service = new MfaCodeVerifierService(
      mfaRepository as never,
      buildEnvironmentService(),
    );

    // The CAS consume lost the race — the code must not authenticate twice.
    expect(await service.verifyCode('u1', recoveryCode)).toBe(false);
    expect(mfaRepository.consumeRecoveryCode).toHaveBeenCalledWith('rc1', undefined);
  });

  it('rejects an unknown code', async () => {
    const secret = generateTotpSecret();
    const encrypted = encryptTotpSecret(secret, ENCRYPTION_KEY);
    const mfaRepository = {
      findSecretByUserId: vi.fn(async () => ({
        secretCiphertext: encrypted.ciphertext,
        secretIv: encrypted.iv,
        secretAuthTag: encrypted.authTag,
      })),
      findUnusedRecoveryCodeByHash: vi.fn(async () => null),
    };
    const service = new MfaCodeVerifierService(
      mfaRepository as never,
      buildEnvironmentService(),
    );

    expect(await service.verifyCode('u1', '000000')).toBe(false);
  });
});
