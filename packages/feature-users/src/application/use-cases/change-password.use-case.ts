import type { AuthenticatedRequestUser, RequestContext } from "@repo/api-runtime";
import type { TransactionPort } from "@repo/api-runtime";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import {AppError, SYSTEM_SCOPE } from "@repo/api-runtime";
import { AUDIT_WRITER, type AuditWriter } from "@repo/feature-audit/contracts";
import { TRANSACTION_PORT } from "@repo/api-runtime";
import {
  OUTBOX_APPENDER,
  type OutboxAppenderPort,
} from "@repo/feature-outbox/contracts";
import { hashPassword, verifyPassword } from "@repo/utils/password";

import { USERS_REPOSITORY, type UsersRepositoryPort } from "../ports/users.repository.port";

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepositoryPort,
    @Inject(OUTBOX_APPENDER) private readonly outbox: OutboxAppenderPort,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    currentPassword: string,
    newPassword: string,
    requestContext?: RequestContext,
  ) {
    const user = await this.usersRepository.findById(actor.userId);

    if (!user) {
      throw new AppError(USER_ERROR_CODES.USER_NOT_FOUND, "User not found", HttpStatus.NOT_FOUND);
    }

    const passwordMatches = await verifyPassword(user.passwordHash, currentPassword);

    if (!passwordMatches) {
      throw new AppError(
        AUTH_ERROR_CODES.AUTH_INVALID_CREDENTIALS,
        "Current password is incorrect",
        HttpStatus.UNAUTHORIZED,
      );
    }

    await this.transactionPort.run(async (transaction) => {
      await this.usersRepository.update(
        actor.userId,
        {
          passwordHash: await hashPassword(newPassword),
          mustChangePassword: false,
        },
        transaction,
      );
      await this.outbox.append(
        "user.lifecycle.password-changed",
        { userId: actor.userId },
        transaction,
      );
      await this.auditWriter.log(
        {
          actorId: actor.userId,
          action: "user.password.changed",
          entityType: "user",
          entityId: actor.userId,
          requestContext,
          ...(actor.organizationId
            ? { scope: SYSTEM_SCOPE.ORGANIZATION, organizationId: actor.organizationId }
            : { scope: SYSTEM_SCOPE.PLATFORM }),
        },
        transaction,
      );
    });
  }
}

import { AUTH_ERROR_CODES } from "@repo/feature-auth/contracts";
import { USER_ERROR_CODES } from "@repo/feature-users/contracts";
