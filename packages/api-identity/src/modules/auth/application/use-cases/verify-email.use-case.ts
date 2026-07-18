import type { RequestContext } from '@repo/api-core';
import type { TransactionPort } from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { 
  AppError,
  AUDIT_WRITER,
  type AuditWriter,
  ERROR_CODES,
  SYSTEM_SCOPE,
} from '@repo/api-core';
import { TRANSACTION_PORT } from '@repo/api-core';

import type { VerifyEmailCommand } from '../auth.types';

import {
  USERS_REPOSITORY,
  type UsersRepositoryPort,
} from '../../../users/application/ports/users.repository.port';
import { hashOpaqueToken } from '../auth.helpers';
import {
  AUTH_SESSION_REPOSITORY,
  type AuthSessionRepositoryPort,
} from '../ports/auth-session.repository.port';
import { AuthMailService } from '../services/auth-mail.service';

@Injectable()
export class VerifyEmailUseCase {
  constructor(
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepositoryPort,
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly authSessionRepository: AuthSessionRepositoryPort,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    private readonly authMailService: AuthMailService,
  ) {}

  async execute(input: VerifyEmailCommand, requestContext?: RequestContext) {
    const tokenHash = hashOpaqueToken(input.token);
    const token =
      await this.authSessionRepository.findValidEmailVerificationToken(tokenHash);

    if (!token) {
      throw new AppError(
        ERROR_CODES.AUTH_UNAUTHORIZED,
        'Verification token is invalid or expired',
        HttpStatus.UNAUTHORIZED,
      );
    }

    await this.transactionPort.run( async (transaction) => {
      await this.usersRepository.update(
        token.userId,
        {
          status: 'ACTIVE',
          emailVerifiedAt: new Date(),
        },
        transaction,
      );
      await this.authSessionRepository.consumeEmailVerificationToken(
        token.id,
        transaction,
      );
      await this.auditWriter.log(
        {
          actorId: token.userId,
          action: 'auth.email_verified',
          entityType: 'user',
          entityId: token.userId,
          requestContext,
            scope: SYSTEM_SCOPE.PLATFORM
        },
        transaction,
      );
    });

    const user = await this.usersRepository.findById(token.userId);

    if (user) {
      await this.authMailService.sendWelcomeEmail(user.email, user.displayName);
    }

    return { success: true };
  }
}
