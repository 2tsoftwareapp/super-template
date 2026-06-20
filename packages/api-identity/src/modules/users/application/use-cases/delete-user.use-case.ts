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

import { AccessControlService } from '../../../access-control/application/access-control.service';
import { AuthRepository } from '../../../auth/infrastructure/auth.repository';
import { assertUserBelongsToOrganization } from '../../domain/user-org-scope.policy';
import {
  USERS_REPOSITORY,
  type UsersRepositoryPort,
} from '../users.repository.port';

@Injectable()
export class DeleteUserUseCase {
  constructor(
    @Inject(DATABASE) private readonly database: DatabaseClient,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepositoryPort,
    private readonly accessControlService: AccessControlService,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    private readonly authRepository: AuthRepository,
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

    const targetProfile =
      await this.accessControlService.getAccessProfile(userId);
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
