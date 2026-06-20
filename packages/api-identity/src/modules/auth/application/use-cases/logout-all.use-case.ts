import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';

import { Inject, Injectable } from '@nestjs/common';
import { AUDIT_WRITER, type AuditWriter } from '@repo/api-core';

import { AuthRepository } from '../../infrastructure/auth.repository';

@Injectable()
export class LogoutAllUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
  ) {}

  async execute(
    user: AuthenticatedRequestUser,
    requestContext?: RequestContext,
  ) {
    await this.authRepository.revokeAllSessionsForUser(user.userId);
    await this.auditWriter.log({
      actorId: user.userId,
      action: 'auth.logout_all',
      entityType: 'user',
      entityId: user.userId,
      requestContext,
    });
  }
}
