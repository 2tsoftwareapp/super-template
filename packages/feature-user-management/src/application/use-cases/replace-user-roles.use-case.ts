import type { AuthenticatedRequestUser, RequestContext } from "@repo/api-kernel";
import type { TransactionPort } from "@repo/api-kernel";
import type { UserView } from "@repo/feature-users/contracts";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError, SYSTEM_SCOPE, TRANSACTION_PORT } from "@repo/api-kernel";
import { ERROR_CODES } from "@repo/api-runtime";
import {
  assertCanAssignRoleTargets,
  assertRoleScopeCanBeAssigned,
  ROLE_NAMES,
  USER_ACCESS_CONTROL,
  USER_PROFILE_INVALIDATOR,
  type UserAccessControl,
  type UserProfileInvalidator,
} from "@repo/feature-access-control/contracts";
import { AUDIT_WRITER, type AuditWriter } from "@repo/feature-audit/contracts";
import {
  ORGANIZATION_MEMBERSHIP,
  type OrganizationMemberRole,
  type OrganizationMembership,
} from "@repo/feature-organizations/contracts";
import {
  USER_ERROR_CODES,
  USERS_REPOSITORY,
  type UsersRepositoryPort,
} from "@repo/feature-users/contracts";

import { assertUserBelongsToOrganization } from "../../domain/user-org-scope.policy";
import { resolveRoleById } from "../assignable-role.resolver";
import { GetUserUseCase } from "./get-user.use-case";

@Injectable()
export class ReplaceUserRolesUseCase {
  constructor(
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepositoryPort,
    @Inject(USER_ACCESS_CONTROL)
    private readonly accessControlService: UserAccessControl,
    @Inject(USER_PROFILE_INVALIDATOR)
    private readonly profileInvalidator: UserProfileInvalidator,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    @Inject(ORGANIZATION_MEMBERSHIP)
    private readonly membership: OrganizationMembership,
    private readonly getUserUseCase: GetUserUseCase,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    userId: string,
    roleId: string,
    organizationId: string | null,
    requestContext?: RequestContext,
  ): Promise<UserView> {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new AppError(USER_ERROR_CODES.USER_NOT_FOUND, "User not found", HttpStatus.NOT_FOUND);
    }

    if (actor.userId === userId) {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        "You cannot change your own roles",
        HttpStatus.FORBIDDEN,
      );
    }

    await assertUserBelongsToOrganization(this.membership, actor, userId);

    const actorIsSuperAdmin = actor.roles.includes(ROLE_NAMES.SUPER_ADMIN);
    const resolvedOrganizationId = actorIsSuperAdmin
      ? (organizationId ?? null)
      : (actor.organizationId ?? null);

    const [currentAccess, resolvedRole] = await Promise.all([
      this.accessControlService.getAccessProfile(
        userId,
        actorIsSuperAdmin ? null : actor.organizationId,
      ),
      resolveRoleById(this.accessControlService, roleId),
    ]);

    if (
      resolvedRole.organizationId !== null &&
      resolvedRole.organizationId !== resolvedOrganizationId
    ) {
      throw new AppError(
        ERROR_CODES.VALIDATION_FAILED,
        "Role does not belong to the selected organization",
        400,
      );
    }

    const rolePolicyTarget = {
      name: resolvedRole.name,
      organizationId: resolvedRole.organizationId,
      isSystem: resolvedRole.isSystem,
    };

    this.accessControlService.assertCanAssignUserRoles(actor, currentAccess.roles, [
      resolvedRole.name,
    ]);
    assertCanAssignRoleTargets(actor, [rolePolicyTarget]);
    assertRoleScopeCanBeAssigned(rolePolicyTarget, actor);

    await this.transactionPort.run(async (transaction) => {
      const roleScope = resolvedRole.organizationId ?? resolvedOrganizationId;

      if (roleScope) {
        const membership = await this.membership.findMembership(roleScope, userId, transaction);

        if (membership?.role === "OWNER") {
          throw new AppError(
            ERROR_CODES.AUTH_FORBIDDEN,
            "Cannot modify the roles of an organization owner",
            HttpStatus.FORBIDDEN,
          );
        }

        const targetMembershipRole: OrganizationMemberRole =
          resolvedRole.name === ROLE_NAMES.ADMIN ? "ADMIN" : "MEMBER";

        if (!membership) {
          await this.membership.addMember(
            {
              organizationId: roleScope,
              userId,
              role: targetMembershipRole,
            },
            transaction,
          );
        } else if (membership.role !== targetMembershipRole) {
          await this.membership.updateMemberRole(
            roleScope,
            userId,
            targetMembershipRole,
            transaction,
          );
        }
      }

      if (resolvedRole.name === ROLE_NAMES.ADMIN && roleScope) {
        await this.accessControlService.ensureOrganizationAdminRole(roleScope, userId, transaction);
        await this.accessControlService.replaceUserRoles(
          userId,
          [resolvedRole.id],
          roleScope,
          transaction,
        );
      } else {
        const replaceOrgId =
          roleScope ?? (actorIsSuperAdmin ? null : (actor.organizationId ?? null));
        await this.accessControlService.replaceUserRoles(
          userId,
          [resolvedRole.id],
          replaceOrgId,
          transaction,
        );
      }

      await this.auditWriter.log(
        {
          actorId: actor.userId,
          action: "user.roles.replaced",
          entityType: "user",
          entityId: userId,
          metadata: {
            roleId,
            roleName: resolvedRole.name,
            organizationId: resolvedOrganizationId,
          },
          requestContext,
          ...(resolvedOrganizationId
            ? { scope: SYSTEM_SCOPE.ORGANIZATION, organizationId: resolvedOrganizationId }
            : { scope: SYSTEM_SCOPE.PLATFORM }),
        },
        transaction,
      );
    });

    await this.profileInvalidator.invalidateAccessProfile(userId);

    return this.getUserUseCase.execute(userId, actor);
  }
}
