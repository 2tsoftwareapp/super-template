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
import { resolveAssignableRole } from '../assignable-role.resolver';
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
    await this.usersRepository.assertEmailAvailable(email);

    const actorIsSuperAdmin = actor.roles.includes(ROLE_NAMES.SUPER_ADMIN);
    // Resolve the requested role as-is (not silently downgraded) so that a
    // non-SUPER_ADMIN requesting ADMIN is rejected explicitly with 403 by
    // assertRoleScopeCanBeAssigned below, instead of getting a confusing 201
    // for a USER account they never asked for.
    const roleName = input.role ?? ROLE_NAMES.USER;

    if (roleName === ROLE_NAMES.ADMIN && !actorIsSuperAdmin) {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        'Only SUPER_ADMIN can assign the ADMIN role',
        HttpStatus.FORBIDDEN,
      );
    }

    const organizationId = actorIsSuperAdmin
      ? (input.organizationId ?? null)
      : (actor.organizationId ?? null);

    if (roleName === ROLE_NAMES.ADMIN && !organizationId) {
      throw new AppError(
        ERROR_CODES.VALIDATION_FAILED,
        'organizationId is required when creating an ADMIN user',
        HttpStatus.BAD_REQUEST,
      );
    }

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

        const resolvedRole = await resolveAssignableRole(
          this.accessControlService,
          roleName,
          organizationId,
          transaction,
        );

        assertRoleScopeCanBeAssigned(resolvedRole.target, actor);
        assertCanAssignRoleTargets(actor, [resolvedRole.target]);
        this.accessControlService.assertCanAssignUserRoles(
          actor,
          [],
          [resolvedRole.target.name],
        );

        if (roleName === ROLE_NAMES.ADMIN && organizationId) {
          await this.organizationsRepository.addMember(
            {
              organizationId,
              userId: user.id,
              role: 'MEMBER',
            },
            transaction,
          );
          await this.accessControlService.ensureOrganizationAdminRole(
            organizationId,
            user.id,
            transaction,
          );
        } else {
          await this.accessControlService.replaceUserRoles(
            user.id,
            [resolvedRole.id],
            actorIsSuperAdmin ? null : (actor.organizationId ?? null),
            transaction,
          );

          if (actorIsSuperAdmin && !organizationId) {
            await this.organizationsService.ensurePersonalOrganization(
              user.id,
              user.displayName,
              transaction,
            );
          } else if (organizationId) {
            await this.organizationsRepository.addMember(
              {
                organizationId,
                userId: user.id,
                role: 'MEMBER',
              },
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
              role: roleName,
              organizationId,
            },
            requestContext,
          },
          transaction,
        );

        return { userId: user.id };
      },
    );

    return this.getUserUseCase.execute(userId, actor);
  }
}
