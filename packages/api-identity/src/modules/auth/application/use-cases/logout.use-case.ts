import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';

import { Inject, Injectable } from '@nestjs/common';
import { AUDIT_WRITER, type AuditWriter } from '@repo/api-core';

import { AuthRepository } from '../../infrastructure/auth.repository';

@Injectable()
export class LogoutUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
  ) {}

  async execute(
    user: AuthenticatedRequestUser,
    requestContext?: RequestContext,
  ) {
    await this.authRepository.revokeSession(user.sessionId);
    await this.auditWriter.log({
      actorId: user.userId,
      action: 'auth.logout',
      entityType: 'session',
      entityId: user.sessionId,
      requestContext,
    });
  }
}
