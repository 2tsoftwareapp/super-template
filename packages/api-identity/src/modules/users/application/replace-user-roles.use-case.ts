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

import type { UserView } from './users.types';

import { AccessControlService } from '../../access-control/application/access-control.service';
import { GetUserUseCase } from './get-user.use-case';
import {
  USERS_REPOSITORY,
  type UsersRepositoryPort,
} from './users.repository.port';

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
    roleIds: string[],
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

    const [currentAccess, desiredRoles] = await Promise.all([
      this.accessControlService.getAccessProfile(userId),
      this.accessControlService.validateRoleIds(roleIds),
    ]);

    this.accessControlService.assertCanAssignUserRoles(
      actor,
      currentAccess.roles,
      desiredRoles.map((role) => role.name),
    );

    await runInTransaction(this.database, async (transaction) => {
      await this.accessControlService.replaceUserRoles(
        userId,
        roleIds,
        transaction,
      );
      await this.auditWriter.log(
        {
          actorId: actor.userId,
          action: 'user.roles.replaced',
          entityType: 'user',
          entityId: userId,
          metadata: {
            roleIds,
          },
          requestContext,
        },
        transaction,
      );
    });

    return this.getUserUseCase.execute(userId);
  }
}
