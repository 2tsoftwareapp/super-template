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
  ResendVerificationCommand,
  VerifyEmailCommand,
} from './auth.types';

import { UsersRepository } from '../../users/infrastructure/users.repository';
import { AuthRepository } from '../infrastructure/auth.repository';
import { AuthMailService } from './auth-mail.service';
import { generateOpaqueToken, hashOpaqueToken } from './auth.helpers';

@Injectable()
export class EmailVerificationUseCase {
  constructor(
    @Inject(DATABASE) private readonly database: DatabaseClient,
    private readonly usersRepository: UsersRepository,
    private readonly authRepository: AuthRepository,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    private readonly authMailService: AuthMailService,
  ) {}

  async verifyEmail(input: VerifyEmailCommand, requestContext?: RequestContext) {
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

  async resendVerification(input: ResendVerificationCommand) {
    const email = normalizeEmail(input.email);
    const user = await this.usersRepository.findByEmail(email);

    if (user?.status === 'PENDING') {
      const token = generateOpaqueToken();
      await this.authRepository.storeEmailVerificationToken({
        userId: user.id,
        tokenHash: hashOpaqueToken(token),
        expiresAt: new Date(Date.now() + durationToMilliseconds('1d')),
      });
      await this.authMailService.sendVerificationEmail(user.email, token);
    }

    return {
      data: {
        success: true,
        message: 'If the account exists, a verification email has been sent.',
      },
    };
  }
}
