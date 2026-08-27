import type { TransactionExecutor } from "@repo/api-runtime";

import { Inject, Injectable } from "@nestjs/common";
import { durationToMilliseconds, generateOpaqueToken, hashOpaqueToken } from "@repo/api-runtime";
import { OUTBOX_APPENDER, type OutboxAppenderPort } from "@repo/feature-outbox/contracts";

import {
  AUTH_SESSION_REPOSITORY,
  type AuthSessionRepositoryPort,
} from "../ports/auth-session.repository.port";

@Injectable()
export class AuthEmailVerificationService {
  constructor(
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly authSessionRepository: AuthSessionRepositoryPort,
    @Inject(OUTBOX_APPENDER)
    private readonly outbox: OutboxAppenderPort,
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

    await this.outbox.append(
      "auth.send-verification-email",
      {
        email: input.email,
        token: verificationToken,
        displayName: input.displayName ?? "",
      },
      executor,
    );
  }
}
