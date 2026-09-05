import type { AuthenticatedRequestUser } from "@repo/api-kernel";

import { Inject, Injectable } from "@nestjs/common";

import { AuthMapper } from "../auth.mapper";
import {
  AUTH_SESSION_REPOSITORY,
  type AuthSessionRepositoryPort,
} from "../ports/auth-session.repository.port";

@Injectable()
export class GetSessionsUseCase {
  constructor(
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly authSessionRepository: AuthSessionRepositoryPort,
    private readonly authMapper: AuthMapper,
  ) {}

  async execute(user: AuthenticatedRequestUser) {
    const sessions = await this.authSessionRepository.listSessionsForUser(user.userId);
    return sessions.map((session) => this.authMapper.toSessionDto(session, user.sessionId));
  }
}
