import type { AuthenticatedRequestUser } from '@repo/api-core';

import { Inject, Injectable } from '@nestjs/common';

import { AuthMapper } from '../auth.mapper';
import {
  AUTH_SESSION_REPOSITORY,
  type AuthSessionRepositoryPort,
} from '../ports/auth-session.repository.port';

@Injectable()
export class GetSessionsUseCase {
  private readonly authMapper = new AuthMapper();

  constructor(
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly authSessionRepository: AuthSessionRepositoryPort,
  ) {}

  async execute(user: AuthenticatedRequestUser) {
    const sessions = await this.authSessionRepository.listSessionsForUser(
      user.userId,
    );
    return sessions.map((session) =>
      this.authMapper.toSessionDto(session, user.sessionId),
    );
  }
}
