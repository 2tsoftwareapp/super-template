import type { AuthenticatedRequestUser, RequestContext } from "@repo/api-runtime";
import type { TransactionPort } from "@repo/api-runtime";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { ERROR_CODES } from "@repo/api-runtime";
import { AppError, SYSTEM_SCOPE, TRANSACTION_PORT } from "@repo/api-runtime";
import { AccessControlService, ROLE_NAMES } from "@repo/feature-access-control/contracts";
import { ACTIVITY_EMITTER, type ActivityEmitter } from "@repo/feature-activities/contracts";
import { AUDIT_WRITER, type AuditWriter } from "@repo/feature-audit/contracts";
import { OUTBOX_APPENDER, type OutboxAppenderPort } from "@repo/feature-outbox/contracts";
import { USER_ERROR_CODES } from "@repo/feature-users/contracts";

import type { UserStatus, UserView } from "../users.types";

import { assertUserBelongsToOrganization } from "../../domain/user-org-scope.policy";
import { USERS_REPOSITORY, type UsersRepositoryPort } from "../ports/users.repository.port";
import { GetUserUseCase } from "./get-user.use-case";

@Injectable()
export class UpdateUserStatusUseCase {
  constructor(
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepositoryPort,
    private readonly accessControlService: AccessControlService,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    @Inject(OUTBOX_APPENDER) private readonly outbox: OutboxAppenderPort,
    @Inject(ACTIVITY_EMITTER) private readonly activityEmitter: ActivityEmitter,
    private readonly getUserUseCase: GetUserUseCase,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    userId: string,
    status: UserStatus,
    requestContext?: RequestContext,
  ): Promise<UserView> {
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
        "You cannot change your own account status",
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
      await this.usersRepository.update(
        userId,
        {
          status,
          emailVerifiedAt:
            status === "ACTIVE" ? (user.emailVerifiedAt ?? new Date()) : user.emailVerifiedAt,
        },
        transaction,
      );

      if (status === "BLOCKED") {
        // Auth subscribes to this lifecycle event and revokes sessions.
        await this.outbox.append("user.lifecycle.status-blocked", { userId }, transaction);
      }

      await this.auditWriter.log(
        {
          actorId: actor.userId,
          action: status === "BLOCKED" ? "user.blocked" : "user.unblocked",
          entityType: "user",
          entityId: userId,
          metadata: { status },
          requestContext,
          ...(actor.organizationId
            ? { scope: SYSTEM_SCOPE.ORGANIZATION, organizationId: actor.organizationId }
            : { scope: SYSTEM_SCOPE.PLATFORM }),
        },
        transaction,
      );

      if (actor.organizationId) {
        await this.activityEmitter.emit(
          {
            organizationId: actor.organizationId,
            summary:
              status === "BLOCKED"
                ? `User "${user.displayName}" blocked`
                : `User "${user.displayName}" activated`,
            entityType: "user",
            entityId: userId,
            actorId: actor.userId,
            visibility: "INTERNAL",
            metadata: { status },
          },
          transaction,
        );
      }
    });

    return this.getUserUseCase.execute(userId, actor);
  }
}
