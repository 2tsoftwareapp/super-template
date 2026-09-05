import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError, durationToMilliseconds, normalizeEmail } from "@repo/api-kernel";
import { ERROR_CODES } from "@repo/api-runtime";
import { AUTH_USER_STORE, type AuthUserStore } from "@repo/feature-auth/contracts";

import type { ResendVerificationCommand } from "../auth.types";

import { generateOpaqueToken, hashOpaqueToken } from "../auth.helpers";
import {
  AUTH_SESSION_REPOSITORY,
  type AuthSessionRepositoryPort,
} from "../ports/auth-session.repository.port";
import { AuthMailService } from "../services/auth-mail.service";

const RESEND_COOLDOWN_MS = 60_000;

@Injectable()
export class ResendVerificationUseCase {
  constructor(
    @Inject(AUTH_USER_STORE)
    private readonly usersRepository: AuthUserStore,
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly authSessionRepository: AuthSessionRepositoryPort,
    private readonly authMailService: AuthMailService,
  ) {}

  async execute(input: ResendVerificationCommand) {
    const email = normalizeEmail(input.email);
    const user = await this.usersRepository.findByEmail(email);

    if (user?.status === "PENDING") {
      const latest = await this.authSessionRepository.findLatestEmailVerificationToken(user.id);
      if (latest && !latest.usedAt) {
        const elapsed = Date.now() - latest.createdAt.getTime();
        if (elapsed < RESEND_COOLDOWN_MS) {
          const remaining = Math.ceil((RESEND_COOLDOWN_MS - elapsed) / 1000);
          throw new AppError(
            ERROR_CODES.RATE_LIMITED,
            `Please wait ${remaining}s before requesting another email.`,
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
      }

      const token = generateOpaqueToken();
      await this.authSessionRepository.storeEmailVerificationToken({
        userId: user.id,
        tokenHash: hashOpaqueToken(token),
        expiresAt: new Date(Date.now() + durationToMilliseconds("1d")),
      });
      await this.authMailService.sendVerificationEmail(user.email, token);
    }

    return {
      success: true,
      message: "If the account exists, a verification email has been sent.",
    };
  }
}
