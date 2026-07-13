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
  ERROR_CODES,
} from '@repo/api-core';
import { DATABASE, runInTransaction } from '@repo/api-database';

import type { AssignableRoleName, UserView } from '../users.types';

import { ROLE_NAMES } from '../../../access-control/access-control.constants';
import { AccessControlService } from '../../../access-control/application/access-control.service';
import {
  assertCanAssignRoleTargets,
  assertRoleScopeCanBeAssigned,
} from '../../../access-control/domain/role-assignment.policy';
import { assertUserBelongsToOrganization } from '../../domain/user-org-scope.policy';
import { resolveAssignableRole } from '../assignable-role.resolver';
import {
  USERS_REPOSITORY,
  type UsersRepositoryPort,
} from '../users.repository.port';
import { GetUserUseCase } from './get-user.use-case';

@Injectable()
export class ReplaceUserRolesUseCase {
  constructor(
    @Inject(DATABASE) private readonly database: DatabaseClient,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepositoryPort,
    private readonly accessControlService: AccessControlService,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    private readonly getUserUseCase: GetUserUseCase,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    userId: string,
    role: AssignableRoleName,
    organizationId: string | undefined,
    requestContext?: RequestContext,
  ): Promise<UserView> {
    const user = await this.usersRepository.findById(userId);

    if (!user) {
      throw new AppError(
        ERROR_CODES.USER_NOT_FOUND,
        'User not found',
        HttpStatus.NOT_FOUND,
      );
    }

    if (actor.userId === userId) {
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        'You cannot change your own roles',
        HttpStatus.FORBIDDEN,
      );
    }

    await assertUserBelongsToOrganization(
      (targetUserId, orgId) =>
        this.usersRepository.isUserInOrganization(targetUserId, orgId),
      actor,
      userId,
    );

    const actorIsSuperAdmin = actor.roles.includes(ROLE_NAMES.SUPER_ADMIN);
    const resolvedOrganizationId = actorIsSuperAdmin
      ? (organizationId ?? null)
      : (actor.organizationId ?? null);

    if (role === ROLE_NAMES.ADMIN && !resolvedOrganizationId) {
      throw new AppError(
        ERROR_CODES.VALIDATION_FAILED,
        'organizationId is required when assigning ADMIN',
        HttpStatus.BAD_REQUEST,
      );
    }

    const [currentAccess, resolvedRole] = await Promise.all([
      this.accessControlService.getAccessProfile(
        userId,
        actorIsSuperAdmin ? null : actor.organizationId,
      ),
      resolveAssignableRole(
        this.accessControlService,
        role,
        resolvedOrganizationId,
      ),
    ]);

    this.accessControlService.assertCanAssignUserRoles(
      actor,
      currentAccess.roles,
      [resolvedRole.target.name],
    );
    assertCanAssignRoleTargets(actor, [resolvedRole.target]);
    assertRoleScopeCanBeAssigned(resolvedRole.target, actor);

    await runInTransaction(this.database, async (transaction) => {
      if (role === ROLE_NAMES.ADMIN && resolvedOrganizationId) {
        await this.accessControlService.ensureOrganizationAdminRole(
          resolvedOrganizationId,
          userId,
          transaction,
        );
      } else {
        await this.accessControlService.replaceUserRoles(
          userId,
          [resolvedRole.id],
          actorIsSuperAdmin ? undefined : actor.organizationId,
          transaction,
        );
      }

      await this.auditWriter.log(
        {
          actorId: actor.userId,
          action: 'user.roles.replaced',
          entityType: 'user',
          entityId: userId,
          metadata: {
            role,
            organizationId: resolvedOrganizationId,
          },
          requestContext,
        },
        transaction,
      );
    });

    return this.getUserUseCase.execute(userId, actor);
  }
}
