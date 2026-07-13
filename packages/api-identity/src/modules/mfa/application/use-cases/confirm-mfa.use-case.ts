import type { RequestContext } from '@repo/api-core';
import type { DatabaseClient } from '@repo/api-database';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  AppError,
  AUDIT_WRITER,
  type AuditWriter,
  EnvironmentService,
  ERROR_CODES,
} from '@repo/api-core';
import { DATABASE, runInTransaction } from '@repo/api-database';

import type { MfaConfirmCommand } from '../mfa.types';

import { hashRecoveryCode } from '../../domain/hash-recovery-code';
import { generateRecoveryCodes } from '../../domain/recovery-codes';
import { verifyTotpCode } from '../../domain/totp';
import { decryptTotpSecret } from '../../domain/totp-encryption';
import { MFA_REPOSITORY, type MfaRepositoryPort } from '../ports/mfa.repository.port';

@Injectable()
export class ConfirmMfaUseCase {
  constructor(
    @Inject(DATABASE) private readonly database: DatabaseClient,
    @Inject(MFA_REPOSITORY) private readonly mfaRepository: MfaRepositoryPort,
    private readonly environmentService: EnvironmentService,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
  ) {}

  async execute(
    input: MfaConfirmCommand,
    requestContext?: RequestContext,
  ): Promise<{ recoveryCodes: string[] }> {
    const secretRow = await this.mfaRepository.findSecretByUserId(
      input.userId,
    );

    if (!secretRow) {
      throw new AppError(
        ERROR_CODES.MFA_SETUP_REQUIRED,
        'Start two-factor setup before confirming a code',
        HttpStatus.CONFLICT,
      );
    }

    if (secretRow.enabled) {
      throw new AppError(
        ERROR_CODES.MFA_ALREADY_ENABLED,
        'Two-factor authentication is already enabled',
        HttpStatus.CONFLICT,
      );
    }

    const secret = decryptTotpSecret(
      {
        ciphertext: secretRow.secretCiphertext,
        iv: secretRow.secretIv,
        authTag: secretRow.secretAuthTag,
      },
      this.environmentService.values.MFA_ENCRYPTION_KEY,
    );

    if (!verifyTotpCode(secret, input.code)) {
      throw new AppError(
        ERROR_CODES.MFA_INVALID_CODE,
        'Invalid verification code',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const recoveryCodes = generateRecoveryCodes();

    await runInTransaction(this.database, async (transaction) => {
      await this.mfaRepository.confirmSecret(input.userId, transaction);
      await this.mfaRepository.replaceRecoveryCodes(
        input.userId,
        recoveryCodes.map((code) => hashRecoveryCode(code)),
        transaction,
      );
      await this.auditWriter.log(
        {
          actorId: input.userId,
          action: 'mfa.enabled',
          entityType: 'user',
          entityId: input.userId,
          requestContext,
        },
        transaction,
      );
    });

    return { recoveryCodes };
  }
}
