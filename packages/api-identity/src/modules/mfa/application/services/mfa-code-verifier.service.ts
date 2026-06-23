import type { DatabaseExecutor } from '@repo/api-database';

import { Injectable } from '@nestjs/common';
import { EnvironmentService } from '@repo/api-core';

import { hashRecoveryCode } from '../../domain/hash-recovery-code';
import { normalizeRecoveryCode } from '../../domain/recovery-codes';
import { verifyTotpCode } from '../../domain/totp';
import { decryptTotpSecret } from '../../domain/totp-encryption';
import { MfaRepository } from '../../infrastructure/mfa.repository';

const RECOVERY_CODE_LENGTH = 8;

@Injectable()
export class MfaCodeVerifierService {
  constructor(
    private readonly mfaRepository: MfaRepository,
    private readonly environmentService: EnvironmentService,
  ) {}

  /** Accepts either a 6-digit TOTP code or an unused recovery code, consuming the latter on success. */
  async verifyCode(
    userId: string,
    code: string,
    executor?: DatabaseExecutor,
  ): Promise<boolean> {
    const secretRow = await this.mfaRepository.findSecretByUserId(
      userId,
      executor,
    );

    if (!secretRow) {
      return false;
    }

    const secret = decryptTotpSecret(
      {
        ciphertext: secretRow.secretCiphertext,
        iv: secretRow.secretIv,
        authTag: secretRow.secretAuthTag,
      },
      this.environmentService.values.MFA_ENCRYPTION_KEY,
    );

    if (verifyTotpCode(secret, code)) {
      return true;
    }

    const normalized = normalizeRecoveryCode(code);

    if (normalized.length !== RECOVERY_CODE_LENGTH) {
      return false;
    }

    const recoveryCode = await this.mfaRepository.findUnusedRecoveryCodeByHash(
      userId,
      hashRecoveryCode(normalized),
      executor,
    );

    if (!recoveryCode) {
      return false;
    }

    await this.mfaRepository.consumeRecoveryCode(recoveryCode.id, executor);

    return true;
  }
}
