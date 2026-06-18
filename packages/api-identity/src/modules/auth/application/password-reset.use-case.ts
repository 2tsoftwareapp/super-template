import type { RequestContext } from '@repo/api-core';
import type { DatabaseClient } from '@repo/api-database';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  AppError,
  AUDIT_WRITER,
  type AuditWriter,
  durationToMilliseconds,
  ERROR_CODES,
  normalizeEmail,
} from '@repo/api-core';
import { DATABASE } from '@repo/api-database';
import { runInTransaction } from '@repo/api-database';

import type {
  ForgotPasswordCommand,
  ResetPasswordCommand,
} from './auth.types';

import { UsersRepository } from '../../users/infrastructure/users.repository';
import { AuthRepository } from '../infrastructure/auth.repository';
import { AuthMailService } from './auth-mail.service';
import {
  generateOpaqueToken,
  hashOpaqueToken,
  hashPassword,
} from './auth.helpers';

@Injectable()
export class PasswordResetUseCase {
  constructor(
    @Inject(DATABASE) private readonly database: DatabaseClient,
    private readonly usersRepository: UsersRepository,
    private readonly authRepository: AuthRepository,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    private readonly authMailService: AuthMailService,
  ) {}

  async forgotPassword(input: ForgotPasswordCommand) {
    const email = normalizeEmail(input.email);
    const user = await this.usersRepository.findByEmail(email);

    if (user) {
      const token = generateOpaqueToken();
      await this.authRepository.storePasswordResetToken({
        userId: user.id,
        tokenHash: hashOpaqueToken(token),
        expiresAt: new Date(Date.now() + durationToMilliseconds('1h')),
      });
      await this.authMailService.sendPasswordResetEmail(user.email, token);
    }

    return {
      data: {
        success: true,
        message: 'If the account exists, a reset email has been sent.',
      },
    };
  }

  async resetPassword(
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
