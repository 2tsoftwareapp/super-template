import type { AuthenticatedRequestUser, RequestContext } from "@repo/api-runtime";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import {AppError, SYSTEM_SCOPE } from "@repo/api-runtime";
import { AUDIT_WRITER, type AuditWriter } from "@repo/feature-audit/contracts";

import {
  AUTH_SESSION_REPOSITORY,
  type AuthSessionRepositoryPort,
} from "../ports/auth-session.repository.port";

@Injectable()
export class RevokeSessionUseCase {
  constructor(
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly authSessionRepository: AuthSessionRepositoryPort,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
  ) {}

  async execute(
    user: AuthenticatedRequestUser,
    sessionId: string,
    requestContext?: RequestContext,
  ) {
    const session = await this.authSessionRepository.findSessionForUser(sessionId, user.userId);

    if (!session) {
      throw new AppError(
        AUTH_ERROR_CODES.AUTH_SESSION_REVOKED,
        "Session not found",
        HttpStatus.NOT_FOUND,
      );
    }

    await this.authSessionRepository.revokeSession(sessionId);
    await this.auditWriter.log({
      actorId: user.userId,
      action: "auth.session.revoked",
      entityType: "session",
      entityId: sessionId,
      requestContext,
      ...(user.organizationId
        ? { scope: SYSTEM_SCOPE.ORGANIZATION, organizationId: user.organizationId }
        : { scope: SYSTEM_SCOPE.PLATFORM }),
    });
  }
}

import { AUTH_ERROR_CODES } from "@repo/feature-auth/contracts";
