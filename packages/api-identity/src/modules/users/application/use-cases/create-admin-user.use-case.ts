import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';
import type { DatabaseClient } from '@repo/api-database';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  AppError,
  AUDIT_WRITER,
  type AuditWriter,
  durationToMilliseconds,
  ERROR_CODES,
  normalizeEmail,
} from '@repo/api-core';
import { DATABASE, runInTransaction } from '@repo/api-database';

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
import { AuthMailService } from '../../../auth/application/services/auth-mail.service';
import { AuthRepository } from '../../../auth/infrastructure/auth.repository';
import { OrganizationsService } from '../../../organizations/application/organizations.service';
import { OrganizationsRepository } from '../../../organizations/infrastructure/organizations.repository';
import { resolveAssignableRole } from '../../domain/assignable-role.resolver';
import {
  USERS_REPOSITORY,
  type UsersRepositoryPort,
} from '../users.repository.port';
import { GetUserUseCase } from './get-user.use-case';

@Injectable()
export class CreateAdminUserUseCase {
  constructor(
    @Inject(DATABASE) private readonly database: DatabaseClient,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepositoryPort,
    private readonly accessControlService: AccessControlService,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    private readonly organizationsService: OrganizationsService,
    private readonly organizationsRepository: OrganizationsRepository,
    private readonly authRepository: AuthRepository,
    private readonly authMailService: AuthMailService,
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

    const result = await runInTransaction(
      this.database,
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
            actorIsSuperAdmin ? undefined : actor.organizationId,
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

        let verificationToken: string | undefined;
        if (status === 'PENDING') {
          verificationToken = generateOpaqueToken();
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

        return {
          userId: user.id,
          email: user.email,
          displayName: user.displayName,
          verificationToken,
        };
      },
    );

    if (result.verificationToken) {
      await this.authMailService.sendVerificationEmail(
        result.email,
        result.verificationToken,
      );
    }

    return this.getUserUseCase.execute(result.userId, actor);
  }
}
