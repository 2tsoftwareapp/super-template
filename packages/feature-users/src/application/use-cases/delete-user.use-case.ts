import type { AuthenticatedRequestUser, RequestContext } from "@repo/api-runtime";
import type { TransactionPort } from "@repo/api-runtime";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import {AppError, SYSTEM_SCOPE } from "@repo/api-runtime";
import { AUDIT_WRITER, type AuditWriter } from "@repo/feature-audit/contracts";
import { TRANSACTION_PORT } from "@repo/api-runtime";
import { AccessControlService, ROLE_NAMES } from "@repo/feature-access-control/contracts";
import {
  OUTBOX_APPENDER,
  type OutboxAppenderPort,
} from "@repo/feature-outbox/contracts";

import { assertUserBelongsToOrganization } from "../../domain/user-org-scope.policy";
import { USERS_REPOSITORY, type UsersRepositoryPort } from "../ports/users.repository.port";

@Injectable()
export class DeleteUserUseCase {
  constructor(
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepositoryPort,
    private readonly accessControlService: AccessControlService,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    @Inject(OUTBOX_APPENDER) private readonly outbox: OutboxAppenderPort,
  ) {}

  async execute(actor: AuthenticatedRequestUser, userId: string, requestContext?: RequestContext) {
    await assertUserBelongsToOrganization(
      (targetUserId, organizationId) =>
        this.usersRepository.isUserInOrganization(targetUserId, organizationId),
      actor,
      userId,
    );

    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new AppError(USER_ERROR_CODES.USER_NOT_FOUND, "User not found", HttpStatus.NOT_FOUND);
    }

    if (actor.userId === userId) {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        "You cannot delete your own account",
        HttpStatus.FORBIDDEN,
      );
    }

    // Org-scoped roles (e.g. an organization ADMIN) are invisible to
    // getAccessProfile unless the relevant organizationId is passed, so the
    // privileged-account check below would otherwise silently miss them.
    const targetProfile = await this.accessControlService.getAccessProfile(
      userId,
      actor.roles.includes(ROLE_NAMES.SUPER_ADMIN) ? null : (actor.organizationId ?? null),
    );
    this.accessControlService.assertCanManageUserAccount(actor, targetProfile.roles);

    await this.transactionPort.run(async (transaction) => {
      await this.usersRepository.softDelete(userId, transaction);
      await this.outbox.append("user.lifecycle.deleted", { userId }, transaction);
      await this.auditWriter.log(
        {
          actorId: actor.userId,
          action: "admin.user.deleted",
          entityType: "user",
          entityId: userId,
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

import { ERROR_CODES } from "@repo/api-runtime";
import { USER_ERROR_CODES } from "@repo/feature-users/contracts";
