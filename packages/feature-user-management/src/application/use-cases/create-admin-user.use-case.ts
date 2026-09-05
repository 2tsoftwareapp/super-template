import type { AuthenticatedRequestUser, RequestContext } from "@repo/api-kernel";
import type { TransactionPort } from "@repo/api-kernel";
import type { PersonalOrganizationProvisioner } from "@repo/feature-organization-management/contracts";
import type { CreateAdminUserCommand, UserView } from "@repo/feature-users/contracts";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError, normalizeEmail, SYSTEM_SCOPE, TRANSACTION_PORT } from "@repo/api-kernel";
import { hashPassword } from "@repo/api-kernel";
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
import { ACTIVITY_EMITTER, type ActivityEmitter } from "@repo/feature-activities/contracts";
import { AUDIT_WRITER, type AuditWriter } from "@repo/feature-audit/contracts";
import { PERSONAL_ORGANIZATION_PROVISIONER } from "@repo/feature-organization-management/contracts";
import {
  ORGANIZATION_MEMBERSHIP,
  type OrganizationMemberRole,
  type OrganizationMembership,
} from "@repo/feature-organizations/contracts";
import { OUTBOX_APPENDER, type OutboxAppenderPort } from "@repo/feature-outbox/contracts";
import {
  USER_ERROR_CODES,
  USERS_REPOSITORY,
  type UsersRepositoryPort,
} from "@repo/feature-users/contracts";

import { resolveRoleById } from "../assignable-role.resolver";
import { GetUserUseCase } from "./get-user.use-case";

@Injectable()
export class CreateAdminUserUseCase {
  constructor(
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepositoryPort,
    @Inject(USER_ACCESS_CONTROL)
    private readonly accessControlService: UserAccessControl,
    @Inject(USER_PROFILE_INVALIDATOR)
    private readonly profileInvalidator: UserProfileInvalidator,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    @Inject(PERSONAL_ORGANIZATION_PROVISIONER)
    private readonly personalOrganizationProvisioner: PersonalOrganizationProvisioner,
    @Inject(ORGANIZATION_MEMBERSHIP)
    private readonly membership: OrganizationMembership,
    @Inject(OUTBOX_APPENDER)
    private readonly outbox: OutboxAppenderPort,
    @Inject(ACTIVITY_EMITTER) private readonly activityEmitter: ActivityEmitter,
    private readonly getUserUseCase: GetUserUseCase,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    input: CreateAdminUserCommand,
    requestContext?: RequestContext,
  ): Promise<UserView> {
    const email = normalizeEmail(input.email);
    const existingUser = await this.usersRepository.findByEmail(email);
    if (existingUser) {
      throw new AppError(
        USER_ERROR_CODES.USER_EMAIL_ALREADY_EXISTS,
        "A user with this email already exists",
        HttpStatus.CONFLICT,
      );
    }

    const actorIsSuperAdmin = actor.roles.includes(ROLE_NAMES.SUPER_ADMIN);

    const organizationId = actorIsSuperAdmin
      ? (input.organizationId ?? null)
      : (actor.organizationId ?? null);

    const status = input.status ?? "ACTIVE";

    const { userId } = await this.transactionPort.run(async (transaction) => {
      const user = await this.usersRepository.create(
        {
          email,
          passwordHash: await hashPassword(input.password),
          displayName: input.displayName,
          avatarUrl: input.avatarUrl ?? null,
          status,
          emailVerifiedAt: status === "ACTIVE" ? new Date() : null,
          mustChangePassword: true,
        },
        transaction,
      );

      const roleId =
        input.roleId ??
        (await this.accessControlService.getRoleByName(ROLE_NAMES.USER, null, transaction))?.id;
      if (!roleId) {
        throw new AppError(ERROR_CODES.INTERNAL_ERROR, "USER role is missing", 500);
      }
      const resolvedRole = await resolveRoleById(this.accessControlService, roleId, transaction);

      if (resolvedRole.organizationId !== null && resolvedRole.organizationId !== organizationId) {
        throw new AppError(
          ERROR_CODES.VALIDATION_FAILED,
          "Role does not belong to the selected organization",
          400,
        );
      }

      const assignmentOrganizationId = resolvedRole.organizationId ?? organizationId;
      assertRoleScopeCanBeAssigned(
        {
          name: resolvedRole.name,
          organizationId: assignmentOrganizationId,
          isSystem: resolvedRole.isSystem,
        },
        actor,
      );
      assertCanAssignRoleTargets(actor, [
        {
          name: resolvedRole.name,
          organizationId: assignmentOrganizationId,
          isSystem: resolvedRole.isSystem,
        },
      ]);
      this.accessControlService.assertCanAssignUserRoles(actor, [], [resolvedRole.name]);

      if (resolvedRole.name === ROLE_NAMES.ADMIN && !actorIsSuperAdmin) {
        throw new AppError(
          ERROR_CODES.AUTH_FORBIDDEN,
          "Only SUPER_ADMIN can assign the ADMIN role",
          HttpStatus.FORBIDDEN,
        );
      }

      if (resolvedRole.name === ROLE_NAMES.ADMIN && organizationId) {
        await this.membership.addMember(
          {
            organizationId,
            userId: user.id,
            role: "ADMIN" satisfies OrganizationMemberRole,
          },
          transaction,
        );
        await this.accessControlService.ensureOrganizationAdminRole(
          organizationId,
          user.id,
          transaction,
        );
      } else {
        const roleScope = resolvedRole.organizationId;

        await this.accessControlService.replaceUserRoles(
          user.id,
          [resolvedRole.id],
          roleScope,
          transaction,
        );

        if (organizationId) {
          const membership = await this.membership.findMembership(
            organizationId,
            user.id,
            transaction,
          );
          if (!membership) {
            await this.membership.addMember(
              {
                organizationId,
                userId: user.id,
                role: "MEMBER" satisfies OrganizationMemberRole,
              },
              transaction,
            );
          }
        } else if (actorIsSuperAdmin && resolvedRole.organizationId === null) {
          await this.personalOrganizationProvisioner.ensurePersonalOrganization(
            user.id,
            user.displayName,
            transaction,
          );
        }
      }

      if (status === "PENDING") {
        await this.outbox.append(
          "user.lifecycle.created",
          {
            userId: user.id,
            email: user.email,
            displayName: user.displayName ?? "",
          },
          transaction,
        );
      }

      await this.auditWriter.log(
        {
          actorId: actor.userId,
          action: "admin.user.created",
          entityType: "user",
          entityId: user.id,
          metadata: {
            email,
            status: user.status,
            roleId: resolvedRole.id,
            roleName: resolvedRole.name,
            organizationId,
          },
          requestContext,
          ...(organizationId
            ? { scope: SYSTEM_SCOPE.ORGANIZATION, organizationId: organizationId }
            : { scope: SYSTEM_SCOPE.PLATFORM }),
        },
        transaction,
      );

      if (organizationId) {
        await this.activityEmitter.emit(
          {
            organizationId,
            summary: `User "${user.displayName}" created`,
            entityType: "user",
            entityId: user.id,
            actorId: actor.userId,
            visibility: "INTERNAL",
            metadata: { email, status: user.status },
          },
          transaction,
        );
      }

      return { userId: user.id };
    });

    // Invalidate the cached access profile so the newly created user picks
    // up the assigned role on their next request.
    await this.profileInvalidator.invalidateAccessProfile(userId);

    return this.getUserUseCase.execute(userId, actor);
  }
}
