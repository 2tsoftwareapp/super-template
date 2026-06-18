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
  normalizeEmail,
} from '@repo/api-core';
import { DATABASE, runInTransaction } from '@repo/api-database';

import type { UpdateAdminUserCommand, UserStatus, UserView } from './users.types';

import { AccessControlService } from '../../access-control/application/access-control.service';
import { hashPassword } from '../../auth/application/auth.helpers';
import { AuthRepository } from '../../auth/infrastructure/auth.repository';
import { assertUserBelongsToOrganization } from '../domain/user-org-scope.policy';
import { GetUserUseCase } from './get-user.use-case';
import {
  USERS_REPOSITORY,
  type UsersRepositoryPort,
} from './users.repository.port';

@Injectable()
export class AdminUserManagementUseCase {
  constructor(
    @Inject(DATABASE) private readonly database: DatabaseClient,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepositoryPort,
    private readonly accessControlService: AccessControlService,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
    private readonly authRepository: AuthRepository,
    private readonly getUserUseCase: GetUserUseCase,
  ) {}

  async update(
    actor: AuthenticatedRequestUser,
    userId: string,
    input: UpdateAdminUserCommand,
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

    const targetProfile =
      await this.accessControlService.getAccessProfile(userId);
    this.accessControlService.assertCanManageUserAccount(
      actor,
      targetProfile.roles,
    );

    if (input.email) {
      await this.usersRepository.assertEmailAvailable(
        normalizeEmail(input.email),
        undefined,
        userId,
      );
    }

    const updated = await this.usersRepository.update(userId, {
      email: input.email ? normalizeEmail(input.email) : user.email,
      displayName: input.displayName ?? user.displayName,
      avatarUrl:
        input.avatarUrl === undefined ? user.avatarUrl : input.avatarUrl,
      status: input.status ?? user.status,
      passwordHash: input.password
        ? await hashPassword(input.password)
        : user.passwordHash,
      emailVerifiedAt:
        input.status === 'PENDING'
          ? null
          : (user.emailVerifiedAt ?? new Date()),
    });

    await this.auditWriter.log({
      actorId: actor.userId,
      action: 'admin.user.updated',
      entityType: 'user',
      entityId: userId,
      requestContext,
    });

    return this.getUserUseCase.execute(updated?.id ?? userId, actor);
  }

  async delete(
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

  async updateStatus(
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

    const targetProfile =
      await this.accessControlService.getAccessProfile(userId);
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
