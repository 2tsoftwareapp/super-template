import type { AuthenticatedRequestUser, RequestContext } from "@repo/api-runtime";
import type { TransactionPort } from "@repo/api-runtime";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import {
  ACTIVITY_EMITTER,
  type ActivityEmitter,
  AppError,
  AUDIT_WRITER,
  type AuditWriter,
  ERROR_CODES,
  normalizeEmail,
  SYSTEM_SCOPE,
  TRANSACTION_PORT,
} from "@repo/api-runtime";
import {
  AUTH_EMAIL_VERIFICATION,
  type AuthEmailVerification,
  hashPassword,
  ORGANIZATION_MEMBERSHIP,
  type OrganizationMembership,
} from "@repo/api-runtime";
import { AccessControlService, ROLE_NAMES } from "@repo/feature-access-control/contracts";
import { assertCanAssignRoleTargets, assertRoleScopeCanBeAssigned } from "@repo/feature-access-control/contracts";
import { OrganizationsService } from "@repo/feature-organizations/contracts";

import type { CreateAdminUserCommand, UserView } from "../users.types";

import { resolveRoleById } from "../assignable-role.resolver";
import { USERS_REPOSITORY, type UsersRepositoryPort } from "../ports/users.repository.port";
import { GetUserUseCase } from "./get-user.use-case";

@Injectable()
export class CreateAdminUserUseCase {
  constructor(
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepositoryPort,
    private readonly accessControlService: AccessControlService,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    private readonly organizationsService: OrganizationsService,
    @Inject(ORGANIZATION_MEMBERSHIP)
    private readonly membership: OrganizationMembership,
    @Inject(AUTH_EMAIL_VERIFICATION)
    private readonly authEmailVerification: AuthEmailVerification,
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
        ERROR_CODES.USER_EMAIL_ALREADY_EXISTS,
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
          // An admin explicitly setting ACTIVE is vouching for the account, so it
          // must be usable immediately instead of being stuck behind the email
          // verification gate in LoginUseCase.
          emailVerifiedAt: status === "ACTIVE" ? new Date() : null,
          // Force the user to change their password on first login since
          // the admin chose it, not the user.
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
            role: "ADMIN",
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
                role: "MEMBER",
              },
              transaction,
            );
          }
        } else if (actorIsSuperAdmin && resolvedRole.organizationId === null) {
          await this.organizationsService.ensurePersonalOrganization(
            user.id,
            user.displayName,
            transaction,
          );
        }
      }

      if (status === "PENDING") {
        await this.authEmailVerification.issueVerificationEmail(
          {
            userId: user.id,
            email: user.email,
            displayName: user.displayName,
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

    return this.getUserUseCase.execute(userId, actor);
  }
}
