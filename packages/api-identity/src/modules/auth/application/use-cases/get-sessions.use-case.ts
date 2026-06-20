import type { AuthenticatedRequestUser } from '@repo/api-core';

import { Injectable } from '@nestjs/common';

import { AuthRepository } from '../../infrastructure/auth.repository';
import { AuthMapper } from '../auth.mapper';

@Injectable()
export class GetSessionsUseCase {
  private readonly authMapper = new AuthMapper();

  constructor(private readonly authRepository: AuthRepository) {}

  async execute(user: AuthenticatedRequestUser) {
    const sessions = await this.authRepository.listSessionsForUser(
      user.userId,
    );
    return sessions.map((session) =>
      this.authMapper.toSessionDto(session, user.sessionId),
    );
  }
}
