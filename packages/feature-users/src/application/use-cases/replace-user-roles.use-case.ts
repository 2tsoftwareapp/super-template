import type { AuthenticatedRequestUser, RequestContext } from "@repo/api-runtime";
import type { TransactionPort } from "@repo/api-runtime";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import {
  AppError,
  AUDIT_WRITER,
  type AuditWriter,
  ERROR_CODES,
  SYSTEM_SCOPE,
} from "@repo/api-runtime";
import { TRANSACTION_PORT } from "@repo/api-runtime";
import { AccessControlService, ROLE_NAMES } from "@repo/feature-access-control/contracts";
import { assertCanAssignRoleTargets, assertRoleScopeCanBeAssigned } from "@repo/feature-access-control/contracts";
import { ORGANIZATIONS_REPOSITORY, type OrganizationsRepositoryPort } from "@repo/feature-organizations/contracts";

import type { UserView } from "../users.types";

import { assertUserBelongsToOrganization } from "../../domain/user-org-scope.policy";
import { resolveRoleById } from "../assignable-role.resolver";
import { USERS_REPOSITORY, type UsersRepositoryPort } from "../ports/users.repository.port";
import { GetUserUseCase } from "./get-user.use-case";

@Injectable()
export class ReplaceUserRolesUseCase {
  constructor(
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepositoryPort,
    private readonly accessControlService: AccessControlService,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    @Inject(ORGANIZATIONS_REPOSITORY)
    private readonly organizationsRepository: OrganizationsRepositoryPort,
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
      throw new AppError(ERROR_CODES.USER_NOT_FOUND, "User not found", HttpStatus.NOT_FOUND);
    }

    if (actor.userId === userId) {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        "You cannot change your own roles",
        HttpStatus.FORBIDDEN,
      );
    }

    await assertUserBelongsToOrganization(
      (targetUserId, orgId) => this.usersRepository.isUserInOrganization(targetUserId, orgId),
      actor,
      userId,
    );

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
        const membership = await this.organizationsRepository.findMembership(
          roleScope,
          userId,
          transaction,
        );

        if (membership?.role === "OWNER") {
          throw new AppError(
            ERROR_CODES.AUTH_FORBIDDEN,
            "Cannot modify the roles of an organization owner",
            HttpStatus.FORBIDDEN,
          );
        }

        const targetMembershipRole = resolvedRole.name === ROLE_NAMES.ADMIN ? "ADMIN" : "MEMBER";

        if (!membership) {
          await this.organizationsRepository.addMember(
            {
              organizationId: roleScope,
              userId,
              role: targetMembershipRole,
            },
            transaction,
          );
        } else if (membership.role !== targetMembershipRole) {
          await this.organizationsRepository.updateMemberRole(
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

    return this.getUserUseCase.execute(userId, actor);
  }
}
