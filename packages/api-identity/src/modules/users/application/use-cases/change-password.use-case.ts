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

import {
  hashPassword,
  verifyPassword,
} from '../../../auth/application/auth.helpers';
import { AuthRepository } from '../../../auth/infrastructure/auth.repository';
import {
  USERS_REPOSITORY,
  type UsersRepositoryPort,
} from '../users.repository.port';

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    @Inject(DATABASE) private readonly database: DatabaseClient,
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepositoryPort,
    private readonly authRepository: AuthRepository,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
  ) {}

  async execute(
    actor: AuthenticatedRequestUser,
    currentPassword: string,
    newPassword: string,
    requestContext?: RequestContext,
  ) {
    const user = await this.usersRepository.findById(actor.userId);

    if (!user) {
      throw new AppError(
        ERROR_CODES.USER_NOT_FOUND,
        'User not found',
        HttpStatus.NOT_FOUND,
      );
    }

    const passwordMatches = await verifyPassword(
      user.passwordHash,
      currentPassword,
    );

    if (!passwordMatches) {
      throw new AppError(
        ERROR_CODES.AUTH_INVALID_CREDENTIALS,
        'Current password is incorrect',
        HttpStatus.UNAUTHORIZED,
      );
    }

    await runInTransaction(this.database, async (transaction) => {
      await this.usersRepository.update(
        actor.userId,
        {
          passwordHash: await hashPassword(newPassword),
        },
        transaction,
      );
      await this.authRepository.revokeAllSessionsForUser(
        actor.userId,
        transaction,
      );
      await this.auditWriter.log(
        {
          actorId: actor.userId,
          action: 'user.password.changed',
          entityType: 'user',
          entityId: actor.userId,
          requestContext,
        },
        transaction,
      );
    });
  }
}
