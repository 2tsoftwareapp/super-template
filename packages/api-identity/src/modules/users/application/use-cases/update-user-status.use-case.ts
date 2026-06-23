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

import type { UserStatus, UserView } from '../users.types';

import { ROLE_NAMES } from '../../../access-control/access-control.constants';
import { AccessControlService } from '../../../access-control/application/access-control.service';
import { AuthRepository } from '../../../auth/infrastructure/auth.repository';
import { assertUserBelongsToOrganization } from '../../domain/user-org-scope.policy';
import {
  USERS_REPOSITORY,
  type UsersRepositoryPort,
} from '../users.repository.port';
import { GetUserUseCase } from './get-user.use-case';

@Injectable()
export class UpdateUserStatusUseCase {
  constructor(
    @Inject(DATABASE) private readonly database: DatabaseClient,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepositoryPort,
    private readonly accessControlService: AccessControlService,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    private readonly authRepository: AuthRepository,
    private readonly getUserUseCase: GetUserUseCase,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    userId: string,
    status: UserStatus,
    requestContext?: RequestContext,
  ): Promise<UserView> {
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
        'You cannot change your own account status',
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
      await this.usersRepository.update(
        userId,
        {
          status,
          emailVerifiedAt:
            status === 'ACTIVE'
              ? (user.emailVerifiedAt ?? new Date())
              : user.emailVerifiedAt,
        },
        transaction,
      );

      if (status === 'BLOCKED') {
        await this.authRepository.revokeAllSessionsForUser(userId, transaction);
      }

      await this.auditWriter.log(
        {
          actorId: actor.userId,
          action: status === 'BLOCKED' ? 'user.blocked' : 'user.unblocked',
          entityType: 'user',
          entityId: userId,
          metadata: { status },
          requestContext,
        },
        transaction,
      );
    });

    return this.getUserUseCase.execute(userId, actor);
  }
}
