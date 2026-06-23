import type { RequestContext } from '@repo/api-core';
import type { DatabaseClient } from '@repo/api-database';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  AppError,
  AUDIT_WRITER,
  type AuditWriter,
  ERROR_CODES,
} from '@repo/api-core';
import { DATABASE, runInTransaction } from '@repo/api-database';

import type { MfaDisableCommand } from '../mfa.types';

import { MfaRepository } from '../../infrastructure/mfa.repository';
import { MfaCodeVerifierService } from '../services/mfa-code-verifier.service';

@Injectable()
export class DisableMfaUseCase {
  constructor(
    @Inject(DATABASE) private readonly database: DatabaseClient,
    private readonly mfaRepository: MfaRepository,
    private readonly mfaCodeVerifierService: MfaCodeVerifierService,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
  ) {}

  async execute(
    input: MfaDisableCommand,
    requestContext?: RequestContext,
  ): Promise<void> {
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

    await runInTransaction(this.database, async (transaction) => {
      await this.mfaRepository.deleteSecret(input.userId, transaction);
      await this.mfaRepository.replaceRecoveryCodes(
        input.userId,
        [],
        transaction,
      );
      await this.auditWriter.log(
        {
          actorId: input.userId,
          action: 'mfa.disabled',
          entityType: 'user',
          entityId: input.userId,
          requestContext,
        },
        transaction,
      );
    });
  }
}
