import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';

import { Inject, Injectable } from '@nestjs/common';
import { AUDIT_WRITER, type AuditWriter } from '@repo/api-core';

import {
  AUTH_SESSION_REPOSITORY,
  type AuthSessionRepositoryPort,
} from '../ports/auth-session.repository.port';

@Injectable()
export class LogoutAllUseCase {
  constructor(
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly authSessionRepository: AuthSessionRepositoryPort,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
  ) {}

  async execute(
    user: AuthenticatedRequestUser,
    requestContext?: RequestContext,
  ) {
    await this.authSessionRepository.revokeAllSessionsForUser(user.userId);
    await this.auditWriter.log({
      actorId: user.userId,
      action: 'auth.logout_all',
      entityType: 'user',
      entityId: user.userId,
      requestContext,
    });
  }
}
