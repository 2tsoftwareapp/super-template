import { Inject, Injectable } from "@nestjs/common";
import { durationToMilliseconds, normalizeEmail } from "@repo/api-runtime";
import {
  AUTH_USER_STORE,
  type AuthUserStore,
} from "@repo/api-runtime";

import type { ForgotPasswordCommand } from "../auth.types";

import { generateOpaqueToken, hashOpaqueToken } from "../auth.helpers";
import {
  AUTH_SESSION_REPOSITORY,
  type AuthSessionRepositoryPort,
} from "../ports/auth-session.repository.port";
import { AuthMailService } from "../services/auth-mail.service";

@Injectable()
export class ForgotPasswordUseCase {
  constructor(
    @Inject(AUTH_USER_STORE)
    private readonly usersRepository: AuthUserStore,
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly authSessionRepository: AuthSessionRepositoryPort,
    private readonly authMailService: AuthMailService,
  ) {}

  async execute(input: ForgotPasswordCommand) {
    const email = normalizeEmail(input.email);
    const user = await this.usersRepository.findByEmail(email);

    if (user) {
      const token = generateOpaqueToken();
      await this.authSessionRepository.storePasswordResetToken({
        userId: user.id,
        tokenHash: hashOpaqueToken(token),
        expiresAt: new Date(Date.now() + durationToMilliseconds("1h")),
      });
      await this.authMailService.sendPasswordResetEmail(user.email, token);
    }

    return {
      success: true,
      message: "If the account exists, a reset email has been sent.",
    };
  }
}
