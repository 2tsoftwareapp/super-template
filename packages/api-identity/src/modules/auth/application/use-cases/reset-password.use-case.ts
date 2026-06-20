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

import type { ResetPasswordCommand } from '../auth.types';

import { UsersRepository } from '../../../users/infrastructure/users.repository';
import { AuthRepository } from '../../infrastructure/auth.repository';
import { hashOpaqueToken, hashPassword } from '../auth.helpers';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(DATABASE) private readonly database: DatabaseClient,
    private readonly usersRepository: UsersRepository,
    private readonly authRepository: AuthRepository,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
  ) {}

  async execute(
    input: ResetPasswordCommand,
    requestContext?: RequestContext,
  ) {
    const tokenHash = hashOpaqueToken(input.token);
    const token =
      await this.authRepository.findValidPasswordResetToken(tokenHash);

    if (!token) {
      throw new AppError(
        ERROR_CODES.AUTH_UNAUTHORIZED,
        'Reset token is invalid or expired',
        HttpStatus.UNAUTHORIZED,
      );
    }

    await runInTransaction(this.database, async (transaction) => {
      await this.usersRepository.update(
        token.userId,
        {
          passwordHash: await hashPassword(input.newPassword),
        },
        transaction,
      );
      await this.authRepository.consumePasswordResetToken(
        token.id,
        transaction,
      );
      await this.authRepository.revokeAllSessionsForUser(
        token.userId,
        transaction,
      );
      await this.auditWriter.log(
        {
          actorId: token.userId,
          action: 'auth.password_reset.completed',
          entityType: 'user',
          entityId: token.userId,
          requestContext,
        },
        transaction,
      );
    });

    return {
      data: {
        success: true,
      },
    };
  }
}
