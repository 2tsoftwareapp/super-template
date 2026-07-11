import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { durationToMilliseconds, normalizeEmail } from '@repo/api-core';

import type { ResendVerificationCommand } from '../auth.types';

import { UsersRepository } from '../../../users/infrastructure/users.repository';
import { AuthRepository } from '../../infrastructure/auth.repository';
import { generateOpaqueToken, hashOpaqueToken } from '../auth.helpers';
import { AuthMailService } from '../services/auth-mail.service';

const RESEND_COOLDOWN_MS = 60_000;

@Injectable()
export class ResendVerificationUseCase {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly authRepository: AuthRepository,
    private readonly authMailService: AuthMailService,
  ) {}

  async execute(input: ResendVerificationCommand) {
    const email = normalizeEmail(input.email);
    const user = await this.usersRepository.findByEmail(email);

    if (user?.status === 'PENDING') {
      const latest = await this.authRepository.findLatestEmailVerificationToken(user.id);
      if (latest && !latest.usedAt) {
        const elapsed = Date.now() - latest.createdAt.getTime();
        if (elapsed < RESEND_COOLDOWN_MS) {
          const remaining = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
          throw new HttpException(
            {
              error: {
                message: `Please wait ${remaining}s before requesting another email.`,
              },
            },
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
      }

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
