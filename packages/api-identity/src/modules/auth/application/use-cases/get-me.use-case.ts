import type { AuthenticatedRequestUser } from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { AppError, ERROR_CODES } from '@repo/api-core';

import {
  USERS_REPOSITORY,
  type UsersRepositoryPort,
} from '../../../users/application/ports/users.repository.port';
import { AuthMapper } from '../auth.mapper';

@Injectable()
export class GetMeUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: UsersRepositoryPort,
    private readonly authMapper: AuthMapper,
  ) {}

  async execute(user: AuthenticatedRequestUser) {
    const dbUser = await this.usersRepository.findById(user.userId);

    if (!dbUser) {
      throw new AppError(
        ERROR_CODES.USER_NOT_FOUND,
        'User not found',
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      user: this.authMapper.toUserView(dbUser, user.roles),
      permissions: user.permissions,
      sessionId: user.sessionId,
      organizationId: user.organizationId,
      mustChangePassword: dbUser.mustChangePassword,
    };
  }
}
