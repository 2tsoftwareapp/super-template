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

import {
  USERS_REPOSITORY,
  type UsersRepositoryPort,
} from '../../../users/application/ports/users.repository.port';
import { hashOpaqueToken, hashPassword } from '../auth.helpers';
import {
  AUTH_SESSION_REPOSITORY,
  type AuthSessionRepositoryPort,
} from '../ports/auth-session.repository.port';

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(DATABASE) private readonly database: DatabaseClient,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepositoryPort,
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly authSessionRepository: AuthSessionRepositoryPort,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
  ) {}

  async execute(
    input: ResetPasswordCommand,
    requestContext?: RequestContext,
  ) {
    const tokenHash = hashOpaqueToken(input.token);
    const token =
      await this.authSessionRepository.findValidPasswordResetToken(tokenHash);

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
      await this.authSessionRepository.consumePasswordResetToken(
        token.id,
        transaction,
      );
      await this.authSessionRepository.revokeAllSessionsForUser(
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

    return { success: true };
  }
}
