import type { RequestContext } from '@repo/api-core';
import type { TransactionPort } from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  AppError,
  AUDIT_WRITER,
  type AuditWriter,
  ERROR_CODES,
} from '@repo/api-core';
import { TRANSACTION_PORT } from '@repo/api-core';

import type { MfaRegenerateRecoveryCodesCommand } from '../mfa.types';

import { hashRecoveryCode } from '../../domain/hash-recovery-code';
import { generateRecoveryCodes } from '../../domain/recovery-codes';
import { MFA_REPOSITORY, type MfaRepositoryPort } from '../ports/mfa.repository.port';
import { MfaCodeVerifierService } from '../services/mfa-code-verifier.service';

@Injectable()
export class RegenerateRecoveryCodesUseCase {
  constructor(
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
    @Inject(MFA_REPOSITORY) private readonly mfaRepository: MfaRepositoryPort,
    private readonly mfaCodeVerifierService: MfaCodeVerifierService,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
  ) {}

  async execute(
    input: MfaRegenerateRecoveryCodesCommand,
    requestContext?: RequestContext,
  ): Promise<{ recoveryCodes: string[] }> {
    const secretRow = await this.mfaRepository.findSecretByUserId(
      input.userId,
    );

    if (!secretRow?.enabled) {
      throw new AppError(
        ERROR_CODES.MFA_NOT_ENABLED,
        'Two-factor authentication is not enabled',
        HttpStatus.CONFLICT,
      );
    }

    const codeIsValid = await this.mfaCodeVerifierService.verifyCode(
      input.userId,
      input.code,
    );

    if (!codeIsValid) {
      throw new AppError(
        ERROR_CODES.MFA_INVALID_CODE,
        'Invalid verification code',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const recoveryCodes = generateRecoveryCodes();

    await this.transactionPort.run( async (transaction) => {
      await this.mfaRepository.replaceRecoveryCodes(
        input.userId,
        recoveryCodes.map((code) => hashRecoveryCode(code)),
        transaction,
      );
      await this.auditWriter.log(
        {
          actorId: input.userId,
          action: 'mfa.recovery_codes_regenerated',
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
