import type { TransactionExecutor } from "@repo/api-runtime";

import { Inject, Injectable } from "@nestjs/common";
import {
  AUTH_EMAIL_VERIFICATION,
  type AuthEmailVerification,
  durationToMilliseconds,
  generateOpaqueToken,
  hashOpaqueToken,
} from "@repo/api-runtime";

import { AUTH_SESSION_REPOSITORY, type AuthSessionRepositoryPort } from "../ports/auth-session.repository.port";
import { OUTBOX_REPOSITORY, type OutboxRepositoryPort } from "../ports/outbox.repository.port";

@Injectable()
export class AuthEmailVerificationService implements AuthEmailVerification {
  constructor(
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly authSessionRepository: AuthSessionRepositoryPort,
    @Inject(OUTBOX_REPOSITORY)
    private readonly outboxRepository: OutboxRepositoryPort,
  ) {}

  async issueVerificationEmail(
    input: {
      userId: string;
      email: string;
      displayName: string | null;
    },
    executor?: TransactionExecutor,
  ): Promise<void> {
    const verificationToken = generateOpaqueToken();
    await this.authSessionRepository.storeEmailVerificationToken(
      {
        userId: input.userId,
        tokenHash: hashOpaqueToken(verificationToken),
        expiresAt: new Date(Date.now() + durationToMilliseconds("1d")),
      },
      executor,
    );

    await this.outboxRepository.create(
      {
        topic: "auth.send-verification-email",
        payload: {
          email: input.email,
          token: verificationToken,
          displayName: input.displayName ?? "",
        },
      },
      executor,
    );
  }
}

export { AUTH_EMAIL_VERIFICATION };
