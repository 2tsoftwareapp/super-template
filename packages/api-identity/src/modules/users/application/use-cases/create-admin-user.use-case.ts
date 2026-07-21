import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';
import type { TransactionPort } from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { 
  AppError,
  AUDIT_WRITER,
  type AuditWriter,
  durationToMilliseconds,
  ERROR_CODES,
  normalizeEmail,
  SYSTEM_SCOPE,
} from '@repo/api-core';
import { TRANSACTION_PORT } from '@repo/api-core';

import type { CreateAdminUserCommand, UserView } from '../users.types';

import { ROLE_NAMES } from '../../../access-control/access-control.constants';
import { AccessControlService } from '../../../access-control/application/access-control.service';
import {
  assertCanAssignRoleTargets,
  assertRoleScopeCanBeAssigned,
} from '../../../access-control/domain/role-assignment.policy';
import {
  generateOpaqueToken,
  hashOpaqueToken,
  hashPassword,
} from '../../../auth/application/auth.helpers';
import { AUTH_SESSION_REPOSITORY, type AuthSessionRepositoryPort } from '../../../auth/application/ports/auth-session.repository.port';
import { OUTBOX_REPOSITORY, type OutboxRepositoryPort } from '../../../auth/application/ports/outbox.repository.port';
import { OrganizationsService } from '../../../organizations/application/organizations.service';
import { ORGANIZATIONS_REPOSITORY, type OrganizationsRepositoryPort } from '../../../organizations/application/ports/organizations.repository.port';
import { resolveRoleById } from '../assignable-role.resolver';
import {
  USERS_REPOSITORY,
  type UsersRepositoryPort,
} from '../ports/users.repository.port';
import { GetUserUseCase } from './get-user.use-case';

@Injectable()
export class CreateAdminUserUseCase {
  constructor(
    @Inject(TRANSACTION_PORT) private readonly transactionPort: TransactionPort,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepositoryPort,
    private readonly accessControlService: AccessControlService,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    @Inject(OUTBOX_REPOSITORY) private readonly outboxRepository: OutboxRepositoryPort,
    private readonly organizationsService: OrganizationsService,
    @Inject(ORGANIZATIONS_REPOSITORY) private readonly organizationsRepository: OrganizationsRepositoryPort,
    @Inject(AUTH_SESSION_REPOSITORY) private readonly authRepository: AuthSessionRepositoryPort,
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
        'A user with this email already exists',
        HttpStatus.CONFLICT,
      );
    }

    const actorIsSuperAdmin = actor.roles.includes(ROLE_NAMES.SUPER_ADMIN);

    const organizationId = actorIsSuperAdmin
      ? (input.organizationId ?? null)
      : (actor.organizationId ?? null);

    const status = input.status ?? 'ACTIVE';

    const { userId } = await this.transactionPort.run(
      async (transaction) => {
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
            emailVerifiedAt: status === 'ACTIVE' ? new Date() : null,
            // Force the user to change their password on first login since
            // the admin chose it, not the user.
            mustChangePassword: true,
          },
          transaction,
        );

        const roleId = input.roleId
          ?? (await this.accessControlService.getRoleByName(ROLE_NAMES.USER, null, transaction))?.id;
        if (!roleId) {
          throw new AppError(ERROR_CODES.INTERNAL_ERROR, 'USER role is missing', 500);
        }
        const resolvedRole = await resolveRoleById(this.accessControlService, roleId, transaction);

        if (
          resolvedRole.organizationId !== null &&
          resolvedRole.organizationId !== organizationId
        ) {
          throw new AppError(
            ERROR_CODES.VALIDATION_FAILED,
            'Role does not belong to the selected organization',
            400,
          );
        }

        assertRoleScopeCanBeAssigned(
          { name: resolvedRole.name, organizationId: resolvedRole.organizationId, isSystem: resolvedRole.isSystem },
          actor,
        );
        assertCanAssignRoleTargets(
          actor,
          [{ name: resolvedRole.name, organizationId: resolvedRole.organizationId, isSystem: resolvedRole.isSystem }],
        );
        this.accessControlService.assertCanAssignUserRoles(
          actor,
          [],
          [resolvedRole.name],
        );

        if (resolvedRole.name === ROLE_NAMES.ADMIN && !actorIsSuperAdmin) {
          throw new AppError(
            ERROR_CODES.AUTH_FORBIDDEN,
            'Only SUPER_ADMIN can assign the ADMIN role',
            HttpStatus.FORBIDDEN,
          );
        }

        if (resolvedRole.name === ROLE_NAMES.ADMIN && organizationId) {
          await this.organizationsRepository.addMember(
            {
              organizationId,
              userId: user.id,
              role: 'ADMIN',
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
            const membership = await this.organizationsRepository.findMembership(
              organizationId,
              user.id,
              transaction,
            );
            if (!membership) {
              await this.organizationsRepository.addMember(
                {
                  organizationId,
                  userId: user.id,
                  role: 'MEMBER',
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

        if (status === 'PENDING') {
          const verificationToken = generateOpaqueToken();
          await this.authRepository.storeEmailVerificationToken(
            {
              userId: user.id,
              tokenHash: hashOpaqueToken(verificationToken),
              expiresAt: new Date(
                Date.now() + durationToMilliseconds('1d'),
              ),
            },
            transaction,
          );

          await this.outboxRepository.create(
            {
              topic: 'auth.send-verification-email',
              payload: { email: user.email, token: verificationToken, displayName: user.displayName },
            },
            transaction,
          );
        }

        await this.auditWriter.log(
          {
            actorId: actor.userId,
            action: 'admin.user.created',
          entityType: 'user',
          entityId: user.id,
          metadata: {
            email,
            status: user.status,
            roleId: resolvedRole.id,
            roleName: resolvedRole.name,
            organizationId,
          },
            requestContext,
              ...(organizationId ? { scope: SYSTEM_SCOPE.ORGANIZATION, organizationId: organizationId } : { scope: SYSTEM_SCOPE.PLATFORM })
        },
          transaction,
        );

        return { userId: user.id };
      },
    );

    return this.getUserUseCase.execute(userId, actor);
  }
}
