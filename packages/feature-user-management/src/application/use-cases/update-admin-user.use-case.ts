import type { AuthenticatedRequestUser, RequestContext } from "@repo/api-kernel";
import type { UpdateAdminUserCommand, UserView } from "@repo/feature-users/contracts";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError, normalizeEmail, SYSTEM_SCOPE } from "@repo/api-kernel";
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
import { USER_ERROR_CODES } from "@repo/feature-users/contracts";
import { USERS_REPOSITORY, type UsersRepositoryPort } from "@repo/feature-users/contracts";

import { assertUserBelongsToOrganization } from "../../user-org-scope.policy";
import { GetUserUseCase } from "./get-user.use-case";

@Injectable()
export class UpdateAdminUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepositoryPort,
    @Inject(USER_ACCESS_CONTROL)
    private readonly accessControlService: UserAccessControl,
    @Inject(ORGANIZATION_MEMBERSHIP)
    private readonly membership: OrganizationMembership,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    private readonly getUserUseCase: GetUserUseCase,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    userId: string,
    input: UpdateAdminUserCommand,
    requestContext?: RequestContext,
  ): Promise<UserView> {
    await assertUserBelongsToOrganization(this.membership, actor, userId);

    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new AppError(USER_ERROR_CODES.USER_NOT_FOUND, "User not found", HttpStatus.NOT_FOUND);
    }

    const targetProfile = await this.accessControlService.getAccessProfile(
      userId,
      actor.roles.includes(ROLE_NAMES.SUPER_ADMIN) ? null : (actor.organizationId ?? null),
    );
    this.accessControlService.assertCanManageUserAccount(actor, targetProfile.roles);

    if (input.email) {
      const existingUser = await this.usersRepository.findByEmail(normalizeEmail(input.email));
      if (existingUser && existingUser.id !== userId) {
        throw new AppError(
          USER_ERROR_CODES.USER_EMAIL_ALREADY_EXISTS,
          "A user with this email already exists",
          HttpStatus.CONFLICT,
        );
      }
    }

    const updated = await this.usersRepository.update(userId, {
      email: input.email ? normalizeEmail(input.email) : user.email,
      displayName: input.displayName ?? user.displayName,
      avatarUrl: input.avatarUrl === undefined ? user.avatarUrl : input.avatarUrl,
    });

    await this.auditWriter.log({
      actorId: actor.userId,
      action: "admin.user.updated",
      entityType: "user",
      entityId: userId,
      requestContext,
      ...(actor.organizationId
        ? { scope: SYSTEM_SCOPE.ORGANIZATION, organizationId: actor.organizationId }
        : { scope: SYSTEM_SCOPE.PLATFORM }),
    });

    return this.getUserUseCase.execute(updated?.id ?? userId, actor);
  }
}
