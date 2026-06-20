import type { AuthenticatedRequestUser } from '@repo/api-core';

import { HttpStatus, Injectable } from '@nestjs/common';
import { AppError, ERROR_CODES } from '@repo/api-core';

import { UsersRepository } from '../../../users/infrastructure/users.repository';
import { AuthMapper } from '../auth.mapper';

@Injectable()
export class GetMeUseCase {
  private readonly authMapper = new AuthMapper();

  constructor(private readonly usersRepository: UsersRepository) {}

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
    };
  }
}
