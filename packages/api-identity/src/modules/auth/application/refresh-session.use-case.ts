import type { RequestContext } from '@repo/api-core';

import { HttpStatus, Injectable } from '@nestjs/common';
import { AppError, ERROR_CODES } from '@repo/api-core';

import type { RefreshTokenDto } from '../presentation/auth.dto';

import { AccessControlService } from '../../access-control/application/access-control.service';
import { OrganizationsService } from '../../organizations/application/organizations.service';
import { UsersRepository } from '../../users/infrastructure/users.repository';
import { AuthRepository } from '../infrastructure/auth.repository';
import { verifyRefreshTokenHash } from './auth.helpers';
import { AuthMapper } from './auth.mapper';
import { SessionTokenService } from './session-token.service';

@Injectable()
export class RefreshSessionUseCase {
  private readonly authMapper = new AuthMapper();

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly usersRepository: UsersRepository,
    private readonly accessControlService: AccessControlService,
    private readonly organizationsService: OrganizationsService,
    private readonly sessionTokenService: SessionTokenService,
  ) {}

  async execute(input: RefreshTokenDto, requestContext?: RequestContext) {
    const payload = await this.sessionTokenService.verifyToken(
      input.refreshToken,
      'refresh',
    );
    const session = await this.authRepository.findSessionForUser(
      payload.sid,
      payload.sub,
    );

    if (!session) {
      throw new AppError(
        ERROR_CODES.AUTH_SESSION_REVOKED,
        'Session is no longer available',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (session.revokedAt) {
      throw new AppError(
        ERROR_CODES.AUTH_SESSION_REVOKED,
        'Session has been revoked',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (session.expiresAt <= new Date()) {
      await this.authRepository.revokeSession(session.id);
      throw new AppError(
        ERROR_CODES.AUTH_SESSION_EXPIRED,
        'Session has expired',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const refreshTokenMatches = await verifyRefreshTokenHash(
      session.refreshTokenHash,
      input.refreshToken,
    );

    if (!refreshTokenMatches) {
      await this.authRepository.revokeSession(session.id);
      throw new AppError(
        ERROR_CODES.AUTH_REFRESH_TOKEN_REUSED,
        'Refresh token reuse detected',
        HttpStatus.UNAUTHORIZED,
      );
    }

    const user = await this.usersRepository.findById(session.userId);

    if (user?.status !== 'ACTIVE') {
      await this.authRepository.revokeSession(session.id);
      throw new AppError(
        ERROR_CODES.AUTH_FORBIDDEN,
        'The account is not active',
        HttpStatus.FORBIDDEN,
      );
    }

    const accessProfile = await this.accessControlService.getAccessProfile(
      user.id,
    );
    const organizationId =
      await this.organizationsService.resolveOrganizationIdForUser(
        user.id,
        payload.oid,
      );
    const refreshedSession = await this.sessionTokenService.rotateSessionTokens(
      session.id,
      session.refreshTokenHash,
      user.id,
      organizationId,
      {
        ipAddress: requestContext?.ipAddress ?? null,
        userAgent: requestContext?.userAgent ?? null,
      },
    );

    return {
      accessToken: refreshedSession.accessToken,
      refreshToken: refreshedSession.refreshToken,
      user: this.authMapper.toUserView(user, accessProfile.roles),
      permissions: accessProfile.permissions,
      organizationId,
      session: this.authMapper.toSessionDto(
        refreshedSession.session,
        refreshedSession.session.id,
      ),
    };
  }
}
