import type {
  AuthenticatedRequestUser,
  RequestContext,
} from '@repo/api-core';

import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import {
  AppError,
  AUDIT_WRITER,
  type AuditWriter,
  ERROR_CODES,
} from '@repo/api-core';

import { AuthRepository } from '../../infrastructure/auth.repository';

@Injectable()
export class RevokeSessionUseCase {
  constructor(
    private readonly authRepository: AuthRepository,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
  ) {}

  async execute(
    user: AuthenticatedRequestUser,
    sessionId: string,
    requestContext?: RequestContext,
  ) {
    const session = await this.authRepository.findSessionForUser(
      sessionId,
      user.userId,
    );

    if (!session) {
      throw new AppError(
        ERROR_CODES.AUTH_SESSION_REVOKED,
        'Session not found',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.authRepository.revokeSession(sessionId);
    await this.auditWriter.log({
      actorId: user.userId,
      action: 'auth.session.revoked',
      entityType: 'session',
      entityId: sessionId,
      requestContext,
    });
  }
}
