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

import type { VerifyEmailCommand } from '../auth.types';

import { UsersRepository } from '../../../users/infrastructure/users.repository';
import { AuthRepository } from '../../infrastructure/auth.repository';
import { hashOpaqueToken } from '../auth.helpers';
import { AuthMailService } from '../services/auth-mail.service';

@Injectable()
export class VerifyEmailUseCase {
  constructor(
    @Inject(DATABASE) private readonly database: DatabaseClient,
    private readonly usersRepository: UsersRepository,
    private readonly authRepository: AuthRepository,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    private readonly authMailService: AuthMailService,
  ) {}

  async execute(input: VerifyEmailCommand, requestContext?: RequestContext) {
    const tokenHash = hashOpaqueToken(input.token);
    const token =
      await this.authRepository.findValidEmailVerificationToken(tokenHash);

    if (!token) {
      throw new AppError(
        ERROR_CODES.AUTH_UNAUTHORIZED,
        'Verification token is invalid or expired',
        HttpStatus.UNAUTHORIZED,
      );
    }

    await runInTransaction(this.database, async (transaction) => {
      await this.usersRepository.update(
        token.userId,
        {
          status: 'ACTIVE',
          emailVerifiedAt: new Date(),
        },
        transaction,
      );
      await this.authRepository.consumeEmailVerificationToken(
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
        },
        transaction,
      );
    });

    const user = await this.usersRepository.findById(token.userId);

    if (user) {
      await this.authMailService.sendWelcomeEmail(user.email, user.displayName);
    }

    return {
      data: {
        success: true,
      },
    };
  }
}
