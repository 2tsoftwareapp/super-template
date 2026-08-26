import type { AuthenticatedRequestUser, RequestContext } from "@repo/api-runtime";

import { Inject, Injectable } from "@nestjs/common";
import { AUDIT_WRITER, type AuditWriter, SYSTEM_SCOPE } from "@repo/api-runtime";

import {
  AUTH_SESSION_REPOSITORY,
  type AuthSessionRepositoryPort,
} from "../ports/auth-session.repository.port";

@Injectable()
export class LogoutUseCase {
  constructor(
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly authSessionRepository: AuthSessionRepositoryPort,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
  ) {}

  async execute(user: AuthenticatedRequestUser, requestContext?: RequestContext) {
    await this.authSessionRepository.revokeSession(user.sessionId);
    await this.auditWriter.log({
      actorId: user.userId,
      action: "auth.logout",
      entityType: "session",
      entityId: user.sessionId,
      requestContext,
      ...(user.organizationId
        ? { scope: SYSTEM_SCOPE.ORGANIZATION, organizationId: user.organizationId }
        : { scope: SYSTEM_SCOPE.PLATFORM }),
    });
  }
}
