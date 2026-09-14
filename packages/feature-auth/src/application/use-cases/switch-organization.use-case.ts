import type { AuthenticatedRequestUser, RequestContext } from "@repo/api-kernel";

import { HttpStatus, Inject, Injectable } from "@nestjs/common";
import { AppError, SYSTEM_SCOPE } from "@repo/api-kernel";
import { AUDIT_WRITER, type AuditWriter } from "@repo/feature-audit/contracts";
import { AUTH_ERROR_CODES } from "@repo/feature-auth/contracts";

import {
  AUTH_ORGANIZATION_CONTEXT,
  type AuthOrganizationContext,
} from "../../public/auth-organization-context.port";
import {
  AUTH_SESSION_REPOSITORY,
  type AuthSessionRepositoryPort,
} from "../ports/auth-session.repository.port";
import { AUTH_TOKEN_PROVIDER, type AuthTokenProviderPort } from "../ports/auth-token.provider.port";

@Injectable()
export class SwitchOrganizationUseCase {
  constructor(
    @Inject(AUTH_ORGANIZATION_CONTEXT)
    private readonly organizationContext: AuthOrganizationContext,
    @Inject(AUTH_TOKEN_PROVIDER)
    private readonly tokenProvider: AuthTokenProviderPort,
    @Inject(AUTH_SESSION_REPOSITORY)
    private readonly authSessionRepository: AuthSessionRepositoryPort,
    @Inject(AUDIT_WRITER) private readonly auditWriter: AuditWriter,
  ) {}

  async execute(
    user: AuthenticatedRequestUser,
    organizationId: string,
    requestContext?: RequestContext,
  ) {
    await this.organizationContext.assertMembership(organizationId, user.userId);

    const session = await this.authSessionRepository.findSessionForUser(
      user.sessionId,
      user.userId,
    );

    if (!session) {
      throw new AppError(
        AUTH_ERROR_CODES.AUTH_SESSION_REVOKED,
        "Session not found",
        HttpStatus.UNAUTHORIZED,
      );
    }

    const metadata = {
      ipAddress: requestContext?.ipAddress ?? null,
      userAgent: requestContext?.userAgent ?? null,
    };

    const rotated = await this.tokenProvider.tryRotateSessionTokens(
      user.sessionId,
      session.refreshTokenHash,
      user.userId,
      organizationId,
      metadata,
    );

    if (!rotated) {
      throw new AppError(
        AUTH_ERROR_CODES.AUTH_REFRESH_TOKEN_REUSED,
        "Session changed during organization switch",
        HttpStatus.CONFLICT,
      );
    }

    await this.auditWriter.log({
      actorId: user.userId,
      action: "auth.organization.switched",
      entityType: "organization",
      entityId: organizationId,
      requestContext,
      ...(organizationId
        ? { scope: SYSTEM_SCOPE.ORGANIZATION, organizationId: organizationId }
        : { scope: SYSTEM_SCOPE.PLATFORM }),
    });

    return {
      accessToken: rotated.accessToken,
      refreshToken: rotated.refreshToken,
      organizationId,
    };
  }
}
