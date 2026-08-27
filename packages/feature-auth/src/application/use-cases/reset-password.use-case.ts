import type { RequestContext } from "@repo/api-runtime";
import type { TransactionPort } from "@repo/api-runtime";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError, ERROR_CODES, SYSTEM_SCOPE } from "@repo/api-runtime";
import { AUDIT_WRITER, type AuditWriter } from "@repo/feature-audit/contracts";
import { TRANSACTION_PORT } from "@repo/api-runtime";
import { AUTH_USER_STORE, type AuthUserStore } from "@repo/feature-auth/contracts";

import type { ResetPasswordCommand } from "../auth.types";

import { hashOpaqueToken, hashPassword } from "../auth.helpers";
import {
  AUTH_SESSION_REPOSITORY,
  type AuthSessionRepositoryPort,
} from "../ports/auth-session.repository.port";

@Injectable()
export class ResetPasswordUseCase {
  constructor(
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
    @Inject(AUTH_USER_STORE)
    private readonly usersRepository: AuthUserStore,
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly authSessionRepository: AuthSessionRepositoryPort,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
  ) {}

  async execute(input: ResetPasswordCommand, requestContext?: RequestContext) {
    const tokenHash = hashOpaqueToken(input.token);
    const token = await this.authSessionRepository.findValidPasswordResetToken(tokenHash);

    if (!token) {
      throw new AppError(
        ERROR_CODES.AUTH_UNAUTHORIZED,
        "Reset token is invalid or expired",
        HttpStatus.UNAUTHORIZED,
      );
    }

    await this.transactionPort.run(async (transaction) => {
      await this.usersRepository.update(
        token.userId,
        {
          passwordHash: await hashPassword(input.newPassword),
        },
        transaction,
      );
      await this.authSessionRepository.consumePasswordResetToken(token.id, transaction);
      await this.authSessionRepository.revokeAllSessionsForUser(token.userId, transaction);
      await this.auditWriter.log(
        {
          actorId: token.userId,
          action: "auth.password_reset.completed",
          entityType: "user",
          entityId: token.userId,
          requestContext,
          scope: SYSTEM_SCOPE.PLATFORM,
        },
        transaction,
      );
    });

    return { success: true };
  }
}
