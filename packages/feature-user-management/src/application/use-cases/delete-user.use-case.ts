import type { AuthenticatedRequestUser, RequestContext } from "@repo/api-kernel";
import type { TransactionPort } from "@repo/api-kernel";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError, SYSTEM_SCOPE, TRANSACTION_PORT } from "@repo/api-kernel";
import { ERROR_CODES } from "@repo/api-runtime";
import {
  ROLE_NAMES,
  USER_ACCESS_CONTROL,
  type UserAccessControl,
} from "@repo/feature-access-control/contracts";
import { AUDIT_WRITER, type AuditWriter } from "@repo/feature-audit/contracts";
import {
  ORGANIZATION_MEMBERSHIP,
  type OrganizationMembership,
} from "@repo/feature-organizations/contracts";
import { OUTBOX_APPENDER, type OutboxAppenderPort } from "@repo/feature-outbox/contracts";
import { USER_ERROR_CODES } from "@repo/feature-users/contracts";
import { USERS_REPOSITORY, type UsersRepositoryPort } from "@repo/feature-users/contracts";

import { assertUserBelongsToOrganization } from "../../domain/user-org-scope.policy";

@Injectable()
export class DeleteUserUseCase {
  constructor(
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepositoryPort,
    @Inject(USER_ACCESS_CONTROL)
    private readonly accessControlService: UserAccessControl,
    @Inject(ORGANIZATION_MEMBERSHIP)
    private readonly membership: OrganizationMembership,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    @Inject(OUTBOX_APPENDER) private readonly outbox: OutboxAppenderPort,
  ) {}

  async execute(actor: AuthenticatedRequestUser, userId: string, requestContext?: RequestContext) {
    await assertUserBelongsToOrganization(this.membership, actor, userId);

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
