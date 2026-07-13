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

import { OrganizationsService } from '../../../organizations/application/organizations.service';
import { hashRefreshToken } from '../auth.helpers';
import {
  AUTH_SESSION_REPOSITORY,
  type AuthSessionRepositoryPort,
} from '../ports/auth-session.repository.port';
import {
  AUTH_TOKEN_PROVIDER,
  type AuthTokenProviderPort,
} from '../ports/auth-token.provider.port';

@Injectable()
export class SwitchOrganizationUseCase {
  constructor(
    private readonly organizationsService: OrganizationsService,
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
    await this.organizationsService.assertMembership(
      organizationId,
      user.userId,
    );

    const session = await this.authSessionRepository.findSessionForUser(
      user.sessionId,
      user.userId,
    );

    if (!session) {
      throw new AppError(
        ERROR_CODES.AUTH_SESSION_REVOKED,
        'Session not found',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const newAccessToken = await this.tokenProvider.signToken(
      user.userId,
      user.sessionId,
      'access',
      organizationId,
    );
    const newRefreshToken = await this.tokenProvider.signToken(
      user.userId,
      user.sessionId,
      'refresh',
      organizationId,
    );
    const newRefreshTokenHash = await hashRefreshToken(newRefreshToken);

    const rotated = await this.authSessionRepository.updateSessionIfMatches(
      user.sessionId,
      session.refreshTokenHash,
      { refreshTokenHash: newRefreshTokenHash },
    );

    if (!rotated) {
      throw new AppError(
        ERROR_CODES.AUTH_REFRESH_TOKEN_REUSED,
        'Session changed during organization switch',
        HttpStatus.CONFLICT,
      );
    }

    await this.auditWriter.log({
      actorId: user.userId,
      action: 'auth.organization.switched',
      entityType: 'organization',
      entityId: organizationId,
      requestContext,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
      organizationId,
    };
  }
}
