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

import { ROLE_NAMES } from '../../../access-control/access-control.constants';
import { AccessControlService } from '../../../access-control/application/access-control.service';
import { AUTH_SESSION_REPOSITORY, type AuthSessionRepositoryPort } from '../../../auth/application/ports/auth-session.repository.port';
import { assertUserBelongsToOrganization } from '../../domain/user-org-scope.policy';
import {
  USERS_REPOSITORY,
  type UsersRepositoryPort,
} from '../ports/users.repository.port';

@Injectable()
export class DeleteUserUseCase {
  constructor(
    @Inject(DATABASE) private readonly database: DatabaseClient,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepositoryPort,
    private readonly accessControlService: AccessControlService,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    @Inject(AUTH_SESSION_REPOSITORY) private readonly authRepository: AuthSessionRepositoryPort,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    userId: string,
    requestContext?: RequestContext,
  ) {
    await assertUserBelongsToOrganization(
      (targetUserId, organizationId) =>
        this.usersRepository.isUserInOrganization(targetUserId, organizationId),
      actor,
      userId,
    );

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
        'You cannot delete your own account',
        HttpStatus.FORBIDDEN,
      );
    }

    // Org-scoped roles (e.g. an organization ADMIN) are invisible to
    // getAccessProfile unless the relevant organizationId is passed, so the
    // privileged-account check below would otherwise silently miss them.
    const targetProfile = await this.accessControlService.getAccessProfile(
      userId,
      actor.roles.includes(ROLE_NAMES.SUPER_ADMIN)
        ? null
        : (actor.organizationId ?? null),
    );
    this.accessControlService.assertCanManageUserAccount(
      actor,
      targetProfile.roles,
    );

    await runInTransaction(this.database, async (transaction) => {
      await this.usersRepository.softDelete(userId, transaction);
      await this.authRepository.revokeAllSessionsForUser(userId, transaction);
      await this.auditWriter.log(
        {
          actorId: actor.userId,
          action: 'admin.user.deleted',
          entityType: 'user',
          entityId: userId,
          requestContext,
        },
        transaction,
      );
    });
  }
}
